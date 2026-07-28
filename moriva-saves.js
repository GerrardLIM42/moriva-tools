/* MORIVA 공용 "저장 보관함"
 *
 * 도구마다 작업 내용을 이름을 붙여 저장해 두고, 나중에 다시 불러오거나 삭제할 수 있게 한다.
 * 마진 계산기 · 상품명 생성기 · 가격 세팅 도구가 같은 모양·같은 사용법으로 쓴다.
 *
 * 사용법
 *   MorivaSaves.init({
 *     storeKey : "moriva_pricing_saves_v1",  // 저장 위치(도구마다 다르게)
 *     title    : "가격 세팅",                 // 화면에 보이는 이름
 *     collect  : function(){ return {...} }, // 지금 화면 내용을 객체로 만들어 돌려준다
 *     restore  : function(data){ ... },      // 저장해 둔 객체를 화면에 되돌린다
 *     nameHint : function(){ return "" },    // (선택) 저장할 때 기본으로 채워 줄 이름
 *     summary  : function(data){ return "" } // (선택) 목록에 함께 보여 줄 한 줄 설명
 *   });
 *
 * 저장 위치는 이 브라우저의 localStorage이며, 동기화를 켜 두었다면
 * 다른 브라우저·휴대폰에서도 같은 목록이 보인다.
 * (키 이름에 key·token이 들어가지 않아 동기화 대상에 포함된다)
 */
