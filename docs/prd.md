# speakmemo PRD — MVP

## 핵심 목표

**"말하면 바로 정리된 노트가 나온다"** — 이 한 가지 경험만 완벽하게 만든다.

핵심 플로우: 녹음 버튼 탭 → 말하기 → 완료 → 요약 + 핵심 포인트 + 할 일 목록 자동 생성

---

## MVP 스코프

### 포함 (Must-have)

- 모바일 웹 앱 (PWA) — 앱스토어 심사 없이 빠르게 배포
- 음성 녹음 및 STT 전사 (Whisper API)
- LLM 기반 구조화 — 요약 / 핵심 포인트 / 액션아이템 자동 추출
- 노트 목록 및 상세 조회
- Google OAuth 로그인
- 랜딩 페이지

### 제외 (Post-MVP)

- 네이티브 앱 (iOS/Android)
- 외부 연동 (Notion, Jira, Calendar 등)
- 팀/협업 기능
- 커스텀 프롬프트/템플릿 설정
- 결제/구독 시스템
- 실시간 스트리밍 전사
- 다국어 지원 (한국어 우선, 영어는 후순위)

---

## 기술 스택

| 영역         | 선택                                             |
| ------------ | ------------------------------------------------ |
| 프레임워크   | Next.js (App Router) + Tailwind CSS              |
| PWA          | next-pwa 또는 커스텀 서비스워커                  |
| 인증         | Better Auth — Google OAuth (이미 세팅됨)         |
| DB / Storage | Supabase (PostgreSQL + Storage)                  |
| STT          | OpenAI Whisper API (`whisper-1`, language: `ko`) |
| LLM          | Claude Haiku (속도/비용 최적) 또는 GPT-4o-mini   |
| 배포         | Vercel                                           |

---

## DB 스키마

### `notes` 테이블

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id)
status          TEXT NOT NULL DEFAULT 'processing'
                  -- processing | structuring | completed | failed
recording_url   TEXT          -- Supabase Storage 경로
duration_sec    INTEGER       -- 녹음 길이 (초)
transcript      TEXT          -- Whisper 전사 원문
summary         TEXT          -- LLM 요약
key_points      JSONB         -- ["포인트1", "포인트2", ...]
action_items    JSONB         -- [{ task, priority, done }, ...]
tags            JSONB         -- ["태그1", "태그2"]
segments        JSONB         -- Whisper 타임스탬프 세그먼트 (후속 활용)
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

**RLS**: `user_id = auth.uid()` 조건으로 Row Level Security 적용 필수.

---

## API 엔드포인트

| Method | Path                    | 설명                     |
| ------ | ----------------------- | ------------------------ |
| POST   | `/api/notes/process`    | 녹음 업로드 후 처리 시작 |
| GET    | `/api/notes/:id/status` | 처리 상태 폴링           |
| GET    | `/api/notes/:id`        | 노트 전체 데이터 조회    |
| GET    | `/api/notes`            | 노트 목록 (최신순)       |
| DELETE | `/api/notes/:id`        | 노트 삭제                |

---

## 전체 기술 파이프라인

### 1단계 — 음성 녹음 (클라이언트)

```
녹음 버튼 탭
    ↓
MediaRecorder 초기화
  - Chrome: audio/webm;codecs=opus
  - Safari: audio/mp4 (isTypeSupported()로 분기)
  - 샘플레이트: 16kHz (STT 최적)
    ↓
녹음 중 UI (파형 애니메이션 + 타이머)
ondataavailable로 청크 단위 수집 (크래시 대비)
최대 녹음 길이: 5분 (비용 제한)
    ↓
완료 버튼 탭 → Blob → File 변환
```

### 2단계 — 업로드 + 처리 트리거 (클라이언트 → 서버)

```
녹음 파일 (Blob)
    ↓
Supabase Storage 업로드
  경로: /recordings/{user_id}/{timestamp}.webm
  업로드 진행률 UI 표시
    ↓
POST /api/notes/process
  body: { recording_url, duration, created_at }
    ↓
DB에 note 레코드 생성 (status: "processing")
    ↓
클라이언트에 note_id 반환 → 폴링 시작
  GET /api/notes/{note_id}/status (2초 간격)
  UI: "AI가 정리하고 있어요..." 스피너
```

> **Vercel 타임아웃 주의**: Serverless Function 기본 10초 (Hobby), 60초 (Pro).
> 긴 녹음은 백그라운드 처리 또는 Supabase Edge Function 활용.

### 3단계 — STT 전사 (서버)

