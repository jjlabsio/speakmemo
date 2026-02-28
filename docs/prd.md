# semo PRD — MVP

> 서비스 브랜딩(이름, 카피, 톤앤매너, UI 문구)은 [브랜딩 가이드](./branding.md)를 참조하세요.

## 핵심 목표

**"말하면, 정리된다."** — 이 한 가지 경험만 완벽하게 만든다.

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
- 결제/구독 시스템 (Polar 연동 준비됨, 기능 구현은 Post-MVP)
- 실시간 스트리밍 전사
- 다국어 지원 (한국어 우선, 영어는 후순위)

---

## 기술 스택

> 기술 스택 상세는 [README.md](../README.md#tech-stack)를 참조하세요.

---

## DB 스키마

> Prisma 스키마 원본: `packages/database/prisma/schema/note.prisma`

### NoteStatus enum

```prisma
enum NoteStatus {
  processing   // STT 전사 중
  transcribed  // 전사 완료, LLM 구조화 대기/진행 중
  summarized   // 모든 처리 완료
  failed       // 처리 실패

  @@map("note_status")
}
```

### Note 모델

```prisma
model Note {
  id           String     @id @default(cuid())
  userId       String     @map("user_id")
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  status       NoteStatus @default(processing)
  recordingUrl String?    @map("recording_url")   // Supabase Storage 경로
  durationSec  Int?       @map("duration_sec")     // 녹음 길이 (초)
  transcript   String?                              // Whisper 전사 원문
  summary      String?                              // LLM 요약
  keyPoints    Json?      @map("key_points")        // ["포인트1", "포인트2", ...]
  actionItems  Json?      @map("action_items")      // [{ task, priority, done }, ...]
  tags         Json?                                 // ["태그1", "태그2"]
  segments     Json?                                 // Whisper 타임스탬프 세그먼트 (후속 활용)
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")

  @@index([userId, createdAt(sort: Desc)])
  @@map("notes")
}
```

**인가(Authorization)**: 모든 API 엔드포인트에서 `session.userId === note.userId` 검증 필수. Better Auth 세션 기반으로 처리.

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
PostgreSQL(Prisma)에 Note 레코드 생성 (status: processing)
    ↓
클라이언트에 note_id 반환 → 폴링 시작
  GET /api/notes/{note_id}/status (2초 간격)
  UI: 단계별 상태 문구 표시 (브랜딩 가이드 > 주요 UI 문구 참조)
```

> **Vercel 타임아웃 주의**: Serverless Function 기본 10초 (Hobby), 60초 (Pro).
> 긴 녹음은 Vercel Pro 플랜 또는 백그라운드 처리 패턴 활용.

### 3단계 — STT 전사 (서버)

```
Supabase Storage에서 음성 파일 다운로드 (서버 사이드)
    ↓
파일 크기 확인 (Whisper API 제한: 25MB)
긴 녹음 시 청크 분할 (ffmpeg, 5분 단위)
    ↓
OpenAI Whisper API 호출
  model: "whisper-1"
  language: "ko"  ← 명시 필수 (자동감지 대비 ~15% 정확도 향상)
  response_format: "verbose_json"  ← 타임스탬프 포함
    ↓
전사 결과 수신 → DB 업데이트 (status: transcribed)
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

> - JSON 파싱 실패 시 재시도 1회, 그래도 실패하면 raw transcript만 저장 (status: `transcribed`로 유지)
> - few-shot 예시 1-2개 포함하면 출력 품질 크게 향상됨
> - 성공 시 DB 업데이트 (status: `summarized`)

**비용**: Claude Haiku $0.25/1M input → 3분 녹음 기준 ~$0.001

### 5단계 — 결과 렌더링 (클라이언트)

```
폴링에서 status: summarized 감지
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
User       Client(PWA)     Server(API)    Whisper    LLM     Storage   DB(PostgreSQL)
 │              │               │             │        │         │            │
 │──녹음 완료─→│               │             │        │         │            │
 │              │──파일 업로드─→│─────────────────────────────→│            │
 │              │──처리 요청──→│             │        │         │            │
 │              │               │──Note 생성────────────────────────────→│
 │              │←─note_id────│             │        │         │            │
 │              │               │──STT 요청──→│        │         │            │
 │  "정리 중..."│──폴링────────→│←─transcript│        │         │            │
 │              │               │──status:transcribed──────────────────→│
 │              │←─transcribed│               │        │         │            │
 │              │               │──LLM 요청───────────→│         │            │
 │              │               │←─JSON──────────────│         │            │
 │              │               │──status:summarized───────────────────→│
 │              │──폴링────────→│             │        │         │            │
 │              │←─summarized─│             │        │         │            │
 │              │──노트 조회──→│←──────────────────────────────────────│
 │←─결과 렌더─│               │             │        │         │            │
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

### Phase 0: 랜딩 페이지 선행 배포 (SEO 선점)

> 본격적인 개발 전에 랜딩 페이지를 먼저 배포하여 SEO 인덱싱을 시작한다.
> 검색엔진 크롤링/인덱싱에 수일~수주가 걸리므로 가능한 빨리 배포하는 것이 유리하다.

- [x] 랜딩 페이지 구현 (히어로 섹션 + 가치 제안 + 기능 소개 + CTA)
- [x] OG 이미지 + 메타 태그 (title, description, og:image)
- [x] SEO 기본 설정 (sitemap.xml, robots.txt, 구조화 데이터)
- [x] Google Search Console 등록 + 색인 요청
- [x] Vercel 배포 (speakmemo.app 도메인 연결)
- [x] Vercel Analytics 설정

**산출물**: speakmemo.app에 랜딩 페이지가 라이브, 검색엔진 인덱싱 시작, CTA는 앱으로 바로 연결

---

### Week 1: 핵심 파이프라인 구축

#### Day 1-2 (월-화): 프로젝트 셋업 + 음성 녹음

- [x] PostgreSQL + Prisma ORM 설정 (Docker Compose 기반)
- [x] Supabase Storage 연동 (음성 파일 업로드용)
- [x] Google OAuth 로그인 구현 (Better Auth 기반, 이미 세팅됨)
- [x] 모바일 웹 음성 녹음 UI 구현 (MediaRecorder API)
- [x] Safari/Chrome 코덱 분기 처리
- [x] 녹음 파일 Supabase Storage 업로드

**산출물**: 로그인 → 녹음 → 저장까지 동작

#### Day 3-4 (수-목): STT + AI 구조화 파이프라인

- [ ] Whisper API 연동 (음성 → 텍스트 전사)
- [ ] 한국어 전사 품질 테스트 (산책 독백, 회의 메모, 아이디어 브레인스토밍 시나리오)
- [ ] LLM 프롬프트 설계 및 반복 테스트
- [ ] `POST /api/notes/process` 엔드포인트 구현
- [ ] Note 모델 Prisma 스키마 추가 + 마이그레이션 (이미 완료됨)

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
- [ ] 로딩/처리 중 단계별 상태 문구 표시 (브랜딩 가이드 > 주요 UI 문구 참조)
- [ ] Week 1 통합 테스트 및 버그 수정

**산출물**: 모바일에서 매끄럽게 동작하는 핵심 플로우

---

### Week 2: 완성도 + 런칭 준비

#### Day 8-9 (월-화): 사용성 개선

- [ ] 노트 삭제 기능
- [ ] 액션아이템 체크박스 (완료 체크)
- [ ] 노트 검색 (키워드 기반)
- [ ] 녹음 재생 기능 (원본 음성 다시 듣기)
- [ ] 처리 실패 시 재시도 로직

**산출물**: 실사용 가능한 수준의 기본 기능 완성

#### Day 10-11 (수-목): 온보딩 + 랜딩 페이지 업데이트

- [ ] 첫 사용자 온보딩 플로우 ("첫 메모를 남겨보세요" 가이드)
- [ ] 랜딩 페이지에 실제 데모 GIF/영상 추가 (실제 동작하는 앱 기반)
- [ ] 랜딩 페이지 → 앱 연결 플로우 개선

**산출물**: 온보딩 완성 + 실제 제품 기반 랜딩 페이지 업데이트

#### Day 12 (금): QA + 성능 최적화

- [ ] 다양한 모바일 브라우저 테스트 (Chrome, Safari)
- [ ] 긴 녹음(5분+) 처리 테스트
- [ ] API 에러 핸들링 점검
- [ ] API 레벨 인가(Authorization) 검증 — 모든 엔드포인트에서 세션 userId 확인
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
3. 프로 플랜 결제 — Polar 연동 (월 $5~10)
4. 네이티브 앱 (또는 Capacitor 래핑)
5. 팀/공유 기능
6. 웨어러블 연동 (Apple Watch 등)