(function () {
  "use strict";

  var MAX_ITEMS = 100;

  function injectCss() {
    if (document.getElementById("moriva-saves-css")) return;
    var css = [
      '.mvs-bar{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:flex;gap:8px;',
      'font-family:"Pretendard Variable",Pretendard,"Noto Sans KR",-apple-system,BlinkMacSystemFont,"Segoe UI","Malgun Gothic",sans-serif;}',
      '.mvs-bar button{border:none;border-radius:999px;cursor:pointer;font-weight:800;font-size:13px;',
      'padding:11px 17px;box-shadow:0 6px 20px rgba(7,26,53,.22);letter-spacing:-.01em;line-height:1;}',
      '.mvs-save{background:#C9961A;color:#fff;}',
      '.mvs-open{background:#071A35;color:#fff;}',
      '.mvs-open .mvs-cnt{display:inline-block;margin-left:6px;background:rgba(255,255,255,.2);',
      'border-radius:999px;padding:2px 7px;font-size:11px;}',
      '.mvs-ov{position:fixed;inset:0;z-index:2147483001;background:rgba(7,26,53,.45);',
      'display:none;align-items:center;justify-content:center;padding:18px;',
      'font-family:"Pretendard Variable",Pretendard,"Noto Sans KR",-apple-system,BlinkMacSystemFont,"Segoe UI","Malgun Gothic",sans-serif;}',
      '.mvs-ov.show{display:flex;}',
      '.mvs-box{background:#fff;border-radius:16px;width:min(520px,100%);max-height:82vh;',
      'display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(7,26,53,.3);}',
      '.mvs-head{padding:17px 20px 13px;border-bottom:1px solid #E3E6EA;display:flex;align-items:center;gap:10px;}',
      '.mvs-head h3{margin:0;font-size:15.5px;font-weight:800;color:#0F1B2D;flex:1;letter-spacing:-.01em;}',
      '.mvs-x{border:none;background:#F1F3F5;color:#5A6470;width:30px;height:30px;border-radius:9px;',
      'cursor:pointer;font-size:16px;line-height:1;}',
      '.mvs-note{padding:11px 20px;background:#FAFBFC;border-bottom:1px solid #EEF1F4;',
      'font-size:11.5px;color:#8B95A1;line-height:1.6;}',
      '.mvs-list{overflow:auto;padding:8px 12px 12px;flex:1;}',
      '.mvs-empty{padding:34px 16px;text-align:center;color:#8B95A1;font-size:13px;line-height:1.7;}',
      '.mvs-item{border:1px solid #E3E6EA;border-radius:12px;padding:12px 13px;margin-top:8px;',
      'display:flex;align-items:center;gap:10px;}',
      '.mvs-item:hover{border-color:#C9961A;}',
      '.mvs-info{flex:1;min-width:0;}',
      '.mvs-nm{font-size:13.5px;font-weight:800;color:#0F1B2D;white-space:nowrap;',
      'overflow:hidden;text-overflow:ellipsis;}',
      '.mvs-sub{font-size:11px;color:#8B95A1;margin-top:3px;white-space:nowrap;',
      'overflow:hidden;text-overflow:ellipsis;}',
      '.mvs-act{display:flex;gap:6px;flex-shrink:0;}',
      '.mvs-act button{border:1px solid #E3E6EA;background:#fff;border-radius:8px;padding:7px 11px;',
      'font-size:12px;font-weight:700;cursor:pointer;color:#0F1B2D;}',
      '.mvs-act .mvs-load{background:#0F1B2D;color:#fff;border-color:#0F1B2D;}',
      '.mvs-act .mvs-del{color:#B8453A;}',
      '.mvs-toast{position:fixed;left:50%;bottom:82px;transform:translateX(-50%);z-index:2147483002;',
      'background:#0F1B2D;color:#fff;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:700;',
      'opacity:0;transition:opacity .18s;pointer-events:none;',
      'font-family:"Pretendard Variable",Pretendard,"Noto Sans KR",-apple-system,sans-serif;}',
      '.mvs-toast.show{opacity:1;}',
      '@media (max-width:600px){',
      '.mvs-bar{right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));}',
      '.mvs-bar button{padding:10px 14px;font-size:12.5px;}',
      '.mvs-item{flex-wrap:wrap;}.mvs-act{width:100%;}.mvs-act button{flex:1;}',
      '}'
    ].join("");
    var st = document.createElement("style");
    st.id = "moriva-saves-css";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function when(ts) {
    var d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    var p = function (n) { return n < 10 ? "0" + n : String(n); };
    return d.getFullYear() + "." + p(d.getMonth() + 1) + "." + p(d.getDate()) +
      " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function init(opt) {
    if (!opt || !opt.storeKey || typeof opt.collect !== "function" || typeof opt.restore !== "function") {
      return;
    }
    // 같은 페이지에서 두 번 부르면 이전 것을 지운다(중복 버튼 방지)
    var old = document.querySelector('.mvs-bar[data-key="' + opt.storeKey + '"]');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    injectCss();

    var title = opt.title || "작업";
    var items = read();

    function read() {
      try {
        var v = JSON.parse(localStorage.getItem(opt.storeKey) || "[]");
        return Array.isArray(v) ? v : [];
      } catch (e) { return []; }
    }
    function write(list) {
      items = list;
      try { localStorage.setItem(opt.storeKey, JSON.stringify(list)); } catch (e) {
        alert("저장 공간이 가득 찼습니다. 오래된 항목을 몇 개 삭제한 뒤 다시 시도해 주세요.");
        return false;
      }
      paint();
      return true;
    }

    /* ── 화면 요소 ── */
    var bar = document.createElement("div");
    bar.className = "mvs-bar";
    bar.setAttribute("data-key", opt.storeKey);
    bar.innerHTML =
      '<button type="button" class="mvs-save">💾 저장</button>' +
      '<button type="button" class="mvs-open">📂 불러오기<span class="mvs-cnt">0</span></button>';

    var ov = document.createElement("div");
    ov.className = "mvs-ov";
    ov.innerHTML =
      '<div class="mvs-box">' +
        '<div class="mvs-head"><h3>' + esc(title) + ' 저장 목록</h3>' +
        '<button type="button" class="mvs-x" aria-label="닫기">✕</button></div>' +
        '<div class="mvs-note">저장한 내용을 눌러 다시 불러올 수 있어요. 동기화를 켜 두었다면 휴대폰에서도 같은 목록이 보입니다.</div>' +
        '<div class="mvs-list"></div>' +
      '</div>';

    var toast = document.createElement("div");
    toast.className = "mvs-toast";

    // 떠 있는 버튼이 맨 아래 내용을 가리지 않도록 여백을 하나 둔다
    var spacer = document.getElementById("moriva-saves-spacer");
    if (!spacer) {
      spacer = document.createElement("div");
      spacer.id = "moriva-saves-spacer";
      spacer.setAttribute("aria-hidden", "true");
      spacer.style.cssText = "height:74px;flex:none;pointer-events:none;";
      document.body.appendChild(spacer);
    }

    document.body.appendChild(bar);
    document.body.appendChild(ov);
    document.body.appendChild(toast);

    var listEl = ov.querySelector(".mvs-list");
    var cntEl = bar.querySelector(".mvs-cnt");
    var toastTimer = null;

    function say(msg) {
      toast.textContent = msg;
      toast.classList.add("show");
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 1800);
    }

    function paint() {
      cntEl.textContent = String(items.length);
      if (!items.length) {
        listEl.innerHTML = '<div class="mvs-empty">저장된 내용이 없습니다.<br>오른쪽 아래 <b>💾 저장</b>을 누르면 지금 화면이 보관됩니다.</div>';
        return;
      }
      listEl.innerHTML = items.map(function (it, i) {
        var sub = [];
        if (it.summary) sub.push(it.summary);
        sub.push(when(it.savedAt));
        return '<div class="mvs-item">' +
          '<div class="mvs-info"><div class="mvs-nm">' + esc(it.name) + '</div>' +
          '<div class="mvs-sub">' + esc(sub.join(" · ")) + '</div></div>' +
          '<div class="mvs-act">' +
            '<button type="button" class="mvs-load" data-i="' + i + '">불러오기</button>' +
            '<button type="button" class="mvs-del" data-i="' + i + '">삭제</button>' +
          '</div></div>';
      }).join("");
    }

    /* ── 동작 ── */
    bar.querySelector(".mvs-save").addEventListener("click", function () {
      var data;
      try { data = opt.collect(); } catch (e) { data = undefined; }
      // 도구가 null 을 돌려주면 "직접 안내했으니 조용히 멈춰라"라는 뜻이다
      if (data === null) return;
      if (!data) { alert("지금 화면에서 저장할 내용을 읽지 못했습니다."); return; }

      var hint = "";
      try { hint = (opt.nameHint && opt.nameHint()) || ""; } catch (e) {}
      if (!hint) hint = title + " " + when(Date.now());

      var name = prompt("저장할 이름을 입력하세요.", hint);
      if (name === null) return;
      name = String(name).trim() || hint;

      var summary = "";
      try { summary = (opt.summary && opt.summary(data)) || ""; } catch (e) {}

      var entry = { id: String(Date.now()), name: name, savedAt: Date.now(), summary: summary, data: data };
      var next = items.slice();
      var dup = next.findIndex(function (it) { return it.name === name; });
      if (dup !== -1) {
        if (!confirm('"' + name + '" 이름으로 저장된 내용이 이미 있습니다. 덮어쓸까요?')) return;
        entry.id = next[dup].id;
        next[dup] = entry;
      } else {
        next.unshift(entry);
        next = next.slice(0, MAX_ITEMS);
      }
      if (write(next)) say("저장했습니다");
    });

    bar.querySelector(".mvs-open").addEventListener("click", function () {
      items = read();
      paint();
      ov.classList.add("show");
    });

    ov.querySelector(".mvs-x").addEventListener("click", function () { ov.classList.remove("show"); });
    ov.addEventListener("click", function (e) { if (e.target === ov) ov.classList.remove("show"); });

    listEl.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var i = Number(btn.getAttribute("data-i"));
      var it = items[i];
      if (!it) return;

      if (btn.classList.contains("mvs-load")) {
        try { opt.restore(it.data); } catch (err) {
          alert("불러오는 중 문제가 생겼습니다: " + err.message);
          return;
        }
        ov.classList.remove("show");
        say('"' + it.name + '" 불러옴');
        return;
      }
      if (btn.classList.contains("mvs-del")) {
        if (!confirm('"' + it.name + '" 을(를) 삭제할까요? 되돌릴 수 없습니다.')) return;
        write(items.filter(function (_, j) { return j !== i; }));
        say("삭제했습니다");
      }
    });

    paint();
  }

  window.MorivaSaves = { init: init };
})();