```
Supabase Storage에서 음성 파일 다운로드
    ↓
파일 크기 확인 (Whisper API 제한: 25MB)
긴 녹음 시 청크 분할 (ffmpeg, 5분 단위)
    ↓
OpenAI Whisper API 호출
  model: "whisper-1"
  language: "ko"  ← 명시 필수 (자동감지 대비 ~15% 정확도 향상)
  response_format: "verbose_json"  ← 타임스탬프 포함
    ↓
전사 결과 수신 → DB 업데이트 (status: "structuring")
```

**비용**: $0.006/분 → 3분 녹음 기준 ~$0.018

### 4단계 — LLM 구조화 (서버)

**시스템 프롬프트**:

```
당신은 음성 메모를 구조화하는 전문가입니다.
사용자가 말한 내용을 아래 JSON 형식으로 정리하세요.

규칙:
1. summary: 전체 내용을 2-3문장으로 요약
2. key_points: 핵심 포인트 3-7개 (불릿 형태)
3. action_items: 실행 가능한 할 일 추출 (없으면 빈 배열)
   - 각 항목에 priority (high/medium/low) 부여
4. tags: 내용 기반 태그 1-3개 자동 생성
5. 말투나 군더더기("음...", "그러니까")는 제거하고 핵심만
6. 한국어로 출력

반드시 유효한 JSON만 출력하세요.
```

**출력 JSON 스키마**:

```json
{
  "summary": "전체 내용 요약 2-3문장",
  "key_points": ["포인트1", "포인트2", "포인트3"],
  "action_items": [{ "task": "할 일", "priority": "high" }],
  "tags": ["태그1", "태그2"]
}
```

> - JSON 파싱 실패 시 재시도 1회, 그래도 실패하면 raw transcript만 저장
> - few-shot 예시 1-2개 포함하면 출력 품질 크게 향상됨

**비용**: Claude Haiku $0.25/1M input → 3분 녹음 기준 ~$0.001

### 5단계 — 결과 렌더링 (클라이언트)

```
폴링에서 status: "completed" 감지
    ↓
GET /api/notes/{note_id} → 전체 데이터 로드
    ↓
노트 상세 페이지 렌더링:
  - 제목 (날짜 + 녹음 길이)
  - 요약
  - 핵심 포인트 (불릿)
  - 할 일 목록 (체크박스)
  - 태그
  - 원문 전사 토글
  - 원본 음성 재생 버튼
```

### 전체 시퀀스

```
User       Client(PWA)     Server(API)    Whisper    LLM     Supabase
 │              │               │             │        │          │
 │──녹음 완료─→│               │             │        │          │
 │              │──파일 업로드─→│─────────────────────────────→Storage
 │              │──처리 요청──→│             │        │          │
 │              │←─note_id────│             │        │          │
 │              │               │──STT 요청──→│        │          │
 │  "정리 중..."│──폴링────────→│←─transcript│        │          │
 │              │               │──LLM 요청───────────→│          │
 │              │←─processing─│←─JSON──────────────│          │
 │              │               │──결과 저장──────────────────→DB
 │              │──폴링────────→│             │        │          │
 │              │←─completed──│             │        │          │
 │              │──노트 조회──→│←───────────────────────────DB
 │←─결과 렌더─│               │             │        │          │
```

### 예상 처리 시간 & 비용 (3분 녹음 기준)

| 단계       | 소요 시간   | 비용                      |
| ---------- | ----------- | ------------------------- |
| 업로드     | ~1초        | 무료 (Supabase 무료 티어) |
| STT 전사   | 5~10초      | ~$0.018                   |
| LLM 구조화 | 2~4초       | ~$0.001                   |
| **전체**   | **~8~15초** | **~$0.02/건**             |

월 1,000건 처리 시 예상 비용: **~$20** (STT $18 + LLM $1 + 인프라 $1)

---

## 2주 스프린트 로드맵

### Week 1: 핵심 파이프라인 구축 (2/17 ~ 2/23)

#### Day 1-2 (월-화): 프로젝트 셋업 + 음성 녹음

- [x] Supabase 프로젝트 생성 및 연동 (DB + Storage) — DB 연동 완료 (Prisma + PostgreSQL), Storage 미구현
- [x] Google OAuth 로그인 구현 (Better Auth 기반, 이미 세팅됨)
- [ ] 모바일 웹 음성 녹음 UI 구현 (MediaRecorder API)
- [ ] Safari/Chrome 코덱 분기 처리
- [ ] 녹음 파일 Supabase Storage 업로드

**산출물**: 로그인 → 녹음 → 저장까지 동작

#### Day 3-4 (수-목): STT + AI 구조화 파이프라인

- [ ] Whisper API 연동 (음성 → 텍스트 전사)
- [ ] 한국어 전사 품질 테스트 (산책 독백, 회의 메모, 아이디어 브레인스토밍 시나리오)
- [ ] LLM 프롬프트 설계 및 반복 테스트
- [ ] `POST /api/notes/process` 엔드포인트 구현
- [ ] `notes` 테이블 Prisma 스키마 추가 + 마이그레이션

