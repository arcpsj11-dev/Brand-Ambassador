// 경쟁사 분석 서비스: Naver VIEW 검색 + 블로그 데이터 수집
export interface BlogMetrics {
    url: string;
    title: string;
    wordCount: number;
    imageCount: number;
    hasVideo: boolean;
    keywordFrequency: number;
}

export interface CompetitorAnalysisResult {
    keyword: string;
    myContent: BlogMetrics;
    topBlogs: BlogMetrics[];
    topAverage: {
        wordCount: number;
        imageCount: number;
        hasVideo: boolean;
        keywordFrequency: number;
        score: number;
    };
    myScore: number;
}

const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = import.meta.env.VITE_NAVER_CLIENT_SECRET;

// 랜덤 User-Agent 리스트 (봇 탐지 회피)
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
];

// 랜덤 딜레이 (1~3초)
const randomDelay = () => new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

// 랜덤 User-Agent 선택
const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

/**
 * 네이버 VIEW 탭 검색 (공식 API)
 * @param keyword 검색 키워드
 * @returns 상위 1~3위 블로그 URL 리스트
 */
export async function searchNaverView(keyword: string): Promise<{ title: string; url: string }[]> {
    try {
        // Naver Search API: Blog (Unified Proxy)
        const searchUrl = `/api/naver/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=3&sort=sim`;

        const response = await fetch(searchUrl, {
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
                // User-Agent는 브라우저가 자동으로 설정하므로 생략하거나, Proxy에서 덮어써야 함.
                // 여기서는 브라우저 User-Agent를 사용하도록 둠.
            }
        });

        if (!response.ok) {
            throw new Error(`Naver API Error: ${response.status}`);
        }

        const data = await response.json();

        // HTML 태그 제거 함수
        const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

        return data.items.slice(0, 3).map((item: any) => ({
            title: stripHtml(item.title),
            url: item.link
        }));
    } catch (error) {
        console.error('[searchNaverView] Error:', error);
        throw error;
    }
}

/**
 * 개별 블로그 페이지 분석
 * @param url 블로그 URL
 * @param keyword 타겟 키워드
 * @returns 블로그 메트릭 데이터
 */
