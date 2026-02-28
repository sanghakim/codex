# TransLingo 시스템 SW 설계 문서

> **프로젝트명:** TransLingo - 다국어 번역 서비스
> **버전:** 1.0
> **최종 수정일:** 2026-02-28
> **기술 스택:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4

---

## 1. 시스템 개요

### 1.1 목적

TransLingo는 텍스트, 이미지, 문서, 서식 콘텐츠를 21개 이상의 언어로 번역하는 웹 기반 다국어 번역 서비스이다.

### 1.2 주요 기능

| 기능 | 설명 |
|------|------|
| **텍스트 번역** | 최대 5,000자의 텍스트를 실시간으로 번역 |
| **이미지 번역** | 이미지에서 텍스트를 추출(OCR)한 후 번역 |
| **문서 번역** | PDF, DOCX, PPTX, XLSX 등 12종 파일에서 텍스트를 추출하여 번역 |
| **서식 번역** | HTML, Markdown, JSON, XML, CSV의 구조를 유지한 채 콘텐츠만 번역 |

### 1.3 지원 언어 (21개)

자동 감지, 한국어, 영어, 일본어, 중국어(간체/번체), 스페인어, 프랑스어, 독일어, 포르투갈어, 러시아어, 아랍어, 힌디어, 태국어, 베트남어, 인도네시아어, 이탈리아어, 네덜란드어, 폴란드어, 터키어, 스웨덴어

---

## 2. 시스템 아키텍처

### 2.1 전체 구조도

```
┌──────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │  Text     │ │  Image   │ │ Document │ │   Format     │   │
│  │Translator │ │Translator│ │Translator│ │  Translator  │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│       │             │            │               │           │
│       ▼             │            │               │           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            translate-client.ts                       │    │
│  │  translateText · translateLongText · translateMarkup │    │
│  │  translateJson · translateCsv                        │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │ HTTPS
                          ▼
              ┌───────────────────────┐
              │  Google Translate API  │
              │  (translate.google     │
              │   apis.com)            │
              └───────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   Server (Next.js API Routes)                │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │ /api/translate│ │ /api/translate│ │ /api/translate      │  │
│  │ /text        │ │ /image       │ │ /document           │  │
│  └──────┬───────┘ └──────┬───────┘ └──────┬─────────────┘  │
│         │                │                 │                 │
│         ▼                ▼                 ▼                 │
│  ┌─────────────┐ ┌─────────────┐  ┌───────────────────┐    │
│  │translator.ts│ │translator.ts│  │  file-parser.ts    │    │
│  │             │ │             │  │ PDF·DOCX·PPTX·XLSX │    │
│  └─────────────┘ └─────────────┘  └───────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ /api/translate/format                                 │   │
│  │ → translator.ts (translateFormat)                     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 아키텍처 설계 원칙

| 원칙 | 설명 |
|------|------|
| **클라이언트 중심 번역** | 번역 API 호출은 브라우저에서 직접 수행하여 서버 부하를 최소화 |
| **서버 중심 파싱** | 바이너리 파일(PDF, DOCX 등) 파싱은 Node.js 환경에서만 가능하므로 서버에서 처리 |
| **관심사 분리** | UI 컴포넌트, 비즈니스 로직(lib), API 라우트, 타입 정의를 분리 |
| **형식 보존 번역** | 문서 구조(태그, 키, 들여쓰기)를 유지한 채 텍스트 콘텐츠만 번역 |

---

## 3. 디렉터리 구조

```
codex/
├── docs/
│   └── SYSTEM_DESIGN.md          # 본 설계 문서
├── public/                        # 정적 에셋 (SVG 아이콘)
├── src/
│   ├── app/
│   │   ├── layout.tsx             # 루트 레이아웃 (HTML, 메타데이터)
│   │   ├── page.tsx               # 메인 페이지 (탭 네비게이션)
│   │   ├── globals.css            # 전역 스타일
│   │   ├── favicon.ico
│   │   └── api/translate/
│   │       ├── text/route.ts      # 텍스트 번역 API
│   │       ├── image/route.ts     # 이미지 OCR 번역 API
│   │       ├── document/route.ts  # 문서 파싱 API
│   │       └── format/route.ts    # 서식 번역 API
│   ├── components/
│   │   ├── Header.tsx             # 상단 네비게이션
│   │   ├── TranslationTabs.tsx    # 번역 모드 탭 전환
│   │   ├── LanguageSelector.tsx   # 언어 선택 드롭다운
│   │   ├── SwapButton.tsx         # 언어 교환 버튼
│   │   ├── TextTranslator.tsx     # 텍스트 번역 UI
│   │   ├── ImageTranslator.tsx    # 이미지 번역 UI
│   │   ├── DocumentTranslator.tsx # 문서 번역 UI
│   │   └── FormatTranslator.tsx   # 서식 번역 UI
│   ├── lib/
│   │   ├── translate-client.ts    # 클라이언트 번역 로직
│   │   ├── translator.ts          # 서버 번역 로직
│   │   ├── mock-translator.ts     # 목 번역 (테스트용)
│   │   ├── file-parser.ts         # 문서 파싱 (PDF, DOCX, PPTX, XLSX 등)
│   │   └── languages.ts           # 언어 목록 및 유틸리티
│   └── types/
│       └── translation.ts         # TypeScript 인터페이스 정의
├── package.json
├── tsconfig.json
├── next.config.ts
└── eslint.config.mjs
```

---

## 4. 컴포넌트 설계

### 4.1 컴포넌트 계층 구조

```
RootLayout (layout.tsx)
└── HomePage (page.tsx)
    ├── Header
    ├── Hero Section (인라인)
    ├── TranslationTabs
    │   ├── [tab="text"]     → TextTranslator
    │   ├── [tab="image"]    → ImageTranslator
    │   ├── [tab="document"] → DocumentTranslator
    │   └── [tab="format"]   → FormatTranslator
    │
    │   각 Translator 공통 하위 컴포넌트:
    │   ├── LanguageSelector (원본)
    │   ├── SwapButton
    │   └── LanguageSelector (번역)
    │
    └── Features Section (인라인)
