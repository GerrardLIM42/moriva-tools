/* MORIVA 도구 목록 — 셸(index.html)과 홈 화면(home.html)이 함께 사용한다.
   여기에만 추가하면 사이드바와 홈 카드에 동시에 반영된다. */

/* 그룹에 넣지 않고 사이드바 맨 위(도구 모음 옆)에 따로 두는 도구 */
window.MORIVA_PINNED = [
  { id: "ai-settings", icon: "⚙️", name: "AI 서비스 설정", desc: "API 키의 여러 도구가 함께 사용하는 Claude · Gemini · ChatGPT API 키와 모델을 한 곳에서 관리합니다.", badge: "NEW" },
  { id: "launch-calendar", icon: "🗓️", name: "상품런칭 캘린더", desc: "상품 런칭 일정을 캘린더로 관리합니다.", badge: "NEW" }
];

window.MORIVA_TOOLS = [
  {
    group: "소싱 · 분석",
    items: [
      { id: "sourcing-dashboard",    icon: "📊", name: "소싱 대시보드",   desc: "소싱 현황을 한눈에 보는 통합 대시보드.", badge: "NEW" },
      { id: "sourcing-manifest",     icon: "🗂️", name: "소싱 후보",       desc: "1688 사입 후보를 링크·이미지와 함께 등록해 비교 검토합니다." },
      { id: "sourcing-price-compare",icon: "💱", name: "소싱 가격비교",   desc: "판매자별 옵션 가격을 비교해 최저가를 자동으로 찾아줍니다." },
      { id: "margin-calculator",     icon: "🧮", name: "마진 계산기",     desc: "수입원가·관부가세·판매비를 반영해 마진율을 계산합니다." },
      { id: "analysis-history",      icon: "🔎", name: "리뷰 분석 기록",   desc: "크롬 확장 프로그램에서 분석한 쿠팡 리뷰 결과를 동기화해서 확인합니다.", badge: "NEW" }
    ]
  },
  {
    group: "상품 등록 · 판매",
    items: [
      { id: "studio",                 icon: "🎨", name: "스튜디오",            desc: "제품 사진을 분석해 썸네일·상세페이지 기획과 AI 이미지를 생성합니다.", badge: "NEW" },
      { id: "video-to-webp-converter", icon: "🎞️", name: "동영상→WebP 변환기", desc: "짧은 영상을 움직이는 WebP로 변환합니다. 서버 업로드 없이 브라우저 안에서만 처리됩니다.", badge: "NEW" },
      { id: "detail-page-prompt-generator", icon: "🖋️", name: "상세페이지 프롬프트 생성기", desc: "벤치마크 상세페이지와 내 제품 이미지를 분석해 상세페이지 카피와 이미지 생성 프롬프트를 만듭니다 (Claude · Gemini · ChatGPT API 키 필요, 독립형).", badge: "NEW" },
      { id: "product-name-generator", icon: "🏷️", name: "상품명 생성기",      desc: "상위노출 상품명을 분석해 5단어 상품명 5가지를 제안합니다." },
      { id: "pricing-setter",         icon: "💰", name: "가격 세팅 도구",      desc: "최종소비자가 기준으로 판매가·할인·정상가를 자동 계산합니다." },
      { id: "preview-tool",           icon: "🛒", name: "상세페이지 미리보기", desc: "썸네일·상세페이지를 실제 쿠팡 화면처럼 미리 봅니다." },
      { id: "kc-label-navigator",     icon: "📋", name: "KC 표시사항 내비게이터", desc: "카테고리별 KC 인증·표시사항 체크리스트를 안내합니다." }
    ]
  }
];

window.MORIVA_FIND_TOOL = function (id) {
  var found = null;
  (window.MORIVA_PINNED || []).forEach(function (t) { if (t.id === id) found = t; });
  window.MORIVA_TOOLS.forEach(function (g) {
    g.items.forEach(function (t) { if (t.id === id) found = t; });
  });
  return found;
};