export async function analyzeBlogContent(url: string, keyword: string): Promise<BlogMetrics> {
    const fetchWithProxy = async (proxyUrl: string) => {
        const response = await fetch(proxyUrl, {
            headers: { 'User-Agent': getRandomUserAgent() }
        });
        if (!response.ok) throw new Error(`Status ${response.status}`);
        return await response.text();
    };

    try {
        await randomDelay();

        let html = '';
        try {
            // 1. Primary Proxy: allorigins
            html = await fetchWithProxy(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
        } catch (e) {
            console.warn(`Primary proxy failed for ${url}, trying backup...`);
            // 2. Backup Proxy: corsproxy.io
            html = await fetchWithProxy(`https://corsproxy.io/?${encodeURIComponent(url)}`);
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // IFRAME 내부 콘텐츠 대응 (네이버 블로그는 iframe 사용)
        const iframe = doc.querySelector('#mainFrame');
        if (iframe && iframe.getAttribute('src')) {
            const iframeSrc = `https://blog.naver.com${iframe.getAttribute('src')}`;
            try {
                // iframe 주소로 재요청
                await randomDelay();
                html = await fetchWithProxy(`https://api.allorigins.win/raw?url=${encodeURIComponent(iframeSrc)}`);
                const iframeDoc = parser.parseFromString(html, 'text/html');

                // 본문 텍스트 추출 (iframe 내부)
                const mainContainer = iframeDoc.querySelector('.se-main-container') || iframeDoc.querySelector('#postViewArea');
                const textContent = mainContainer?.textContent || iframeDoc.body.textContent || '';
                const wordCount = textContent.trim().replace(/\s+/g, '').length;

                const images = iframeDoc.querySelectorAll('img');
                const hasVideo = !!(iframeDoc.querySelector('video') || iframeDoc.querySelector('iframe[src*="video"]'));
                const keywordFrequency = (textContent.match(new RegExp(keyword, 'gi')) || []).length;

                return {
                    url,
                    title: iframeDoc.title || doc.title || '제목 없음',
                    wordCount,
                    imageCount: images.length,
                    hasVideo,
                    keywordFrequency
                };
            } catch (iframeError) {
                console.warn('Iframe scraping failed:', iframeError);
            }
        }

        // 일반 구조 (iframe 없음)
        const contentSelectors = [
            '#postViewArea', '.se-main-container', 'article', '.post-content', 'main'
        ];

        let contentElement = null;
        for (const selector of contentSelectors) {
            contentElement = doc.querySelector(selector);
            if (contentElement) break;
        }

        const textContent = contentElement?.textContent || doc.body.textContent || '';
        const wordCount = textContent.trim().replace(/\s+/g, '').length;
        const images = doc.querySelectorAll('img');
        const hasVideo = !!(
            doc.querySelector('video') ||
            doc.querySelector('iframe[src*="youtube"]') ||
            doc.querySelector('iframe[src*="vimeo"]') ||
            doc.querySelector('iframe[src*="naver.com/video"]')
        );
        const keywordFrequency = (textContent.match(new RegExp(keyword, 'gi')) || []).length;

        return {
            url,
            title: doc.title || '제목 없음',
            wordCount,
            imageCount: images.length,
            hasVideo,
            keywordFrequency
        };

    } catch (error) {
        console.error(`[analyzeBlogContent] Error for ${url}:`, error);
        throw error; // 상위에서 처리하도록 throw
    }
}

/**
 * 블로그 점수 계산 알고리즘
 * @param metrics 블로그 메트릭
 * @returns 0~100 점수
 */
export function calculateBlogScore(metrics: BlogMetrics): number {
    let score = 0;

    // 글자 수 (최대 30점)
    if (metrics.wordCount >= 2500) score += 30;
    else if (metrics.wordCount >= 1500) score += 20;
    else if (metrics.wordCount >= 1000) score += 10;

    // 이미지 개수 (최대 25점)
    if (metrics.imageCount >= 15) score += 25;
    else if (metrics.imageCount >= 10) score += 20;
    else if (metrics.imageCount >= 5) score += 15;
    else if (metrics.imageCount >= 3) score += 10;

    // 영상 유무 (최대 20점)
    if (metrics.hasVideo) score += 20;

    // 키워드 빈도 (최대 25점)
    if (metrics.keywordFrequency >= 5) score += 25;
    else if (metrics.keywordFrequency >= 3) score += 15;
    else if (metrics.keywordFrequency >= 1) score += 5;

    return Math.min(score, 100);
}

/**
 * 경쟁사 분석 실행 (메인 함수)
 * @param keyword 검색 키워드
 * @param myContent 내 콘텐츠 메트릭
 * @returns 분석 결과
 */
export async function analyzeCompetitors(
    keyword: string,
    myContent: { wordCount: number; imageCount: number; hasVideo: boolean; keywordFrequency: number }
): Promise<CompetitorAnalysisResult> {
    try {
        // 1. Naver VIEW 검색
        const topResults = await searchNaverView(keyword);

        if (topResults.length === 0) {
            throw new Error('검색 결과가 없습니다.');
        }

        // 2. 각 블로그 분석 (순차적으로, delay 포함)
        const topBlogs: BlogMetrics[] = [];
        let successCount = 0;

        for (const result of topResults) {
            try {
                const metrics = await analyzeBlogContent(result.url, keyword);
                topBlogs.push(metrics);
                successCount++;
            } catch (e) {
                console.error(`Failed to analyze ${result.url}`, e);
                // 실패해도 계속 진행
            }
        }

        if (successCount === 0) {
            throw new Error('모든 상위 블로그 분석에 실패했습니다. 네트워크 상태를 확인해주세요.');
        }

        // 3. 상위권 평균 계산
        const topAverage = {
            wordCount: Math.round(topBlogs.reduce((sum, b) => sum + b.wordCount, 0) / topBlogs.length),
            imageCount: Math.round(topBlogs.reduce((sum, b) => sum + b.imageCount, 0) / topBlogs.length),
            hasVideo: topBlogs.filter(b => b.hasVideo).length >= 2, // 2개 이상이면 true
            keywordFrequency: Math.round(topBlogs.reduce((sum, b) => sum + b.keywordFrequency, 0) / topBlogs.length),
            score: Math.round(topBlogs.reduce((sum, b) => sum + calculateBlogScore(b), 0) / topBlogs.length)
        };

        // 4. 내 콘텐츠 점수 계산
        const myMetrics: BlogMetrics = {
            url: '',
            title: '내 콘텐츠',
            ...myContent
        };
        const myScore = calculateBlogScore(myMetrics);

        return {
            keyword,
            myContent: myMetrics,
            topBlogs,
            topAverage,
            myScore
        };
    } catch (error) {
        console.error('[analyzeCompetitors] Error:', error);
        throw error;
    }
}
