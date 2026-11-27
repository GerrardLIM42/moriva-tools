/* MORIVA 모바일(아이폰) 공용 보정
 * index.html(셸)이 도구 화면(iframe)이 열릴 때마다 이 파일을 주입한다.
 * 각 도구의 원본 코드는 건드리지 않고 폰에서 불편한 부분만 덮어쓴다.
 */
(function () {
  "use strict";
  if (window.__morivaMobile) return;
  window.__morivaMobile = true;

  var css =
    "html{-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:rgba(201,150,26,.18);}" +
    "@media (max-width:900px){" +
      "input:not([type=checkbox]):not([type=radio]):not([type=range]),select,textarea{font-size:16px !important;}" +
      "button,select,.btn,[role=button]{touch-action:manipulation;}" +
      "img,video,canvas{max-width:100%;}" +
      ".table-wrap,.tbl-wrap,.table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}" +
      "body{padding-bottom:env(safe-area-inset-bottom,0);overflow-x:hidden;}" +
    "}" +
    ".m-listbar{display:none;}" +
    "@media (max-width:900px){" +
      ".m-listbar{display:flex;position:sticky;top:0;z-index:30;align-items:center;justify-content:space-between;" +
        "gap:10px;width:100%;padding:12px 16px;border:0;border-bottom:1px solid rgba(255,255,255,.14);" +
        "background:#0E2A4C;color:#fff;font:inherit;font-size:14px;font-weight:800;cursor:pointer;}" +
      ".m-listbar small{font-weight:600;color:rgba(255,255,255,.6);}" +
      ".app > .sidebar.m-collapsed{display:none !important;}" +
      ".app > .sidebar{max-height:none !important;height:auto !important;}" +
      ".app > .sidebar .product-list{max-height:60vh !important;}" +
    "}";

  var st = document.createElement("style");
  st.id = "moriva-mobile-css";
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  function setupDashboard() {
    var app = document.querySelector(".app");
    var side = app && app.querySelector(":scope > .sidebar");
    if (!side || document.getElementById("mListBar")) return;

    var bar = document.createElement("button");
    bar.type = "button";
    bar.id = "mListBar";
    bar.className = "m-listbar";
    app.insertBefore(bar, side);

    function label() {
      var open = !side.classList.contains("m-collapsed");
      var cnt = (document.getElementById("countTag") || {}).textContent || "";
      bar.innerHTML = "<span>☰ 상품 목록·검색</span><small>" + cnt + (open ? "  ▲" : "  ▼") + "</small>";
    }
    function collapse(v) {
      side.classList.toggle("m-collapsed", v);
      label();
      if (v) window.scrollTo(0, 0);
    }
    bar.addEventListener("click", function () { collapse(!side.classList.contains("m-collapsed")); });

    side.addEventListener("click", function (e) {
      if (window.innerWidth > 900) return;
      var t = e.target;
      if (t.closest("input,select,textarea")) return;
      if (t.closest(".p-item,#navDashboard,#addProductBtn,.nav-btn")) {
        setTimeout(function () { collapse(true); }, 60);
      }
    });

    collapse(true);
    var cnt = document.getElementById("countTag");
    if (cnt && window.MutationObserver) new MutationObserver(label).observe(cnt, { childList: true, characterData: true, subtree: true });
  }

  function init() {
    if (document.querySelector(".app > .sidebar")) setupDashboard();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  setTimeout(init, 1200);
})();
