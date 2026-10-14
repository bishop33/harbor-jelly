# Harbor Jelly — 등대의 마지막 편지

작은 3D 항구에서 펼쳐지는 인터랙티브 소설입니다. 문장을 넘기면 카메라가 회전하고 가까워지며, 인물과 불빛, 우편배와 편지가 장면 속에 등장합니다.

**[공개 사이트 열기](https://bishop33.github.io/harbor-jelly/)**

## 플레이

- 이야기 버튼으로 다음 장면을 읽고, 앞 문장으로 돌아갈 수 있습니다.
- 중간 선택에 따라 윤의 회상이 달라집니다.
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
- `dist/world.css`: 반응형 소설 화면
- `dist/vendor/`: Three.js 0.180.0과 OrbitControls

Three.js는 MIT license로 배포됩니다. 원본 license는 `dist/vendor/LICENSE`에 보존되어 있습니다.

## 배포

`main`에 push하면 `.github/workflows/pages.yml`이 정적 파일을 GitHub Pages에 자동 배포합니다. 서버, API key, 로그인 없이 플레이할 수 있습니다.