```

### 4.2 주요 컴포넌트 명세

#### TextTranslator

| 항목 | 내용 |
|------|------|
| **상태** | sourceLang, targetLang, sourceText, translatedText, isLoading, detectedLang |
| **입력** | textarea (최대 5,000자) |
| **출력** | 번역 결과 텍스트, 감지된 언어 표시 |
| **번역 방식** | `translateText()` (클라이언트) |
| **부가 기능** | 복사, 음성(TTS), 텍스트 초기화 |

#### DocumentTranslator

| 항목 | 내용 |
|------|------|
| **상태** | sourceLang, targetLang, selectedFile, originalText, translatedText, pageCount, isLoading, loadingStatus |
| **입력** | 파일 업로드 (드래그 앤 드롭 / 클릭) |
| **출력** | 추출된 원본 텍스트, 번역 결과, 페이지 수 |
| **번역 방식** | 2단계 — 서버 파싱 → 클라이언트 번역 |
| **지원 형식** | PDF, DOCX, DOC, PPTX, XLSX, XLS, TXT, MD, CSV, HTML, JSON, RTF, ODT |
| **제한** | 파일 크기 20MB 이하 |

#### FormatTranslator

| 항목 | 내용 |
|------|------|
| **상태** | sourceLang, targetLang, format, sourceContent, translatedContent, isLoading |
| **입력** | 서식 선택 (HTML/MD/JSON/XML/CSV) + 텍스트 에디터 |
| **출력** | 구조가 보존된 번역 결과 |
| **번역 방식** | `translateFormat()` (서버) |
| **특징** | 태그/키/구분자 유지, 콘텐츠만 번역 |

#### ImageTranslator

| 항목 | 내용 |
|------|------|
| **상태** | sourceLang, targetLang, selectedImage, previewUrl, extractedText, translatedText, isLoading |
| **입력** | 이미지 업로드 (PNG, JPG, GIF, WEBP, 최대 10MB) |
| **출력** | OCR 추출 텍스트, 번역 결과 |
| **번역 방식** | 서버 OCR → 클라이언트 번역 |
| **상태** | OCR 엔진 연동 필요 (Google Vision / Tesseract.js) |

---

## 5. API 설계

### 5.1 API 엔드포인트 목록

| Method | Endpoint | 역할 | 요청 형식 |
|--------|----------|------|-----------|
| POST | `/api/translate/text` | 텍스트 번역 | JSON |
| POST | `/api/translate/image` | 이미지 OCR + 번역 | FormData |
| POST | `/api/translate/document` | 문서 파싱 (텍스트 추출) | FormData |
| POST | `/api/translate/format` | 서식 보존 번역 | JSON |

### 5.2 API 상세 명세

#### POST /api/translate/text

```
요청:
{
  "text": "번역할 텍스트",
  "sourceLang": "auto",      // 선택, 기본값 "auto"
  "targetLang": "en"          // 필수
}

응답 (200):
{
  "translatedText": "Text to translate",
  "detectedLanguage": "ko"
}

에러 (400):
{ "error": "text and targetLang are required" }
```

#### POST /api/translate/document

```
요청: FormData
  - document: File (바이너리 파일)

