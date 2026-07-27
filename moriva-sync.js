/* MORIVA 공용 동기화 모듈
 *
 * 역할이 두 가지로 나뉜다.
 *  1) 상위 프레임(index.html 셸): 설정 보관, GitHub 읽기/쓰기, 사이드바 상태 표시를 모두 담당.
 *  2) 하위 프레임(각 도구 페이지): localStorage 변경만 감지해 부모에게 알린다.
 *     같은 출처(origin)라 localStorage는 공유되므로, 저장은 부모가 한 번만 수행한다.
 *
 * 또한 도구 페이지를 주소창으로 직접 열었을 때는 사이드바가 있는 셸로 자동 이동시켜
 * 어느 경로로 들어와도 항상 동일한 화면 구성을 유지한다.
 * 토큰은 이 브라우저의 localStorage에만 저장되며 저장소 코드에는 포함되지 않는다.
 */
(function () {
  "use strict";

  var CFG_KEY = "moriva_sync_config_v1";
  var STAMP_KEY = "moriva_sync_applied_stamp";
  var DATA_PATH = "data.json";
  var DELAY = 3000;

  var origSet = Storage.prototype.setItem;
  var origRemove = Storage.prototype.removeItem;

  var isTop = (window.top === window.self);
  var fileName = (location.pathname.split("/").pop() || "").toLowerCase();
  var isShell = (fileName === "" || fileName === "index.html");

  /* ── 도구 페이지를 단독으로 열면 셸로 이동 (사이드바 유지) ──
     ?solo=1 이 붙어 있으면(셸의 iframe, 또는 "새 창으로 열기") 그대로 둔다. */
  if (isTop && !isShell && location.search.indexOf("solo=1") === -1) {
    var id = fileName.replace(/\.html$/, "");
    if (id && id !== "home") {
      location.replace("./index.html#" + id);
      return;
    }
  }

  /* ══════════ 하위 프레임: 변경 알림만 ══════════ */
  if (!isTop) {
    Storage.prototype.setItem = function (k, v) {
      origSet.apply(this, arguments);
      if (this === window.localStorage) notifyParent(k);
    };
    Storage.prototype.removeItem = function (k) {
      origRemove.apply(this, arguments);
      if (this === window.localStorage) notifyParent(k);
    };
    function notifyParent(k) {
      if (k === CFG_KEY || k === STAMP_KEY) return;
      try { window.parent.postMessage({ type: "moriva-storage-changed" }, "*"); } catch (e) {}
    }
    return;
  }

  /* ══════════ 상위 프레임: 실제 동기화 ══════════ */
  var cfg = null;
  try { cfg = JSON.parse(localStorage.getItem(CFG_KEY)); } catch (e) {}
  var fileSha = null;
  var timer = null;

  // 동기화 제외: 내부 키 + API 키/토큰류(보안상 각 브라우저에만 보관)
  function isInternal(k) {
    return k === CFG_KEY || k === STAMP_KEY || /key|token|github_config/i.test(k);
  }

  function status(text, kind) {
    if (typeof window.MORIVA_SYNC_UI === "function") window.MORIVA_SYNC_UI(text, kind || "");
  }

  function b64enc(s) { return btoa(unescape(encodeURIComponent(s))); }
  function b64dec(s) { return decodeURIComponent(escape(atob(s))); }

  function apiUrl() {
    return "https://api.github.com/repos/" + encodeURIComponent(cfg.owner) +
      "/" + encodeURIComponent(cfg.repo) + "/contents/" + DATA_PATH;
  }
  function headers() {
    return { "Authorization": "token " + cfg.token, "Accept": "application/vnd.github+json" };
  }

  function snapshot() {
    var keys = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!isInternal(k)) keys[k] = localStorage.getItem(k);
    }
    return { savedAt: Date.now(), keys: keys };
  }

  function applySnapshot(snap) {
    var remote = snap.keys || {};
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!isInternal(k) && !(k in remote)) toRemove.push(k);
    }
    toRemove.forEach(function (k) { origRemove.call(localStorage, k); });
    Object.keys(remote).forEach(function (k) { origSet.call(localStorage, k, remote[k]); });
    origSet.call(localStorage, STAMP_KEY, String(snap.savedAt));
  }

  function fetchRemote() {
    return fetch(apiUrl() + "?ref=" + encodeURIComponent(cfg.branch || "main"), { headers: headers() })
      .then(function (res) {
        if (res.status === 404) { fileSha = null; return null; }
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (b) {
            throw new Error(b.message || ("읽기 실패 " + res.status));
          });
        }
        return res.json().then(function (d) {
          fileSha = d.sha;
          try { return JSON.parse(b64dec(d.content.replace(/\n/g, ""))); } catch (e) { return null; }
        });
      });
  }

  function pushRemote(isRetry) {
    if (!cfg || !cfg.token) return Promise.resolve();
    status("저장 중…", "busy");
    var snap = snapshot();
    var body = {
      message: "MORIVA sync",
      content: b64enc(JSON.stringify(snap)),
      branch: cfg.branch || "main"
    };
    if (fileSha) body.sha = fileSha;
    return fetch(apiUrl(), {
      method: "PUT",
      headers: Object.assign({ "Content-Type": "application/json" }, headers()),
      body: JSON.stringify(body)
    }).then(function (res) {
      if ((res.status === 409 || res.status === 422) && !isRetry) {
        return fetchRemote().then(function () { return pushRemote(true); });
      }
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (b) {
          throw new Error(b.message || ("저장 실패 " + res.status));
        });
      }
      return res.json().then(function (d) {
        fileSha = d.content.sha;
        origSet.call(localStorage, STAMP_KEY, String(snap.savedAt));
        status("저장됨 " + new Date().toLocaleTimeString("ko-KR"), "ok");
      });
    }).catch(function (err) {
      status("오류: " + err.message, "err");
    });
  }

  function schedule() {
    if (!cfg || !cfg.token) return;
    if (timer) clearTimeout(timer);
    status("변경 대기…", "busy");
    timer = setTimeout(function () { pushRemote(false); }, DELAY);
  }

  // 셸 자신의 localStorage 변경 감지
  Storage.prototype.setItem = function (k, v) {
    origSet.apply(this, arguments);
    if (this === window.localStorage && !isInternal(k)) schedule();
  };
  Storage.prototype.removeItem = function (k) {
    origRemove.apply(this, arguments);
    if (this === window.localStorage && !isInternal(k)) schedule();
  };

  // 하위 프레임(도구)에서 온 변경 알림
  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "moriva-storage-changed") schedule();
  });

  /* 셸 UI가 호출하는 함수 */
  window.MORIVA_SYNC_CONNECT = function (nextCfg) {
    cfg = nextCfg;
    fileSha = null;
    origSet.call(localStorage, CFG_KEY, JSON.stringify(cfg));
    status("연결 확인 중…", "busy");
    fetchRemote().then(function (remote) {
      if (remote && remote.keys && Object.keys(remote.keys).length) {
        var useRemote = confirm("저장소에 이미 백업된 데이터가 있어요. 불러와서 이 브라우저에 적용할까요?\n(취소하면 이 브라우저의 현재 데이터로 백업을 덮어씁니다)");
        if (useRemote) {
          applySnapshot(remote);
          status("불러옴 — 새로고침합니다", "ok");
          location.reload();
          return;
        }
      }
      return pushRemote(false);
    }).catch(function (err) {
      status("오류: " + err.message, "err");
    });
  };

  window.MORIVA_SYNC_DISCONNECT = function () {
    cfg = null;
    fileSha = null;
    origRemove.call(localStorage, CFG_KEY);
    if (timer) clearTimeout(timer);
    status("연동 안 됨", "");
  };

  /* 시작 시 최신 데이터 확인 */
  (function init() {
    if (!cfg || !cfg.token || !cfg.owner || !cfg.repo) { status("연동 안 됨", ""); return; }
    status("확인 중…", "busy");
    fetchRemote().then(function (remote) {
      if (remote && remote.savedAt && String(remote.savedAt) !== localStorage.getItem(STAMP_KEY)) {
        applySnapshot(remote);
        location.reload();
        return;
      }
      status("연결됨 " + new Date().toLocaleTimeString("ko-KR"), "ok");
    }).catch(function (err) {
      status("오류: " + err.message, "err");
    });
  })();
})();
