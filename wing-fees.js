/* ── 쿠팡 윙 '입출고/배송 비용' 카테고리별 요금표 (2026-11 윙 캡처, 프로모션 적용가·VAT 별도) ──
   줄 형식: 윙 분류 | 카테고리 경로 | 사이즈 6종(극소형~특대형) × 가격구간 11개 (값÷25, 2자리 36진수) */
var WING_FEE_BANDS = [0, 5000, 10000, 15000, 20000, 30000, 40000, 50000, 60000, 80000, 100000];
var WING_FEE_RAW = `의류 > 여성의류|패션의류잡화>여성패션|2s2s3c3h3q424244444a4a3k3k3l3n3y4a4a4c4c4l4m4e4e4e4e4e4h4k4l4l4t4v50565656565w5w6b6b6b6g767c7c7c7c7c7c7r7r7r7r8u9090909090909f9f9f9f
의류 > 남성의류|패션의류잡화>남성패션|30303c3h3r434545454a4a3u3u3v3x3z4b4f4f4f4m4m4e4e4e4e4e4h4o4o4o4v4v5c5e5e5e5e5w5w6b6b6b6g777c7c7c7c7c7c7r7r7r7r8v9090909090909f9f9f9f
의류 > 유아동패션|패션의류잡화>베이비 의류/신발/잡화(~24개월)|2y2y3c3h3o40404a4a4a4a3p3q3r3t3u46464m4m4m4m4e4e4e4e4e4h4k4v4v4v4v5c5c5c5c5c65656k6k6k6k777c7c7c7c7c7c7r7r7r7r8v9090909090909f9f9f9f
의류 > 캐주얼의류|패션의류잡화>유니섹스/남녀공용 패션|2i2i3c3h3o404445454a4a3u3u3v3x3z4b4c4f4f4l4l4e4e4e4e4e4j4n4p4p4v4v4s4y4y4y4y5w5w6b6b6b6g767c7c7c7c7c7c7r7r7r7r8u9090909090909f9f9f9f
뷰티 > 스킨케어|뷰티>스킨|303334353m4a4a4a4a4a4a3r3v3v3x3x4m4m4m4m4m4m4d4i4i4l4u5050505050505i5i5i5i5i5w5w6b6b6b6b7c7c7c7c7c7k7k7z8080808g8g8g8g8g8o8o93949494
퍼스널케어 > 바디/세안|뷰티>바디|32323c3g3m4a4a4a4a4a4a3p3t3w3z404m4m4m4m4m4m4e4j4k4m4w5151515152585g5g5g5g5g5w5w6b6b6b6b777c7c7c7c7c7c7r7r7r7r8v9090909090909f9f9f9f
퍼스널케어 > 헤어케어|뷰티>헤어|373a3c3g3m4a4a4a4a4a4a3m404245494m4m4m4m4m4m4w4w4w4w4w5252525252575q5q5q5q5q5z5z6e6e6f6f7h7m7m7m7m7m7m81818181959999999999999o9o9o9o
뷰티 > 메이크업|뷰티>메이크업|30303c3g3m4a4a4a4a4a4a3y3y3y404a4m4m4m4m4m4m54545454545858585858585e5e5e5e5e64646b6b6b6b7s7s7s7s7s7s7s7z7z7z7z8w8w8w8w8w8w8w93939393
뷰티 > 네일|뷰티>네일|2r2u3e3e3k4a4a4a4a4a4a3m3n3n3p3p4m4m4m4m4m4m4u4u4z4z4z4z4z4z4z4z4z58585858586d6d6s6s6s6s7c7c7c7c7c7d7d7s7s7t7t8g8g8g8g8g8h8h8w8w8x8x
뷰티 > 뷰티소품|뷰티>뷰티소품|2y343i3k3m4a4a4a4a4a4a3m3r3r3y404m4m4m4m4m4m4i4i4i4k4p575757575a5a5i5i5i5i5i5w5w6b6b6b6b7c7c7c7c7c7c7c7r7r7r7r909090909090909f9f9f9f
뷰티 > 향수|뷰티>향수|2y343i3k3m4a4a4a4a4a4a3t3t3t3v3x4m4m4m4m4m4m4u4u4u4u4v5454545458585i5i5i5i5i5w5w6b6b6b6b7k7k7k7k7k7k7k7z7z7z7z8o8o8o8o8o8o8o93939393
영유아 기타용품 > 수유용품|뷰티>임산부화장품|2v303g3i3m4a4a4a4a4a4a3o3o3o3q3t4l4l4m4m4m4m4n4n4n4n4p5659595959595c5c5c5c5e6j6j6j6j6j6j7q7q7q7q7s7z7z7z7z7z7z8u8u8u8u8w939393939393
영유아 필수품 > 기저귀|출산/유아동>기저귀/교체용품|3q3q3q3q3s4a4a4a4a4a4a4848484a4a4m4m4m4m4m4m555555555d5d5d5d5d5d5d6c6c6c6c6c6c6c6r6r6r6r7c7c7c7c7c7c7c7r7r7r7r8g8g8g8g8g8g8g8v8v8v8v
영유아 필수품 > 물티슈|출산/유아동>유아물티슈/캡/홀더|373e3k3m3s4a4a4a4a4a4a3p3p40424a4m4m4m4m4m4m4m4m4m4n515151515152555w5w5w5w6060666j6l6s6s7c7c7c7c7f7f7i7v7v7v7v8g8g8g8g8j8j8m8z8z8z8z
영유아 필수품 > 분유|출산/유아동>분유/유아식품|3q3q3q3q3s4a4a4a4a4a4a4a4a4a4a4a4m4m4m4m4m4m5k5k5k5k5k5k5k5k5k5k5k6j6j6j6j6j6j6j6j6j6j6j7z7z7z7z7z7z7z7z7z7z7z9393939393939393939393
육아용품 > 수유용품/이유용품|출산/유아동>수유/이유용품|2p2r2s2u3c3y4a4a4a4a4a3f3p3p3r3r434m4m4m4m4m4i4i4i4i4i4w5757575d5d5e5e5e5e5e60606f6l6w6w7n7n7n7n7n7n7n82828787999999999999999o9o9o9o
육아용품 > 유모차/카시트|출산/유아동>외출용품|2e2i34383e4a4a4a4a4a4a3n3n3n3p3r4i4m4m4m4m4m5353535353585858585d5d54545454546h6h6w6w6w6w858585858585858k8k8k8k999999999999999o9o9o9o
육아용품 > 매트/안전용품|출산/유아동>놀이매트/안전용품|2s2s34383e4a4a4a4a4a4a3k3u3w3y464m4m4m4m4m4m4i4i4i4t4t545454545d5d5e5e5e5e5e5z5z6e6e6e6h7c7c7c7c7c7c7c7r7r7r7r909090909090909f9f9f9f
육아용품 > 유아가구|출산/유아동>유아동침구|2e2i31383e4a4a4a4a4a4a3n3n3n3t3w4m4m4m4m4m4m4i4i4i4i4i5c5c5c5c5c5c52525252526h6h6w6w6w6w7c7c7c7c7c7c7l8f8g8g8g909090909090999o9o9o9o
악세서리 > 기타 악세서리|출산/유아동>임부용품|2i2i3c3h3o40434a4a4a4a3m3n3n3p3p414b4m4m4m4m4e4e4e4e4e4s4v4v4v4v4v4t4z4z4z4z5w5w6b6b6b6b767c7c7c7c7c7c7r7r7r7r8u9090909090909f9f9f9f
냉장/냉동식품 > Bakery & Dessert|식품>유제품/아이스크림/디저트|4a4m5k748sd8
식품 > 신선식품(건조/냉동 농산)|식품>(미확인)|323g3g3h3j3v3v3x3x3x3x3z3z46484a4m4m4m4m4m4m4z4z4z4z4z5252525252525w5w5w5w5w5w5w6b6b6b6b7c7c7c7c7c7c7c7r7r7r7r909090909090909f9f9f9f
건강/식품 > 조미료/소스/장/오일|식품>장/소스|2u2u3c3g3m4a4a4a4a4a4a3m3n3n3t3v4m4m4m4m4m4m4d4i4i4i4i5d5d5d5d5d5d58585858585w5w6b6b6b6b777c7c7c7c7c7c7r7r7r7r8v9090909090909f9f9f9f
냉장/냉동식품 > 반찬&즉석식품|식품>냉장/냉동식품|4a4m5k748sd8
스낵/커피/차 > 과자|식품>스낵/간식|30323c3g3m4a4a4a4a4a4a3m3w3w42464m4m4m4m4m4m4d4i4i4i4n5353535353535a5g5g5g5g65656k6k6k6k7c7c7c7c7c7c7c7r7r7r7r909090909090909f9f9f9f
음료 > 생수|식품>생수/음료|2u2u3e3j3s4a4a4a4a4a4a3t3t3t3x404m4m4m4m4m4m4i4i4i4i4p52525252525258585858586c6c6w6w6w6w7c7c7c7c7c7c7c7r7r7r7r909090909090909f9f9f9f
스낵/커피/차 > 커피/차|식품>커피/차|2w2y3c3h3o474a4a4a4a4a3n3q3s3v3x4d4m4m4m4m4m4g4n4n4n4n4x54545454565g5g5g5g5g5w5w6b6b6b6b7c7c7c7c7c7c7c7r7r7r7r909090909090909f9f9f9f
건강/식품 > 건강식품|식품>건강식품|303334363t454a4a4a4a4a3s3y3y42454h4h4j4j4j4j4r4r4r4r4w5d5d5d5d5d5d5i5i5i5i5i5w5w6b6o6w6w7c7c7c7c7c7c7c7r7r7r7r909090909090909f9f9f9f
음료 > 음료|식품>전통주|2u2u3c3g3m4a4a4a4a4a4a3m3r3y40404m4m4m4m4m4m4a4k4k4k4k5d5d5d5d5d5d585858585867686n6n6n6n7c7c7c7c7c7c7c7r7r7r7r909090909090909f9f9f9f
주방 > 쿡웨어(냄비/프라이팬)|주방용품>취사도구|2s2s34383e4a4a4a4a4a4a3m3u3u3y424m4m4m4m4m4m4i4i4i4i4p5d5d5d5d5d5d5e5e5e5e5e5w676m6w6w6w7c7c7c7c7c7c7c7r7r8b8g909090909090909f9f9o9o
주방 > 주방조리도구|주방용품>칼/가위/도마|2o2o34383e4a4a4a4a4a4a3m3t3v3y404m4m4m4m4m4m4i4i4i4p4p5d5d5d5d5d5d5a5a5a5a5a6h6h6w6w6w6w7c7c7c7c7c7c7c7r7r8g8g909090909090909f9f9o9o
주방 > 테이블웨어|주방용품>수저/컵/식기|2a2e34383e4a4a4a4a4a4a3m3n3n3p4a4m4m4m4m4m4m4d4i4i4i5959595959595d5q5w5w5w6364656k6k6w6w7c7c7c7c7c7c7c7r818181909090909090909f9o9o9o
주방 > 밀폐저장용기|주방용품>보관/밀폐용기|2q2s2t2v3e4a4a4a4a4a4a3m3r3v3x3x4m4m4m4m4m4m4d4i4i4i4r5757575757575a5g5g5g5g6h6h6w6w6w6w717c7c7c7c7c7c7r7r7r8g8v9090909090909f9f9f9o
주방 > 일회용품|주방용품>(미확인)|2a2e34393f404a4a4a4a4a3m3n3p3t3w484m4m4m4m4m4i4i4i4i4n515d5d5d5d5d5050505050696h6w6w6w6w7c7c7c7c7c7c7j7y7y8g8g909090909090979m9m9o9o
주방 > 주방잡화|주방용품>(미확인)|2a2e34393g404a4a4a4a4a3m3n3n3p3p454m4m4m4m4m4f4i4i4i4i4w585858585d4u505050505w6h6w6w6w6w7c7c7c7c7c7c7c7r7r7r7r909090909090909f9f9f9f
홈 > 가구/수납/정리|생활용품>수납/정리|2m2m34393g404a4a4a4a4a3m3q3q3v3z4g4m4m4m4m4m4i4i4i4i4j4z5d5d5d5d5d52585858585w6h6w6w6w6w717c7c7c7c7c7n8d8g8g8g8p9090909090999o9o9o9o|생활잡화 일부 포함
하우스홀드 > 화장지|생활용품>화장지/물티슈|2d2d383b3e3q404a4a4a4a3m3n3n3p3p3y4f4m4m4m4m3q3q3q3q4a4j4z4z4z5d5d4q4q4q4q4q5i5i6w6w6w6w7c7c7c7c7c7c7c7r7s7x7x909090909090909f9g9l9l|일반롤화장지(2겹) 기준
하우스홀드 > 화장지 (티슈 등 일반)|생활용품>화장지/물티슈|2c2d383b3e3u404a4a4a4a3m3n3n3p3p444f4m4m4m4m4a4a4a4a4a4y5151515d5d4q4q4q4q4q5z6c6w6w6w6w7c7c7c7c7c7c7c7r7s7x7x909090909090909f9g9l9l|화장지/티슈류 기본
퍼스널케어 > 구강용품|생활용품>구강/면도|363g3q3q3s4a4a4a4a4a4a3b3w3w484a4m4m4m4m4m4m4w4w4w4w5a5h5h5h5h5h5h55555s5s5s6j6j6j6j6j747c7c7z7z7z7z7z7z7z7z7z90909n9n9n9n9n9n9n9n9n
퍼스널케어 > 위생용품|생활용품>생리대/성인기저귀|2w3q3q3q3s4a4a4a4a4a4a3x3x4648484m4m4m4m4m4m4i4i4i4i4i5151515151515t5w5w5w5w60606f6f6f6f7h7h7h7h7h7h7h7r7r7r7r959595959595959f9f9f9f
하우스홀드 > 세제|생활용품>세제|373a3c3g3m4a4a4a4a4a4a3m3y3z414a4m4m4m4m4m4m4g4o4o4o4y5252525252525w5w5w5w6163636w6w6w6w7c7c7c7c7c7c7c7r7r7r7r909090909090909f9f9f9f|방향/탈취/제습/살충 포함
홈 > 공구/셀프인테리어용품|생활용품>방충용품|2s2u2v2x3e4a4a4a4a4a4a3m3x4143464m4m4m4m4m4m4m4m4m4v4v5d5d5d5d5d5d5c5i5i5i5i6h6h6w6w6w6w767c7c7c7c7c7c7r7r7u8g8u9090909090909f9f9i9o|조명/전기, 철물, 공구, 접착, 보수, 배관/건축자재, 안전, 도장, 생활잡화
퍼스널케어 > 건강/의료용품|생활용품>건강용품|373a3c3g3m4a4a4a4a4a4a3m3x3x434a4m4m4m4m4m4m4i4i4k4p5959595959595d5w5w5w5w5w5w6b6q6q6w6w7c7c7c7c7c7c7h7x7x8f8f909090909090959l9l9o9o|의료/간호용품 포함
퍼스널케어 > 성인용품|생활용품>성인용품(19)|2y363o3q3s4a4a4a4a4a4a3t3t3v3w3w4m4m4m4m4m4m4k4k4k4m4m565k5k5k5k5k535353535k6p6p72727272858585858m8m8m8q8q8q8q999999999q9q9q9u9u9u9u|생활잡화 일부 포함
홈 > 욕실용품|생활용품>청소용품|2a2e34393f404a4a4a4a4a3m3n3n3p3p414m4m4m4m4m4i4i4i4i4i4x5d5d5d5d5d4u505050505w686n6n6w6w717c7c7c7c7c7c7r7u7u7u8p9090909090909f9i9i9i|세탁용품, 욕실용품, 생활소품, 구강/면도 일부
홈 > 침구/커튼/블라인드|가구/홈데코>침구|2e2i34393g424a4a4a4a4a3m3n3p3t3x4e4m4m4m4m4m4i4i4i4i4i505d5d5d5d5d4y545454545w6h6w6w6w6w717c7c7c7c7c7r868e8g8g8p9090909090999o9o9o9o
홈 > 홈데코|가구/홈데코>인테리어용품|2a2e34393f404a4a4a4a4a3m3n3n3p3r464m4m4m4m4m4i4i4i4i4i4x5d5d5d5d5d4v515151515w6h6w6w6w6w717c7c7c7c7c7h82878g8g8p9090909090959o9o9o9o|조명/전기용품, 보수용품(생활용품) 포함
컴퓨터/디지털 > 휴대폰/액세서리|가전/디지털>휴대폰/태블릿PC/액세서리|2f2w3c3g3m4a4a4a4a4a4a343r3r3v3y4m4m4m4m4m4m4h4i4i4i4m5353535a5j5k545a5a5a5a6j6j6j747474767c7c7c7c7z7z7z7z7z8s8u909090909n9n9n9n9n9w
컴퓨터/디지털 > 디지털|가전/디지털>음향기기/이어폰/스피커|2t2y3i3k3s4a4a4a4a4a4a3m3r3r3w4a4m4m4m4m4m4m4h4i4i4k595f5f5f5f5f5f5q5w5w696g6j6j6w6w6w6w7l7l7l7l7l7n7n8080808099999999999b9b9o9o9o9o
컴퓨터/디지털 > 노트북/데스크탑|가전/디지털>컴퓨터/게임/SW|30383o3q3s4a4a4a4a4a4a3m3t3t404a4m4m4m4m4m4m4k4k4k525d5d5d5d5d5d5k5w5w5w5w69696f6u6u6u6w7c7c7c7c7h7l7l80808080909090909599999o9o9o9o
가전 > 음향기기|가전/디지털>TV/영상가전|323q3q3q3s4a4a4a4a4a4a3m484a4a4a4m4m4m4m4m4m4d4i4i505d5d5d5d5d5d5k5x69696969696d6w6w6w6w777c7c7c7c7c7l808080808v9090909090999o9o9o9o
가전 > 계절가전|가전/디지털>계절환경가전|30383m3q3s4a4a4a4a4a4a3m3z4042484m4m4m4m4m4m4j4k4o4o4v5d5d5d5d5d5k5g5m5m5m5m6h6h6w6w6w6w7c7c7c7c7c7n7n828a8g8g909090909099999o9o9o9o
가전 > 생활가전|가전/디지털>생활가전|343c3q3q3s4a4a4a4a4a4a3z3z3z444a4m4m4m4m4m4m4i4i4i4o575d5g5k5k5k5k5w5w5w5w656c6k6w6w6w6w818181818181848g8g8g8g9999999999999c9o9o9o9o
가전 > 뷰티가전|가전/디지털>이미용건강가전|31383o3r3s484848484a4a3o3o3q41434g4g4g4g4m4m4i4i4i4i4i4w4w4w4w5a5k5m5m5m5m5m6s6s6w6w6w6w7n7n7n7n7n7n7n7r7r7r7r9b9b9b9b9b9b9b9f9f9f9f
스포츠/레저 > 스포츠용품|스포츠/레져>검도/격투/무술|2m2m34383e4a4a4a4a4a4a3m3n3o3t3x4m4m4m4m4m4m4h4i4i4i4i5d5d5d5d5d5d58585858586f6h6w6w6w6w7c7c7c7c7c7c7u89898f8f909090909090999o9o9o9o
스포츠/레저 > 아웃도어/캠핑|스포츠/레져>골프|2a2e34383e4a4a4a4a4a4a3m3n3n3r3v4m4m4m4m4m4m4i4i4i4i4i5d5d5d5d5d5k4u505050506b6h6w6w6w6w777c7c7c7c7h7h88898g8g8v9090909095959o9o9o9o
신발 > 스포츠신발|스포츠/레져>(미확인)|2k2m3c3h3l3z404a4a4a4a3m3q3q3q3q4b4c4m4m4m4m4e4e4e4e4e4i4k4u4u4u4u4s4u4u4u4u5w5w6h6h6h6h777c7c7c7c7c7c7r7r7r7r8v9090909090909f9f9f9f
의류 > 스포츠의류|스포츠/레져>수영/수상스포츠|2y2y3c3h3o404045454a4a3a3a3c3i3r43474f4f4m4m4e4e4e4e4e4h4o4o4o4v4v5a5c5c5c5c5w5w6b6b6b6g777c7c7c7c7c7c7r7r7r7r8v9090909090909f9f9f9f
신발 > 패션신발|스포츠/레져>스포츠 신발|2k2m3c3h3o40404a4a4a4a3m3n3n3p3p41414m4m4m4m4b4e4e4e4e4h4h4s4s4s4s4t4z4z4z4z5w5w6h6h6h6h767c7c7c7c7c7c7r7r7r7r8u9090909090909f9f9f9f
스포츠/레저 > 운동/피트니스|스포츠/레져>스포츠 잡화|2a2e34393g404a4a4a4a4a3m3n3n3p3p474m4m4m4m4m4i4i4i4i4i4x595d5d5d5d50505050505w6g6w6w6w6w7c7c7c7c7c7c7i7x7x8f8g909090909090969l9l9o9o
문구 > 팬시용품|문구/오피스>문구/학용품|2v2x2y2z3e4a4a4a4a4a4a3m3r3r3v3v4m4m4m4m4m4m4i4i4i4i4i5151515152535k5k5k5k5k5w5z6e6e6e6e7c7c7c7c7c7c7c7r84848j909090909090909f9o9o9o
문구 > 사무용품|문구/오피스>사무용품|2z3234383e4a4a4a4a4a4a3r3r40454a4m4m4m4m4m4m4m4m4n4y5d5d5d5d5d5d5d5w5w5w6d6d6d6d6w6w6w6w7c7c7c7c7c7c7c7r8g8g8g909090909090909f9o9o9o
문구 > 미술/화방용품|문구/오피스>미술/화방용품|2e2e34383e4a4a4a4a4a4a3m3p3p3t3x4m4m4m4m4m4m4i4i4i4i4i5d5d5d5d5d5k4y54545454696h6w6w6w6w767c7c7c7c7c7t8888888g8u9090909090999o9o9o9o
장난감 > 어린이완구|완구/취미>DIY|2a2e34383e4a4a4a4a4a4a3c3d3n3p3t4m4m4m4m4m4m4i4i4i4i4i5d5d5d5d5d5d4v51515151696h6w6w6w6w767c7c7c7c7w818g8g8g8g8u9090909099999o9o9o9o
장난감 > 키덜트|완구/취미>퍼즐/큐브/피젯토이|2a2e34383e4a4a4a4a4a4a3m3n3n3v3y4m4m4m4m4m4m4d4i4i4i4i5d5d5d5d5d5d50505050506b6b6q6w6w6w7c7c7c7c7c7c7c7r7r7r7r909090909090909f9f9f9f
장난감 > 신생아/영아완구|완구/취미>신생아/영아완구|2k2k34383e4a4a4a4a4a4a3m3n3p3v3x4m4m4m4m4m4m4i4i4i4i4k5d5d5d5d5d5d50565656566c6h6w6w6w6w767c7c7c7c7n7n828g8g8g8u9090909099999o9o9o9o
애완용품 > 강아지 용품|반려/애완용품>강아지/고양이 겸용|2p2q3a3d3i3y4a4a4a4a4a3m3n3n3r3r474m4m4m4m4m4f4i4i4i4i4y5a5b5d5d5d54545454545w6h6w6w6w6w7c7c7c7c7c7c7c7r7s7w80909090909090909f9g9k9o
애완용품 > 강아지 사료/영양제/간식|반려/애완용품>강아지 사료/간식/영양제|2n2s3i3m3s4a4a4a4a4a4a3p3p3p3x424j4m4m4m4m4m4i4i4i4i4l4y5d5d5d5d5d56565656565w6h6w6w6w6w7c7c7c7c7c7c7i7x848j8j909090909090969l9o9o9o
애완용품 > 고양이 사료/영양제/간식|반려/애완용품>고양이 사료/간식/영양제|2o2s3i3l3s47484a4a4a4a3n3n3t41414d4m4m4m4m4m4i4i4i4i4i515d5d5d5d5d56565656565w6f6w6w6w6w7c7c7c7c7c7c7c7r7r7r7r909090909090909f9f9f9f
애완용품 > 고양이 용품|반려/애완용품>고양이용품|2k2k383d3i3t4a4a4a4a4a3m3n3n3p3r414m4m4m4m4m4i4i4i4i4i4i5d5d5d5d5d4w4y4y4y4y5x6f6w6w6w6w6k6k6k6k6k6k6k7r8080808z9090909090909f9o9o9o
애완용품 > 소동물/가축용품|반려/애완용품>관상어용품|2g2k2l2n3m4a4a4a4a4a4a3m3n3p3t3u4m4m4m4m4m4m4i4i4i4i4i5d5d5d5d5d5d50505050506h6h6w6w6w6w7c7c7c7c7c7c7l80808080909090909090999o9o9o9o
자동차용품 > 차량용 인테리어&익스테리어|자동차용품>실내용품|2o2o34383e4a4a4a4a4a4a3k3n3r3t3x4m4m4m4m4m4m4d4i4i4i4i5d5d5d5d5d5d545a5a5a5a63636i6i6i6w767c7c7c7c7c7c7r7r7r8g8u9090909090909f9f9f9o
자동차용품 > 부품/안전/공구|자동차용품>세차/관리용품|2z3234383e4a4a4a4a4a4a3m3x4143494m4m4m4m4m4m4i4q4q4q4q5d5d5d5d5d5d5i5o5o5o5o6h6h6w6w6w6w7c7c7c7c7c7c7g7v8g8g8g909090909090949j9o9o9o
자동차용품 > 차량용 전자기기|자동차용품>공기청정/방향/탈취|2z3234383e4a4a4a4a4a4a3t3t3t484a4m4m4m4m4m4m4q4q4q4u4v5a5a5a5a5a5k5w5w5w5w5w6v6v6z6z6z7481818181818181828o8o8o9p9p9p9p9p9p9p9q9w9w9w`;
var WING_FEES = WING_FEE_RAW.split('\n').filter(Boolean).map(function(line){
  var p = line.split('|'), code = p[2], sizes = [];
  for(var z = 0; z < 6; z++){
    var row = [];
    for(var b = 0; b < 11; b++){
      if(code.length === 12) row.push(parseInt(code.substr(z * 2, 2), 36) * 25);
      else row.push(parseInt(code.substr((z * 11 + b) * 2, 2), 36) * 25);
    }
    sizes.push(row);
  }
  return {id: p[1] + '|' + p[0], root: p[1].split('>')[0], path: p[1].replace(/>/g, ' > '), lab: p[0], note: p[3] || '', sizes: sizes};
});
function wingFeeEntry(id){
  if(!id) return null;
  for(var i = 0; i < WING_FEES.length; i++){ if(WING_FEES[i].id === id) return WING_FEES[i]; }
  return null;
}
function wingFeeValue(id, sizeIdx, price){
  var e = wingFeeEntry(id);
  if(!e || !e.sizes[sizeIdx]) return null;
  var pr = parseFloat(price) || 0, bi = 0;
  for(var i = 0; i < WING_FEE_BANDS.length; i++){ if(pr >= WING_FEE_BANDS[i]) bi = i; }
  return e.sizes[sizeIdx][bi];
}
function wingOptions(sel){
  var html = '<option value=""' + (!sel ? ' selected' : '') + '>윙 카테고리: 선택 안 함 (기본 요금표)</option>', cur = null;
  WING_FEES.forEach(function(e){
    if(e.root !== cur){ if(cur !== null) html += '</optgroup>'; html += '<optgroup label="' + e.root + '">'; cur = e.root; }
    html += '<option value="' + e.id.replace(/"/g, '&quot;') + '"' + (sel === e.id ? ' selected' : '') + '>' + e.path.split(' > ').slice(1).join(' > ') + ' — ' + e.lab + (e.note ? ' · ' + e.note : '') + '</option>';
  });
  return html + (cur !== null ? '</optgroup>' : '');
}
function wingSelectHtml(idx, sel){
  return '<select class="sc-wing-select" data-wing-idx="' + idx + '" title="쿠팡 윙 입출고/배송 요금표의 카테고리를 고르면 사이즈·판매가에 맞는 그로스비용이 자동으로 들어가요 (VAT 별도)">' + wingOptions(sel) + '</select>';
}

