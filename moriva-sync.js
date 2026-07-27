/* MORIVA 공용 동기화 모듈
 * 모든 도구 페이지에 삽입되어, 이 사이트의 localStorage 데이터 전체를
 * 사용자의 비공개 GitHub 저장소(data.json)에 자동 백업하고,
 * 다른 브라우저/기기에서 열면 최신 데이터를 자동으로 내려받아 동일하게 보여준다.
 * 토큰은 이 브라우저의 localStorage에만 저장되며 사이트 코드에는 포함되지 않는다.
 */
(function () {
  "use strict";
  var CFG_KEY = "moriva_sync_config_v1";
  var STAMP_KEY = "moriva_sync_applied_stamp";
  var DATA_PATH = "data.json";
  var DELAY = 3000;

  var origSet = Storage.prototype.setItem;
  var origRemove = Storage.prototype.removeItem;

  var cfg = null;
  try { cfg = JSON.parse(localStorage.getItem(CFG_KEY)); } catch (e) {}
  var fileSha = null;
  var timer = null;

  function isInternal(k) { return k === CFG_KEY || k === STAMP_KEY; }

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
    // 원본 setItem을 써서 다시 push가 예약되지 않게 한다
    var remoteKeys = snap.keys || {};
    // 원격에 없는 로컬 키 제거(내부 키 제외)
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!isInternal(k) && !(k in remoteKeys)) toRemove.push(k);
    }
    toRemove.forEach(function (k) { origRemove.call(localStorage, k); });
    Object.keys(remoteKeys).forEach(function (k) {
      origSet.call(localStorage, k, remoteKeys[k]);
    });
    origSet.call(localStorage, STAMP_KEY, String(snap.savedAt));
  }

  function fetchRemote() {
    return fetch(apiUrl() + "?ref=" + encodeURIComponent(cfg.branch || "main"), { headers: headers() })
      .then(function (res) {
        if (res.status === 404) { fileSha = null; return null; }
        if (!res.ok) return res.json().catch(function () { return {}; }).then(function (b) {
          throw new Error(b.message || ("읽기 실패 " + res.status));
        });
        return res.json().then(function (d) {
          fileSha = d.sha;
          try { return JSON.parse(b64dec(d.content.replace(/\n/g, ""))); }
          catch (e) { return null; }
        });
      });
  }

  function pushRemote(isRetry) {
    if (!cfg) return Promise.resolve();
    setStatus("저장 중...", "busy");
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
      if (!res.ok) return res.json().catch(function () { return {}; }).then(function (b) {
        throw new Error(b.message || ("저장 실패 " + res.status));
      });
      return res.json().then(function (d) {
        fileSha = d.content.sha;
        origSet.call(localStorage, STAMP_KEY, String(snap.savedAt));
        setStatus("저장됨 " + new Date().toLocaleTimeString("ko-KR"), "ok");
      });
    }).catch(function (err) {
      setStatus("오류: " + err.message, "err");
    });
  }

  function schedule() {
    if (!cfg || !cfg.token) return;
    if (timer) clearTimeout(timer);
    setStatus("변경 대기...", "busy");
    timer = setTimeout(function () { pushRemote(false); }, DELAY);
  }

  // localStorage 변경 감지 (도구 코드는 수정하지 않고 전역으로 가로챔)
  Storage.prototype.setItem = function (k, v) {
    origSet.apply(this, arguments);
    if (this === window.localStorage && !isInternal(k)) schedule();
  };
  Storage.prototype.removeItem = function (k) {
    origRemove.apply(this, arguments);
    if (this === window.localStorage && !isInternal(k)) schedule();
  };

  /* ---------- UI ---------- */
  var css = "#mvSyncBtn{position:fixed;right:16px;bottom:16px;z-index:99999;width:44px;height:44px;border-radius:50%;border:1px solid #DCD5C3;background:#FFFDF8;box-shadow:0 4px 14px rgba(27,42,61,.18);cursor:pointer;font-size:19px;display:flex;align-items:center;justify-content:center;}"
    + "#mvSyncDot{position:absolute;top:2px;right:2px;width:11px;height:11px;border-radius:50%;background:#8B95A1;border:2px solid #FFFDF8;}"
    + "#mvSyncDot.ok{background:#4F7864}#mvSyncDot.err{background:#B8453A}#mvSyncDot.busy{background:#D98E3D}"
    + "#mvSyncOv{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100000;display:none;align-items:center;justify-content:center;font-family:-apple-system,'Malgun Gothic',sans-serif;}"
    + "#mvSyncOv.show{display:flex}"
    + "#mvSyncModal{background:#FFFDF8;border-radius:14px;width:380px;max-width:92vw;padding:22px;color:#1B2A3D;max-height:88vh;overflow-y:auto;}"
    + "#mvSyncModal h3{margin:0 0 6px;font-size:16px}"
    + "#mvSyncModal p.mv-desc{margin:0 0 14px;font-size:12px;color:#8B95A1;line-height:1.6}"
    + ".mv-f{margin-bottom:11px}.mv-f label{display:block;font-size:12px;font-weight:700;color:#8B95A1;margin-bottom:4px}"
    + ".mv-f input{width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #DCD5C3;border-radius:8px;font-size:14px}"
    + "#mvSyncStatusText{font-size:12px;color:#8B95A1;margin:4px 0 12px;line-height:1.5}"
    + ".mv-actions{display:flex;gap:8px}.mv-actions button{flex:1;padding:10px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}"
    + "#mvSyncOff{background:#fff;border:1px solid #DCD5C3;color:#8B95A1}"
    + "#mvSyncSave{background:#1B2A3D;border:none;color:#fff}";

  var statusEl = null, dotEl = null;
  function setStatus(text, kind) {
    if (dotEl) dotEl.className = kind === "ok" ? "ok" : kind === "err" ? "err" : kind === "busy" ? "busy" : "";
    if (dotEl) dotEl.id = "mvSyncDot", dotEl.classList.toggle("ok", kind === "ok"), dotEl.classList.toggle("err", kind === "err"), dotEl.classList.toggle("busy", kind === "busy");
    if (statusEl) statusEl.textContent = text;
  }

  function buildUI() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var btn = document.createElement("button");
    btn.id = "mvSyncBtn";
    btn.title = "MORIVA 동기화 설정";
    btn.innerHTML = "☁<span id='mvSyncDot'></span>";
    document.body.appendChild(btn);
    dotEl = btn.querySelector("#mvSyncDot");

    var ov = document.createElement("div");
    ov.id = "mvSyncOv";
    ov.innerHTML = "<div id='mvSyncModal'>"
      + "<h3>☁ 브라우저 간 동기화</h3>"
      + "<p class='mv-desc'>모든 도구의 데이터를 내 비공개 GitHub 저장소에 자동 백업합니다. 다른 브라우저·기기에서도 같은 설정을 입력하면 동일한 데이터가 보여요. 토큰은 이 브라우저에만 저장됩니다.</p>"
      + "<div class='mv-f'><label>Personal Access Token</label><input type='password' id='mvTok' placeholder='github_pat_... 또는 ghp_...'></div>"
      + "<div class='mv-f'><label>GitHub 사용자명</label><input type='text' id='mvOwner' placeholder='GerrardLIM42'></div>"
      + "<div class='mv-f'><label>데이터 저장소 이름 (비공개 권장)</label><input type='text' id='mvRepo' placeholder='moriva-data'></div>"
      + "<div class='mv-f'><label>브랜치</label><input type='text' id='mvBranch' placeholder='main'></div>"
      + "<div id='mvSyncStatusText'>연동 안 됨</div>"
      + "<div class='mv-actions'><button id='mvSyncOff'>연결 해제</button><button id='mvSyncSave'>저장하고 연결</button></div>"
      + "</div>";
    document.body.appendChild(ov);
    statusEl = ov.querySelector("#mvSyncStatusText");

    btn.addEventListener("click", function () {
      ov.querySelector("#mvTok").value = cfg ? cfg.token : "";
      ov.querySelector("#mvOwner").value = cfg ? cfg.owner : "";
      ov.querySelector("#mvRepo").value = cfg ? cfg.repo : "moriva-data";
      ov.querySelector("#mvBranch").value = (cfg && cfg.branch) || "main";
      ov.classList.add("show");
    });
    ov.addEventListener("click", function (e) { if (e.target === ov) ov.classList.remove("show"); });

    ov.querySelector("#mvSyncSave").addEventListener("click", function () {
      var token = ov.querySelector("#mvTok").value.trim();
      var owner = ov.querySelector("#mvOwner").value.trim();
      var repo = ov.querySelector("#mvRepo").value.trim();
      var branch = ov.querySelector("#mvBranch").value.trim() || "main";
      if (!token || !owner || !repo) { alert("토큰, 사용자명, 저장소 이름을 모두 입력해주세요."); return; }
      cfg = { token: token, owner: owner, repo: repo, branch: branch };
      origSet.call(localStorage, CFG_KEY, JSON.stringify(cfg));
      ov.classList.remove("show");
      connect();
    });
    ov.querySelector("#mvSyncOff").addEventListener("click", function () {
      if (!confirm("동기화를 해제할까요? 이 브라우저의 데이터는 그대로 유지돼요.")) return;
      cfg = null; fileSha = null;
      origRemove.call(localStorage, CFG_KEY);
      if (timer) clearTimeout(timer);
      setStatus("연동 안 됨", "");
      ov.classList.remove("show");
    });
  }

  function connect() {
    setStatus("연결 확인 중...", "busy");
    fetchRemote().then(function (remote) {
      if (remote && remote.keys && Object.keys(remote.keys).length) {
        var useRemote = confirm("저장소에 이미 백업된 데이터가 있어요. 불러와서 이 브라우저에 적용할까요?\n(취소하면 이 브라우저의 현재 데이터로 백업을 덮어씁니다)");
        if (useRemote) {
          applySnapshot(remote);
          setStatus("불러옴 — 새로고침합니다", "ok");
          location.reload();
          return;
        }
      }
      return pushRemote(false);
    }).catch(function (err) {
      setStatus("오류: " + err.message, "err");
    });
  }

  function initialPull() {
    if (!cfg || !cfg.token) { setStatus("연동 안 됨", ""); return; }
    setStatus("확인 중...", "busy");
    fetchRemote().then(function (remote) {
      if (remote && remote.savedAt) {
        var applied = localStorage.getItem(STAMP_KEY);
        if (String(remote.savedAt) !== applied) {
          applySnapshot(remote);
          location.reload();
          return;
        }
      }
      setStatus("연결됨 " + new Date().toLocaleTimeString("ko-KR"), "ok");
    }).catch(function (err) {
      setStatus("오류: " + err.message, "err");
    });
  }

  function boot() { buildUI(); initialPull(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
