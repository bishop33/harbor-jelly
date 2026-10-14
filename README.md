# Harbor Jelly — 작은 항구의 하루

투명한 젤리 바다를 내려다보는 실시간 3D 미니어처 항구입니다. 별도의 이미지 배경이나 외부 3D 모델 없이 Three.js geometry로 풍경을 구성합니다.

**[공개 사이트 열기](https://bishop33.github.io/harbor-jelly/)**

## 항구 둘러보기

- 두 gantry crane, 골이 있는 컨테이너, 하역장 레일과 방충용 타이어
- 언덕의 파스텔 집, 창틀·굴뚝·지붕·가로등, 교회와 어시장
- 나무 부두와 작은 어선, 예인선과 화물선, 방파제와 회전하는 등대 불빛
- 투명한 수면과 단면, 수중 빛무늬, 물고기 52마리와 해파리, 해초·불가사리·닻

배는 **하역 → 선적 → 크레인 들어 올리기 → 예인선 접근 → 출항 → 항해 → 귀항 → 접안**을 반복합니다. 일찍 출항을 요청하면 진행 중인 상자를 마저 옮깁니다. 바다에서는 귀항을 요청할 수 있습니다.

## 직접 조작

- 수면을 드래그하면 파문이 퍼집니다. 블록 옆면을 드래그하면 잠깐 기울어집니다.
- 주황색 구명환을 잡아서 던질 수 있습니다.
- 빈 공간 또는 오른쪽 드래그로 회전하고 스크롤로 확대합니다.
- 휴대폰에서는 드래그로 회전하고 두 손가락으로 확대합니다. 수면을 짧게 터치하면 파문이 생깁니다.
- 먹이를 주면 알갱이가 떨어지고 물고기들이 부두에 모입니다. 경적을 울리면 갈매기가 흩어집니다.
- 바다 색, 탱글함, 물결 감쇠와 수위를 바꿀 수 있습니다.
- 전체·하역장·수중·등대 버튼은 카메라를 부드럽게 이동시킵니다.
- 소리는 기본적으로 꺼져 있습니다. 켜면 합성한 뱃고동이 재생됩니다.

## 로컬 실행

```sh
python3 -m http.server 8766 --directory dist
```

브라우저에서 <http://localhost:8766>을 엽니다. ES modules를 사용하므로 HTTP 서버가 필요합니다. build나 외부 CDN 연결은 필요하지 않습니다.

```sh
npm test
node --check dist/harbor.js
node --check dist/harbor-world.js
```

테스트는 항구의 전체 운영 주기, 조기 출항·귀항, 물결의 안정성과 감쇠, 배가 부두·방파제를 피하는 항로를 확인합니다. 브라우저에서는 데스크톱과 390×844 화면의 렌더링·조작 패널·수위·색·출항·귀항을 확인했습니다. 실제 휴대폰의 pinch 동작은 별도 검증이 필요합니다.

## 소스

- `dist/harbor-world.js`: 건물·배·크레인·생물과 수중 소품
- `dist/harbor-sim.js`: 물결 계산과 항구 운영 상태
- `dist/harbor-motion.js`: 화물선 항로
- `dist/harbor.js`: 렌더링, 애니메이션, 카메라와 입력
- `dist/harbor.css`, `dist/index.html`: 반응형 조작 화면
- `tests/harbor.test.mjs`: 핵심 동작 테스트
- `dist/vendor/`: Three.js 0.180.0과 OrbitControls, MIT license
- `dist/assets/`: local fonts와 Phosphor icons, 각 license 포함

물은 WebGL render target을 사용한 screen-space 굴절과 단면 transmission으로 표현합니다. 물결과 부력은 시각 효과용 근사 모델입니다. 배와 크레인은 미리 정한 항로·상태에 따라 움직입니다.

소설·게임 방향의 작업은 `codex/lyrical-novel` branch에 별도로 보존했습니다. 이전 소설 모듈도 남아 있지만 현재 entrypoint에서는 로드하지 않습니다.

## 배포

`main`에 push하면 GitHub Actions가 문법·동작 테스트를 실행한 뒤 `dist`를 GitHub Pages에 배포합니다. 로그인이나 API key 없이 열 수 있습니다.
