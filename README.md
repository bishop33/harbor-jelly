# Harbor Jelly — Bishop & Friends

비숍(Bishop)과 테이트(Tate), 후니(Huni), 히스(Heath), 이브(Eve)가 등장하는 3D 인터랙티브 소설입니다. 전체 화면 항구 위에서 두 이야기를 선택할 수 있습니다.

- **미스터리 — 여섯 번째 초대장**: 어두운 조명과 움직이는 안개 속에서 여섯 번째 이름의 비밀을 추적합니다.
- **로맨스 — 미처 부치지 못한 마음**: 비숍과 이브가 오래된 편지를 마주하고, 친구들이 두 사람의 저녁을 밝혀줍니다.

각 이야기는 12개 장면으로 이어지며, 문장을 넘길 때 카메라와 캐릭터, 조명, 소품이 함께 움직입니다.

**[공개 사이트 열기](https://bishop33.github.io/harbor-jelly/)**

## 플레이

- 이야기 버튼으로 다음 장면을 읽고, 앞 문장으로 돌아갈 수 있습니다.
- 중간 선택에 따라 비숍의 반응과 마지막 문장이 달라집니다.
- 등장인물의 얼굴이나 3D 캐릭터를 눌러 소개를 읽고 가까이에서 만날 수 있습니다. 이브는 여성 캐릭터입니다.
- ‘풍경만 보기’를 누르면 이야기 카드가 접히고 전체 화면으로 자유롭게 탐험할 수 있습니다.
- 드래그로 회전하고, 스크롤·두 손가락 또는 ＋/− 버튼으로 확대·축소합니다.
- 직접 조작하면 자동 카메라 이동이 멈춥니다. ⟲ 버튼으로 현재 이야기 시점에 돌아오고, ⌖ 버튼으로 항구 전체를 볼 수 있습니다.
- 배, 부표, 등대, 편지를 직접 눌러 장면과 상호작용할 수 있습니다.

## 로컬 실행

별도의 설치나 build 단계가 필요하지 않습니다. Python 3으로 정적 서버를 실행합니다.

```sh
python3 -m http.server 8765 --directory dist
```

브라우저에서 <http://localhost:8765>를 엽니다. ES modules를 사용하므로 HTML 파일을 직접 여는 대신 HTTP 서버로 실행합니다.

JavaScript 문법 확인:

```sh
node --check dist/app3d.js
node --check dist/scene-director.js
```

## 구성

- `dist/index.html`: 이야기와 조작 UI
- `dist/app3d.js`: 3D 항구, 인물·소품, 이야기 진행과 상호작용
- `dist/scene-director.js`: 장면별 카메라 전환과 배 추적, 직접 조작 전환
- `dist/characters.js`: 서로 다른 외모·의상·소품을 가진 다섯 3D 캐릭터와 인물 소개
- `dist/stories.js`: 미스터리·로맨스 본문, 선택과 장면별 인물 배치
- `dist/atmosphere.js`: 움직이는 안개
- `dist/world.css`: 반응형 소설 화면
- `dist/vendor/`: Three.js 0.180.0과 OrbitControls

Three.js는 MIT license로 배포됩니다. 원본 license는 `dist/vendor/LICENSE`에 보존되어 있습니다.

## 배포

`main`에 push하면 `.github/workflows/pages.yml`이 정적 파일을 GitHub Pages에 자동 배포합니다. 서버, API key, 로그인 없이 플레이할 수 있습니다.
