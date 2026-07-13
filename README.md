# MapleTogether

MapleTogether는 메이플스토리 캐릭터를 등록하고 넥슨 OpenAPI 데이터를 기반으로 전투력, 장비, 어빌리티, 링크 스킬, 유니온 프리셋을 확인하는 React 대시보드입니다.

## 주요 기능

- 캐릭터 닉네임으로 넥슨 OpenAPI 데이터 조회
- 캐릭터 카드형 대시보드와 드래그 순서 변경
- 같이 플레이하는 사람 기준의 소유자/태그 관리
- 카드 보기, 사람별 보기, 스펙 비교표 보기
- 파티 후보 캐릭터 선택 목록
- 장비/어빌리티/하이퍼스탯/링크 스킬/유니온 상세 보기
- 프리셋 변경에 따른 예상 전투력 시뮬레이션
- 다크/라이트 테마와 localStorage 저장

## 실행 방법

```bash
npm install
cp .env.example .env
```

Cloudflare Pages 배포에서는 `VITE_NEXON_API_PROXY_URL=/api/nexon/maplestory/v1`를 사용하고, `NEXON_API_KEY`는 Pages의 secret으로 설정합니다.

로컬에서 Node 프록시로 개발하려면 `.env`의 `VITE_NEXON_API_PROXY_URL=/api/nexon/maplestory/v1`은 그대로 두고 `NEXON_API_KEY`에 넥슨 OpenAPI 키를 넣은 뒤, 프록시와 Vite 개발 서버를 각각 실행합니다. Vite 개발 서버는 `/api/nexon` 요청을 로컬 프록시(`http://localhost:8787`)로 전달합니다.

```bash
npm run proxy
npm run dev
```

브라우저에서 Vite가 안내하는 로컬 주소를 열면 됩니다.

## API 키 보안

운영 배포에서는 `VITE_NEXON_API_KEY`를 사용하지 마세요. `VITE_`로 시작하는 값은 프론트엔드 번들에 포함되어 사용자가 볼 수 있습니다.

권장 방식은 다음과 같습니다.

- 프론트엔드: `VITE_NEXON_API_PROXY_URL`만 설정
- Cloudflare Pages Functions: `NEXON_API_KEY`를 secret으로 설정

이 저장소의 `functions/api/nexon/maplestory/v1/[[path]].js`는 Cloudflare Pages Functions용 배포 프록시입니다. `server/nexonProxy.js`는 로컬 Node 개발용 프록시 예시입니다.

## Cloudflare Pages 배포 설정

- Framework preset: React (Vite)
- Build command: `npm run build`
- Build output directory: `dist`
- Production environment variable: `VITE_NEXON_API_PROXY_URL=/api/nexon/maplestory/v1`
- Secret: `NEXON_API_KEY=<넥슨 OpenAPI 키>`

## 품질 확인

```bash
npm run lint
npm run test
npm run build
```

## 참고

프리셋 전투력은 넥슨 API의 현재 전투력과 장비/스킬/유니온 문자열을 기반으로 계산한 예상치입니다. 실제 게임 내 계산식과 모든 직업별 예외를 완전히 대체하지는 않으므로, 비교용 지표로 보는 것을 권장합니다.
