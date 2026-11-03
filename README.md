# 최다은 | 게임 사운드 디자인 포트폴리오

공개 주소: https://sarahcheh.github.io/

## 배치 순서

1. 던전앤파이터 — 스킬 사운드 디자인 (대표작)
2. 던전앤파이터 — 몬스터 사운드 디자인
3. 던전앤파이터 모바일 — UI 사운드 디자인
4. 할로우 나이트: 실크송 — 인게임 사운드 리디자인
5. 엘더스크롤 — 시네마틱 사운드 리디자인
6. 리버스: 1999 — 스킬 사운드 리디자인 10개

대표작은 상단에 크게 배치합니다. 그 아래 작업 목차에서 제목을 누르면 해당 작업물로 이동합니다.
영상은 메인 화면에서 직접 재생하며, 상세 설명은 기본적으로 접혀 있습니다.
새 던파 작업은 영상 링크를 넣을 자리만 준비한 상태입니다.

## 자료 교체

이름, 이메일, 영상 주소는 content.js에서 관리합니다.
YouTube, Vimeo, 직접 연결한 MP4/WebM 영상 주소를 지원합니다.

- projects['dnf-skills'].videoUrl: 던파 스킬
- projects['dnf-monsters'].videoUrl: 던파 몬스터
- projects['dnf-ui'].videoUrl: 모바일 던파 UI
- projects.silk.videoUrl: 실크송
- projects.elder.videoUrl: 엘더스크롤
- projects.reverse.videoUrl: 리버스 1999

영상 링크나 프로필 사진을 채팅으로 전달하면 직접 디자인이나 코딩할 필요 없이 반영할 수 있습니다.
프로필 사진 자리는 4:5 비율이며 모바일에서는 소개 문장 위에 표시됩니다.

## 운영

HTML, CSS, JavaScript로 구성된 정적 사이트입니다. 설치나 빌드가 필요하지 않습니다.
GitHub Pages는 main 브랜치의 루트에서 배포합니다. 이 폴더의 파일이 저장소 루트에 위치해야 합니다.
공개 저장소와 기본 github.io 주소를 사용하며 별도 서버나 유료 도메인을 요구하지 않습니다.

- index.html: 콘텐츠, 목차, 작업물 순서
- styles.css: 화면 구성과 반응형 스타일
- script.js: 영상 플레이어 연결
- content.js: 이름, 연락처, 영상 링크
- assets/: 이미지와 파비콘

함께 제공하는 portfolio-preview.html은 한 파일로 열어볼 수 있는 미리보기입니다.
유튜브 재생은 로컬 파일보다 공개 사이트에서 확인하세요.