**산출물**: 음성 → 전사 → 구조화 결과까지 E2E 파이프라인 동작

#### Day 5 (금): 노트 저장 + 목록/상세 UI

- [ ] 노트 목록 페이지 (최신순, 요약 미리보기)
- [ ] 노트 상세 페이지 (구조화 결과 + 원문 전사 토글)
- [ ] `GET /api/notes`, `GET /api/notes/:id` 구현

**산출물**: 녹음한 노트들을 목록에서 보고 상세 확인 가능

#### Day 6-7 (토-일): 모바일 UX 다듬기 + 버그 수정

- [ ] 모바일 반응형 UI 최적화
- [ ] PWA 설정 (홈 화면 추가, 오프라인 기본 셸)
- [ ] 녹음 중 UI (파형 애니메이션, 녹음 시간 표시)
- [ ] 로딩/처리 중 상태 표시 ("AI가 정리하고 있어요...")
- [ ] Week 1 통합 테스트 및 버그 수정

**산출물**: 모바일에서 매끄럽게 동작하는 핵심 플로우

---

### Week 2: 완성도 + 런칭 준비 (2/24 ~ 3/2)

#### Day 8-9 (월-화): 사용성 개선

- [ ] 노트 삭제 기능
- [ ] 액션아이템 체크박스 (완료 체크)
- [ ] 노트 검색 (키워드 기반)
- [ ] 녹음 재생 기능 (원본 음성 다시 듣기)
- [ ] 처리 실패 시 재시도 로직

**산출물**: 실사용 가능한 수준의 기본 기능 완성

#### Day 10-11 (수-목): 랜딩 페이지 + 온보딩

- [ ] 랜딩 페이지 (가치 제안, 데모 GIF, CTA)
- [ ] 첫 사용자 온보딩 플로우 ("말해보세요" 가이드)
- [ ] 얼리액세스 신청 폼 (Tally 또는 Google Form)
- [ ] OG 이미지 + SEO 기본 설정

**산출물**: 공유 가능한 랜딩 페이지

#### Day 12 (금): QA + 성능 최적화

- [ ] 다양한 모바일 브라우저 테스트 (Chrome, Safari)
- [ ] 긴 녹음(5분+) 처리 테스트
- [ ] API 에러 핸들링 점검
- [ ] Supabase RLS (Row Level Security) 확인
- [ ] API 호출당 비용 계산 및 검증

**산출물**: 안정적으로 동작하는 서비스

#### Day 13-14 (토-일): 소프트 런칭

- [ ] 최종 버그 수정 및 Vercel 배포
- [ ] X(Twitter) / Threads 빌딩 인 퍼블릭 포스트 작성
- [ ] 지인 10~20명 테스트 요청
- [ ] 피드백 수집 채널 설정 (Tally 또는 Google Form)
- [ ] Vercel Analytics + 커스텀 이벤트 모니터링 설정

**산출물**: 소프트 런칭 완료 + 초기 피드백 수집 시작

---

## 핵심 리스크 & 대응

| 리스크                       | 대응 방안                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------- |
| 한국어 STT 품질 부족         | Whisper large-v3 우선 테스트, 부족 시 Deepgram 한국어 또는 Clova Speech 병행 |
| LLM 구조화 결과 품질 불안정  | 시나리오별 프롬프트 A/B 테스트, few-shot 예시 포함                           |
| 모바일 브라우저 녹음 호환성  | Safari webm 미지원 → `isTypeSupported()`로 `audio/mp4` 폴백 분기             |
| API 비용 급증                | 무료 구간 녹음 3분 제한, Whisper tiny/small 모델 비용 비교                   |
| 처리 시간 지연 (사용자 이탈) | 비동기 처리 + 폴링으로 결과 알림, "정리 중" UX 명확히 표시                   |

---

## MVP 성공 지표

| 지표            | 목표                                                        |
| --------------- | ----------------------------------------------------------- |
| Day 1 Retention | 첫날 녹음한 사용자 중 다음날 재방문율 > 30%                 |
| 완료율          | 녹음 시작 → 구조화 결과 확인까지 도달율 > 80%               |
| 사용자 만족     | "다시 듣지 않아도 될 정도로 정리가 잘 된다" 긍정 응답 > 60% |
| 주간 사용       | 주 3회 이상 사용하는 사용자 비율 추적                       |

---

## Post-MVP 우선순위

1. Notion / TickTick 연동 (액션아이템 자동 내보내기)
2. 커스텀 템플릿 (회의록, 일기, 아이디어 등)
3. 프로 플랜 결제 (월 $5~10)
4. 네이티브 앱 (또는 Capacitor 래핑)
5. 팀/공유 기능
6. 웨어러블 연동 (Apple Watch 등)