응답 (200):
{
  "extractedText": "추출된 텍스트...",
  "pageCount": 5,
  "fileName": "report.pdf"
}

에러 (400):
{ "error": "document file is required" }

에러 (500):
{ "error": "파일 파싱 실패: ..." }
```

#### POST /api/translate/format

```
요청:
{
  "content": "<h1>제목</h1>",
  "format": "html",           // html | markdown | json | xml | csv
  "sourceLang": "auto",
  "targetLang": "en"
}

응답 (200):
{
  "translatedContent": "<h1>Title</h1>",
  "format": "html"
}
```

#### POST /api/translate/image

```
요청: FormData
  - image: File (PNG, JPG, GIF, WEBP)
  - sourceLang: string
  - targetLang: string

응답 (200):
{
  "extractedText": "이미지에서 추출된 텍스트",
  "translatedText": "Extracted text from image"
}
```

---

## 6. 문서 파싱 엔진 설계

### 6.1 파서 라이브러리 매핑

| 파일 형식 | 라이브러리 | 추출 방식 |
|----------|-----------|----------|
| PDF | `pdf-parse` (PDFParse 클래스) | `getText()` → 텍스트 + 페이지 수 |
| DOCX | `mammoth` | `extractRawText({ buffer })` → 순수 텍스트 |
| DOC | 자체 구현 | latin1 인코딩에서 가독 문자열 패턴 매칭 |
| PPTX | `jszip` | ZIP 해제 → `ppt/slides/slideN.xml` → `<a:t>` 태그 추출 |
| XLSX / XLS | `xlsx` (SheetJS) | `XLSX.read(buffer)` → `sheet_to_csv()` |
| TXT / MD / CSV / JSON | 내장 | `buffer.toString("utf-8")` |
| HTML / HTM / XML | 내장 | 태그 제거 정규식 |
| RTF | 자체 구현 | RTF 제어 워드 및 그룹 제거 |
| ODT | `jszip` | ZIP 해제 → `content.xml` → 태그 제거 |

### 6.2 파싱 처리 흐름

```
클라이언트                              서버
  │                                      │
  │  FormData(file) ──────────────────▶  │
  │                                      │  1. File → ArrayBuffer → Buffer
  │                                      │  2. 확장자 판별
  │                                      │  3. 해당 파서 호출
  │                                      │     ┌─ PDF  → pdf-parse
  │                                      │     ├─ DOCX → mammoth
  │                                      │     ├─ PPTX → jszip + XML 파싱
  │                                      │     ├─ XLSX → SheetJS
  │                                      │     └─ TXT  → UTF-8 디코딩
  │                                      │  4. { text, pageCount } 반환
  │  ◀─── { extractedText, pageCount } ──│
  │                                      │
  │  텍스트를 Google Translate로 번역     │
  │  (클라이언트에서 직접)                │
  │                                      │
```

### 6.3 PPTX 슬라이드 추출 상세

```
PPTX (ZIP 아카이브)
├── [Content_Types].xml
├── _rels/.rels
└── ppt/
    └── slides/
        ├── slide1.xml   ─▶ <a:t>텍스트</a:t> 추출 ─▶ [슬라이드 1] 텍스트
        ├── slide2.xml   ─▶ <a:t>텍스트</a:t> 추출 ─▶ [슬라이드 2] 텍스트
        └── slide3.xml   ─▶ <a:t>텍스트</a:t> 추출 ─▶ [슬라이드 3] 텍스트
```

### 6.4 XLSX 시트 추출 상세

```
XLSX (WorkBook)
├── Sheet1 "매출현황"  ─▶ sheet_to_csv() ─▶ [시트: 매출현황]\n이름,금액,...
├── Sheet2 "직원목록"  ─▶ sheet_to_csv() ─▶ [시트: 직원목록]\n이름,직급,...
└── Sheet3 "설정"      ─▶ sheet_to_csv() ─▶ [시트: 설정]\n키,값,...
```

---

## 7. 번역 엔진 설계

### 7.1 클라이언트 번역 (translate-client.ts)

#### 핵심 함수

| 함수 | 용도 | 청크 크기 |
|------|------|----------|
| `translateText()` | 단건 텍스트 번역 | 제한 없음 (단일 호출) |
| `translateLongText()` | 대용량 텍스트 분할 번역 | 3,000자/청크 |
| `translateMarkup()` | HTML/XML 구조 보존 번역 | 태그 간 텍스트 노드 단위 |
| `translateJson()` | JSON 값만 번역 | 문자열 값 일괄 추출 |
| `translateCsv()` | CSV 헤더 보존, 데이터 번역 | 행 단위 |

#### 대용량 텍스트 분할 전략

```
원본 텍스트 (예: 12,000자)
    │
    ├── 줄바꿈(\n) 기준 분할
    │
    ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 청크 1    │ │ 청크 2    │ │ 청크 3    │ │ 청크 4    │
