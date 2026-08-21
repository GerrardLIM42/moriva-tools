/* MORIVA 공용 동기화 모듈
 *
 * 역할이 두 가지로 나뉜다.
 *  1) 상위 프레임(index.html 셸): 설정 보관, GitHub 읽기/쓰기, 사이드바 상태 표시를 모두 담당.
 *     localStorage뿐 아니라 저장 보관함(moriva-saves.js)의 IndexedDB 목록도 함께 백업한다.
 *  2) 하위 프레임(각 도구 페이지): localStorage 변경, 저장 보관함 저장 알림을 감지해 부모에게 알린다.
 *     같은 출처(origin)라 localStorage·IndexedDB는 공유되므로, 실제 백업은 부모가 한 번만 수행한다.
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
  var pushBusy = false;   // 지금 PUT 요청이 진행 중이면 true — 동시에 두 번 저장 시도해 sha 충돌 나는 것 방지
  var pushQueued = false; // 진행 중일 때 또 저장 요청이 오면 표시해뒀다가 끝나고 한 번 더 실행

  /* 동기화에서 빼는 항목
     1) 내부 설정값
     2) API 키·토큰류 — 보안상 각 브라우저에만 보관한다
     3) 소싱 후보(sourcing-items)와 그 요약 — 이 도구는 자체 서버(Cloudflare Worker)로
        이미 기기 간 동기화를 하고 있다. 여기서 또 백업하면 오래된 사본이 최신 데이터를
        덮어쓸 수 있어 일부러 제외한다. */
  var SKIP_KEYS = ["sourcing-items", "moriva_manifest_summary_v1"];
  function isInternal(k) {
    if (k === CFG_KEY || k === STAMP_KEY) return true;
    if (SKIP_KEYS.indexOf(k) !== -1) return true;
    return /key|token|github_config/i.test(k);
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

  /* 저장 보관함(moriva-saves.js)의 IndexedDB 목록도 함께 백업한다.
     레코드 하나는 도구 하나의 저장 목록 전체(예: 가격 세팅 도구의 모든 저장 항목)이며,
     사진·동영상이 포함돼 너무 크면(약 200KB 초과) GitHub API 한도를 넘을 수 있어
     그 레코드만 이 기기에 남기고 백업에서 건너뛴다(로컬 데이터는 그대로 유지됨). */
  var SAVES_DB_NAME = "moriva_saves_db_v1";
  var SAVES_STORE = "lists";
  var SAVES_MAX_BYTES = 200000;
  var savesDbPromise = null;

  function openSavesDb() {
    if (savesDbPromise) return savesDbPromise;
    savesDbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error("IndexedDB 미지원")); return; }
      var req;
      try { req = indexedDB.open(SAVES_DB_NAME, 1); } catch (e) { reject(e); return; }
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(SAVES_STORE)) db.createObjectStore(SAVES_STORE, { keyPath: "storeKey" });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error("IndexedDB 열기 실패")); };
      req.onblocked = function () { reject(new Error("IndexedDB 열기 지연")); };
    });
    return savesDbPromise;
  }

  function readSyncableSaves() {
    return openSavesDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(SAVES_STORE, "readonly");
        var req = tx.objectStore(SAVES_STORE).getAll();
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror = function () { reject(req.error); };
      });
    }).then(function (records) {
      return records.filter(function (r) {
        try { return JSON.stringify(r).length <= SAVES_MAX_BYTES; } catch (e) { return false; }
      });
    }).catch(function () { return []; });
  }

  // remote.saves에 있는 storeKey만 통째로 덮어쓴다(upsert). 용량 초과로 백업에서
  // 빠진 로컬 전용 레코드는 remote에 없다고 해서 지우지 않는다 — 그 기기에만 있는
  // 이미지 포함 저장 항목을 실수로 삭제하는 걸 막기 위해서다.
  function writeAllSaves(records) {
    if (!records || !records.length) return Promise.resolve();
    return openSavesDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(SAVES_STORE, "readwrite");
        records.forEach(function (r) { tx.objectStore(SAVES_STORE).put(r); });
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error || new Error("저장 중단")); };
      });
    }).catch(function () {});
  }

  function buildSnapshot() {
    return readSyncableSaves().then(function (saves) {
      var keys = {};
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!isInternal(k)) keys[k] = localStorage.getItem(k);
      }
      return { savedAt: Date.now(), keys: keys, saves: saves };
    });
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
    return writeAllSaves(snap.saves || []);
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

  /* data.json은 여러 탭·기기가 동시에 건드릴 수 있는 공용 파일이라, GitHub은 저장 직전 sha가
     최신인지 확인한다(낙관적 동시성 제어). 두 저장 요청이 겹치면 나중 요청의 sha가 곧바로
     낡아버려 "does not match" 충돌이 난다. 이를 막기 위해
       1) 이 탭에서는 한 번에 하나의 저장만 진행하고(pushBusy), 그 사이 또 요청이 오면 큐에 쌓았다가
          끝난 뒤 최신 데이터로 다시 한 번 저장한다.
       2) 그래도 충돌하면(다른 탭·기기가 먼저 저장한 경우) 최신 sha를 다시 받아와 몇 차례 재시도한다. */
  function pushRemote() {
    if (!cfg || !cfg.token) return Promise.resolve();
    if (pushBusy) { pushQueued = true; return Promise.resolve(); }
    pushBusy = true;
    return attempt(0).catch(function (err) {
      status("오류: " + err.message, "err");
    }).then(function () {
      pushBusy = false;
      if (pushQueued) { pushQueued = false; pushRemote(); }
    });

    function attempt(retryCount) {
      status("저장 중…", "busy");
      return buildSnapshot().then(function (snap) {
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
          if ((res.status === 409 || res.status === 422) && retryCount < 3) {
            return fetchRemote().then(function () { return attempt(retryCount + 1); });
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
        });
      });
    }
  }

  function schedule() {
    if (!cfg || !cfg.token) return;
    if (timer) clearTimeout(timer);
    status("변경 대기…", "busy");
    timer = setTimeout(function () { pushRemote(); }, DELAY);
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
    if (timer) { clearTimeout(timer); timer = null; } // 대기 중이던 자동저장과 겹치지 않도록 취소
    cfg = nextCfg;
    fileSha = null;
    origSet.call(localStorage, CFG_KEY, JSON.stringify(cfg));
    status("연결 확인 중…", "busy");
    fetchRemote().then(function (remote) {
      var hasKeys = remote && remote.keys && Object.keys(remote.keys).length;
      var hasSaves = remote && remote.saves && remote.saves.length;
      if (hasKeys || hasSaves) {
        var useRemote = confirm("저장소에 이미 백업된 데이터가 있어요. 불러와서 이 브라우저에 적용할까요?\n(취소하면 이 브라우저의 현재 데이터로 백업을 덮어씁니다)");
        if (useRemote) {
          applySnapshot(remote).then(function () {
            status("불러옴 — 새로고침합니다", "ok");
            location.reload();
          });
          return;
        }
      }
      return pushRemote();
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
        applySnapshot(remote).then(function () { location.reload(); });
        return;
      }
      status("연결됨 " + new Date().toLocaleTimeString("ko-KR"), "ok");
    }).catch(function (err) {
      status("오류: " + err.message, "err");
    });
  })();
})();
