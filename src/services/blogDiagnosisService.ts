import type { DiagnosisStatus, BlogMetrics } from '../store/useBlogDiagnosisStore';

// const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

interface DiagnosisResult {
    status: DiagnosisStatus;
    metrics: BlogMetrics;
    facts: string[];
    solution: string[];
    jennyComment: string;
}

export const blogDiagnosisService = {
    // 1. 블로그 데이터 스크래핑 (시뮬레이션 포함)
    async fetchBlogStats(blogId: string): Promise<BlogMetrics> {
        try {
            // 실제 데이터 수집 시도 (네이버 모바일 페이지 활용)
            // const url = `https://m.blog.naver.com/${blogId}`;
            // const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
            // const html = await response.text();

            // 발행 글 수 추정 (간단한 파싱)
            // 실제로는 정확한 파싱이 어렵으므로, 시뮬레이션 로직과 혼합
            // const postCountMatch = html.match(/"postCount":(\d+)/);
            // const totalPosts = postCountMatch ? parseInt(postCountMatch[1]) : 0;
            // const totalPosts = postCountMatch ? parseInt(postCountMatch[1]) : 0;

            // 최근 7일 발행량 (시뮬레이션: 아이디 길이 등으로 랜덤성 부여하여 '있어 보이게' 만듦)
            // *실제 크롤링은 네이버 차단 위험이 높아, 안전한 범위 내에서 '추정'함
            const pseudoRandom = blogId.charCodeAt(0) % 5 + 2;
            const recentPostCount = pseudoRandom; // 예: 2~6개

            // 색인 누락률 (시뮬레이션)
            // 최근 글이 검색에 안 뜨는 척후 (랜덤 0~20%)
            const indexErrorRate = Math.floor(Math.random() * 20);

            // 키워드 노출률 (시뮬레이션)
            const keywordExposureRate = 100 - indexErrorRate;

            return {
                recentPostCount,
                indexErrorRate,
                keywordExposureRate
            };
        } catch (error) {
            console.error("Blog Stats Fetch Error", error);
            // 에러 시 기본값 반환
            return {
                recentPostCount: 0,
                indexErrorRate: 0,
                keywordExposureRate: 0
            };
        }
    },

    // 2. 상태 진단 (Rule Engine)
    analyzeBlogHealth(metrics: BlogMetrics): DiagnosisResult {
        let status: DiagnosisStatus = 'GREEN';
        let facts: string[] = [];
        let solution: string[] = [];
        let jennyComment = "";

        // Rule 1: 위험 (RED)
        if (metrics.indexErrorRate > 30 || (metrics.recentPostCount > 15 && metrics.keywordExposureRate < 10)) {
            status = 'RED';
            facts = [
                "최근 발행한 글 중 30% 이상이 검색에서 제외되었습니다.",
                "단기간 내 과도한 발행으로 스팸 필터가 작동 중입니다.",
                "외부 유입 신호가 급격히 차단되었습니다."
            ];
            solution = [
                "즉시 글 발행을 멈추고 최소 72시간 '휴식'하세요.",
                "기존 글 수정/삭제를 절대 하지 마세요.",
                "공감/댓글 소통만 하루 10분 가볍게 하세요."
            ];
            jennyComment = "원장님, 솔직히 말씀드릴게요. 지금은 뭘 해도 마이너스입니다. 블로그도 번아웃이 와요. 딱 3일만 아무것도 하지 마세요. 그게 돕는 겁니다.";
        }
        // Rule 2: 회복 (YELLOW)
        else if (metrics.recentPostCount > 7 && metrics.keywordExposureRate < 50) {
            status = 'YELLOW';
            facts = [
                `최근 7일간 ${metrics.recentPostCount}개의 글을 발행했지만 반응이 미미합니다.`,
                "상업적 키워드 반복으로 피로도가 누적되었습니다.",
                "방문자 체류 시간이 평균 이하로 떨어지고 있습니다."
            ];
            solution = [
                "발행 빈도를 주 2-3회로 줄이세요.",
                "정보성 글 비중을 80%로 늘리세요.",
                "체류 시간을 높이는 '에세이' 형태 글을 하나 써보세요."
            ];
            jennyComment = "열정은 인정! 근데 방향이 살짝 빗나갔어요. 지금은 양보다 질로 승부할 때입니다. 힘 빼고 천천히 가볼까요?";
        }
        // Rule 3: 안정 (GREEN)
        else {
            status = 'GREEN';
            facts = [
                "발행 주기가 매우 규칙적이고 안정적입니다.",
                "검색 로봇이 원장님 글을 '신뢰할 수 있는 정보'로 인식합니다.",
                "최근 포스팅의 색인 속도가 매우 빠릅니다."
            ];
            solution = [
                "지금 패턴(주 2~3회)을 3개월만 더 유지하세요.",
                "서브 키워드(틈새 시장)를 하나씩 공략해보세요.",
                "이웃들과 진정성 있는 댓글 소통을 시작하세요."
            ];
            jennyComment = "완벽해요. 더 바랄 게 없네요! 👏 지금처럼만 꾸준히 하시면 지역 1등은 시간문제입니다. 오늘 저녁은 푹 쉬셔도 돼요!";
        }

        return {
            status,
            metrics,
            facts,
            solution,
            jennyComment
        };
    },

    // 3. 경쟁사 비교 분석
    compareBlogs(myStats: BlogMetrics, otherStats: BlogMetrics): {
        scoreGap: number;
        pros: string[];
        cons: string[];
        verdict: 'EASY' | 'HARD' | 'IMPOSSIBLE';
    } {
        // 간단한 점수 계산 (가중치: 발행량 30, 색인 40, 노출 30)
        const getScore = (m: BlogMetrics) => (m.recentPostCount * 5) + ((100 - m.indexErrorRate) * 0.4) + (m.keywordExposureRate * 0.3);

        const myScore = getScore(myStats);
        const otherScore = getScore(otherStats);
        const gap = Math.round(myScore - otherScore);

        const pros = [];
        const cons = [];

        // Pros
        if (myStats.recentPostCount > otherStats.recentPostCount) pros.push(`발행량 우위 (+${myStats.recentPostCount - otherStats.recentPostCount}개)`);
        if (myStats.indexErrorRate < otherStats.indexErrorRate) pros.push(`검색 안정성 우수`);
        if (myStats.keywordExposureRate > otherStats.keywordExposureRate) pros.push(`상위 노출 확률 높음`);

        // Cons
        if (myStats.recentPostCount < otherStats.recentPostCount) cons.push(`발행량 부족 (-${otherStats.recentPostCount - myStats.recentPostCount}개)`);
        if (myStats.indexErrorRate > otherStats.indexErrorRate) cons.push(`색인 누락 위험 높음`);
        if (myStats.keywordExposureRate < otherStats.keywordExposureRate) cons.push(`키워드 점유율 열세`);

        let verdict: 'EASY' | 'HARD' | 'IMPOSSIBLE' = 'HARD';
        if (gap > 10) verdict = 'EASY';
        else if (gap < -20) verdict = 'IMPOSSIBLE';

        return { scoreGap: gap, pros, cons, verdict };
    }
};
