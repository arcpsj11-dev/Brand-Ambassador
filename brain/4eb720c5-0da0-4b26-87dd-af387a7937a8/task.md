# 안티그래비티 프로젝트 재구성 작업

## 개요
현재 '제니AI' 프로젝트를 마스터 브리프에 정의된 **안티그래비티 MVP**로 전환합니다.
핵심은 STEP 기반 강제성, 의료 리스크 필터링, A-READ 자동 생성 시스템입니다.

---

## Phase 1: 분석 및 설계
- [x] 현재 프로젝트 구조 분석
- [x] 기존 코드와 신규 요구사항 매핑
- [x] 데이터 모델 설계
  - [x] User Profile 스키마
  - [x] Content Status 정의
  - [x] STEP & Permission 모델
- [x] 시스템 아키텍처 설계
  - [x] RiskFilterEngine 구조
  - [x] STEP 권한 제어 시스템
  - [x] 콘텐츠 생명주기 관리

---

## Phase 2: 핵심 시스템 구축

### 2.1 인증 및 권한 시스템
- [x] UserRole 확장 (기존 admin/user 유지)
- [x] STEP 필드 추가 (STEP 1/2/3)
- [x] Permission 기반 접근 제어 구현 (Protocol v1.0)
- [x] 요금제별 기능 제한 로직 (START/GROW/SCALE)

### 2.2 초기 프로파일 입력 (0단계)
- [x] 병원 기본 정보 입력 폼 생성
- [x] 원장 전문 포지션 입력
- [x] 콘텐츠 톤 & 방향 설정
- [x] 프로파일 완료 전까지 글 생성 버튼 비활성화
- [x] 신규 useProfileStore 생성

### 2.3 STEP 시스템 구현
- [x] STEP 상태 관리 (useStepStore 생성)
- [x] STEP별 UI 권한 제어 (Restricted/Full Editor)
- [x] STEP 진행 로직 구현 (Adaptive Period & Upgrade Criteria)

### 2.4 콘텐츠 데이터 정책
- [x] Content Status 타입 정의
- [x] 콘텐츠 삭제 기능 제거
- [x] 상태 변경 전용 UI 구현
- [x] useContentStore 생성 (영구 보존 로직)

### 2.5 의료 리스크 필터 (RiskFilterEngine)
- [x] RiskFilterEngine 클래스 설계
- [x] MedicalRuleSet 구현
- [x] 3단계 필터링 적용 (생성/수정/발행)
- [x] 필터 결과 UI 표시 (Safety View)

---

## Phase 3: 콘텐츠 생성 시스템 (A-READ & Today Action)
- [x] A-READ 자동 생성 로직 통합
- [x] 예약 발행 시스템 (Default ON, Slot Optimization)
- [x] 오늘의 액션 UX (State Machine 기반 강제성)

---

## Phase 4: 원내 홍보물 자동 변환 (OPG)
- [x] OPG 모듈 생성 (features/opg)
- [x] 블로그 글 → 홍보물 변환 로직 (Auto-Summary)
- [x] MedicalRuleSet 재검증 통합
- [x] 고정 템플릿 적용 (Choice System)
- [x] PDF/이미지 출력 기능 (pdfExporter)
- [x] Protocol v1.0 Access Control (GROW Plan Gate)

---

## Phase 5: 블로그 지수 대시보드 (Blog Metrics)
- [x] **Store**: `useBlogMetricStore` 생성 (다중 계정 지수 관리)
- [x] **UI**: `BlogMetricCard` 컴포넌트 구현
  - [x] 계정 선택 드롭다운
  - [x] 지수 점수 및 색상 시각화 (0~100)
  - [x] 지표 요약 (조회/공감/댓글) 및 추이 그래프
  - [x] 네이버 글쓰기 바로가기 (`logwrite` URL)
- [x] **Integration**: Dashboard (`App.tsx`) 탑재

- [x] **Integration**: Dashboard (`App.tsx`) 탑재

---

## Phase 6: 콘텐츠 클러스터링 시스템 (Content Clustering)
- [x] **Store**: `useTopicStore` 생성 (30개 주제, 3개 클러스터 구조화)
- [x] **Logic**: 클러스터 로테이션 (1 Pillar + 9 Supporting) 및 10일 주기 관리
- [x] **AI**: `geminiService` 업데이트 (클러스터 단위 주제 생성 프롬프트)
- [x] **UI**: `TodayActionFlow` 연동 (다음 주제 자동 제안)
- [x] **Feature**: 내부 링크(Internal Link) 자동 삽입 로직

---

## Phase 7: AI 엔진 V4 고도화 및 STEP 로직 수정
- [x] **AI**: `geminiService` - 신뢰받는 의료 전문가 톤 (90:10) 및 학회 데이터 인용 로직 구현
- [x] **SEO**: 본문 서두 300자 내 키워드 밀도 최적화 로직 반영
- [x] **Logic**: `useStepStore` - STEP 3 승급 조건 완화 및 발행 건수 기반 자동 승급 로직 수정
- [x] **UI**: `TodayActionFlow` - 승급 로직 연동 확인
- [x] **Feature**: `ContentArchive` - '다시 생성(Regenerate)' 버튼 구현
- [x] **System**: `Git` - 작업물 깃허브 저장(Commit) 프로세스 수행

---

## Phase 18-22: Protocol v1.0 (Plan x STEP) 통합
- [x] **Permission Matrix 구현**: (Plan >= Required_Plan) AND (Step >= Required_Step)
- [x] **Restricted Editor (Step 1/2)**: Plan x Step 전용 가이드 및 제한 로직
- [x] **Full Editor (Step 3)**: SCALE 플랜 전용 Operator Mode 해금
- [x] **Content Archive**: 요금제 및 신뢰도 기반 접근 제어 가시화
- [x] **Step Upgrade Logic**: 요금제에 따른 STEP 상한선(Cap) 연동

---

## Phase 23: 최종 통합 테스트 및 시나리오 시뮬레이션
- [x] SCALE 가입자의 STEP 1 제한 시나리오 검증
- [x] 요금제 다운그레이드 시 권한 즉시 롤백 검증
- [x] OPG 기능의 요금제 기반 선제 해금 (GROW 이상) 검증
- [x] STEP 3 풀 인터벤션 모드 리스크 롤백 테스트
- [x] **Bug Fix**: Dashboard 'Black Screen' crash (missing syncUpgrade) 해결
- [x] **Admin Feature**: Content Archive '전체 아카이브 삭제' 기능 강화
- [x] **UI Update**: Today's Action 'Final Verification' & Naver Publish Flow 구현

---

## 진행 상태
- [x] Protocol v1.0 Plan x STEP Matrix 구현 완료
- [x] OPG (Online to Print Generator) 모듈 구축 및 권한 연동 완료
- [x] 전 시스템 Permission Engine 통합 및 검증 완료