│ ≤3000자   │ │ ≤3000자   │ │ ≤3000자   │ │ ≤3000자   │
└─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘
      │            │            │            │
      ▼            ▼            ▼            ▼
  Google API    Google API   Google API   Google API
      │            │            │            │
      ▼            ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 번역 결과 │ │ 번역 결과 │ │ 번역 결과 │ │ 번역 결과 │
└─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘
      │            │            │            │
      └────────────┴────────────┴────────────┘
                         │
                         ▼
                  최종 번역 결과 (결합)
```

### 7.2 서식 보존 번역 전략

#### HTML/XML

```
입력: <h1>제목</h1><p>본문 <b>강조</b></p>
      │
      ▼ 텍스트 노드 추출 (정규식: />([^<]+)</)
      ["제목", "본문 ", "강조"]
      │
      ▼ 일괄 번역
      ["Title", "Body ", "Emphasis"]
      │
      ▼ 원본 구조에 재삽입
출력: <h1>Title</h1><p>Body <b>Emphasis</b></p>
```

#### JSON

```
입력: { "title": "제목", "items": ["항목1", "항목2"], "count": 5 }
      │
      ▼ 문자열 값만 재귀 수집
      ["제목", "항목1", "항목2"]    (count: 5는 숫자이므로 제외)
      │
      ▼ 구분자(---SPLIT---) 결합 후 일괄 번역
      "Title---SPLIT---Item 1---SPLIT---Item 2"
      │
      ▼ 분할 후 원본 구조에 재삽입
출력: { "title": "Title", "items": ["Item 1", "Item 2"], "count": 5 }
```

---

## 8. 데이터 흐름도 (기능별)

### 8.1 텍스트 번역

```
사용자 입력 → TextTranslator → translateText() → Google API → 번역 결과 표시
```

### 8.2 문서 번역 (2단계)

```
파일 선택 → DocumentTranslator
    │
    ├─ [1단계: 서버 파싱]
    │   FormData(file) → POST /api/translate/document
    │   → file-parser.ts (extractTextFromFile)
    │   → { extractedText, pageCount }
    │
    └─ [2단계: 클라이언트 번역]
        extractedText → translateLongText() → Google API → 번역 결과 표시
```

### 8.3 서식 번역

```
서식 + 콘텐츠 입력 → FormatTranslator
    │
    └─ POST /api/translate/format
       → translator.ts (translateFormat)
       → 서식별 분기 (translateMarkup / translateJson / translateCsv)
       → { translatedContent }
```

---

## 9. TypeScript 인터페이스 정의

### 9.1 핵심 타입 (src/types/translation.ts)

```typescript
// 언어 정보
interface Language {
  code: string;       // "ko", "en", "ja" 등
  name: string;       // "Korean", "English" 등
  nativeName: string; // "한국어", "English" 등
}

// 번역 탭 타입
type TranslationTab = "text" | "image" | "document" | "format";

// 텍스트 번역
interface TextTranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}
interface TextTranslationResponse {
  translatedText: string;
  detectedLanguage?: string;
}

// 문서 번역
interface DocumentTranslationRequest {
  document: File;
  sourceLang: string;
  targetLang: string;
}
interface DocumentTranslationResponse {
  originalText: string;
  translatedText: string;
  pageCount: number;
  translatedDocumentUrl?: string;
}

// 서식 번역
interface FormatTranslationRequest {
  content: string;
  format: "html" | "markdown" | "json" | "xml" | "csv";
  sourceLang: string;
  targetLang: string;
}
interface FormatTranslationResponse {
  translatedContent: string;
  format: string;
}

// 이미지 번역
interface ImageTranslationRequest {
  image: File;
  sourceLang: string;
  targetLang: string;
}
interface ImageTranslationResponse {
  extractedText: string;
  translatedText: string;
  overlayImageUrl?: string;
}
```

---

## 10. 외부 의존성

### 10.1 npm 패키지

| 패키지 | 버전 | 용도 | 실행 환경 |
|--------|------|------|----------|
| `next` | 16.1.6 | 웹 프레임워크 (SSR/API Routes) | 서버 + 클라이언트 |
| `react` | 19.2.3 | UI 렌더링 | 클라이언트 |
| `typescript` | 5.x | 타입 안전성 | 빌드 타임 |
| `tailwindcss` | 4.x | CSS 유틸리티 프레임워크 | 빌드 타임 |
| `lucide-react` | - | 아이콘 컴포넌트 | 클라이언트 |
| `pdf-parse` | 2.4.5 | PDF 텍스트 추출 | 서버 |
| `mammoth` | 1.11.0 | DOCX 텍스트 추출 | 서버 |
| `xlsx` | 0.18.5 | Excel 스프레드시트 파싱 | 서버 |
| `jszip` | 3.10.1 | ZIP 아카이브 처리 (PPTX, ODT) | 서버 |

### 10.2 외부 API

| API | 용도 | 인증 |
|-----|------|------|
| Google Translate (`translate.googleapis.com`) | 텍스트 번역 | 불필요 (무료 API) |

---

## 11. 보안 고려사항

| 항목 | 대응 |
|------|------|
| **파일 크기 제한** | 20MB 이하로 제한 (클라이언트 + 서버 검증) |
| **파일 형식 검증** | 확장자 화이트리스트 방식 (ACCEPTED_TYPES) |
| **XSS 방지** | React의 자동 이스케이핑, HTML 태그 제거 |
| **서버 부하** | 바이너리 파싱만 서버에서 처리, 번역은 클라이언트에서 직접 호출 |
| **API 키 미사용** | Google Translate 무료 엔드포인트 사용으로 키 노출 위험 없음 |

---

## 12. 성능 최적화

| 전략 | 설명 |
|------|------|
| **청크 분할** | 대용량 텍스트를 3,000자 단위로 분할하여 API 호출 안정성 확보 |
| **클라이언트 번역** | 서버 부하를 줄이고 브라우저에서 직접 Google API 호출 |
| **정적 페이지 생성** | Next.js SSG로 메인 페이지 정적 생성 (빠른 초기 로드) |
| **컴포넌트 지연 로딩** | 탭 전환 시 해당 Translator만 렌더링 |
| **줄바꿈 기준 분할** | 문장 중간 끊김 방지를 위해 줄바꿈 경계에서 청크 분할 |

---

## 13. 제약사항 및 향후 개선

### 13.1 현재 제약사항

| 항목 | 상태 | 설명 |
|------|------|------|
| 이미지 OCR | 미구현 | Google Vision API 또는 Tesseract.js 연동 필요 |
| TTS (음성 합성) | 미구현 | Web Speech API 또는 Google TTS 연동 필요 |
| 번역 문서 다운로드 | 미구현 | 번역 결과를 원본 형식으로 재조립하는 기능 필요 |
| 번역 기록 | 미구현 | 이전 번역 결과 저장/조회 기능 없음 |
| DOC 파싱 | 제한적 | 레거시 .doc 형식은 가독 문자열만 추출 (정확도 낮음) |

### 13.2 향후 개선 로드맵

| 우선순위 | 항목 | 설명 |
|---------|------|------|
| P0 | OCR 엔진 통합 | Tesseract.js 또는 Google Vision API 연동 |
| P1 | 번역 문서 다운로드 | 원본 형식 유지한 번역 파일 생성 (PDF, DOCX 등) |
| P1 | 번역 캐싱 | 동일 텍스트 재번역 방지 (로컬스토리지 / DB) |
| P2 | 실시간 번역 | 입력 중 자동 번역 (디바운싱 적용) |
| P2 | 배치 처리 | 다수 파일 동시 업로드 및 번역 |
| P3 | 번역 메모리 | 용어집 및 번역 기억 기능 |
| P3 | 사용자 인증 | 번역 기록 저장 및 관리 |

---

## 14. 빌드 및 배포

### 14.1 스크립트

```bash
npm run dev      # 개발 서버 (Turbopack)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버
npm run lint     # ESLint 검사
```

### 14.2 빌드 출력

```
Route (app)
┌ ○ /                           # 정적 생성 (SSG)
├ ○ /_not-found                 # 정적 생성 (SSG)
├ ƒ /api/translate/document     # 동적 (서버 렌더링)
├ ƒ /api/translate/format       # 동적 (서버 렌더링)
├ ƒ /api/translate/image        # 동적 (서버 렌더링)
└ ƒ /api/translate/text         # 동적 (서버 렌더링)

○ = Static   ƒ = Dynamic
```

### 14.3 배포 환경 요건

| 항목 | 요구사항 |
|------|---------|
| Node.js | 18.x 이상 |
| 메모리 | 512MB 이상 (문서 파싱 시 버퍼 사용) |
| 디스크 | 100MB 이상 (node_modules 포함) |
| 네트워크 | Google Translate API 접근 가능 |
