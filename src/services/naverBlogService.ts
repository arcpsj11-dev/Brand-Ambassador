import { useAdminStore } from '../store/useAdminStore';

export interface NaverBlogPost {
    title: string;
    description: string;
    postdate: string; // YYYYMMDD format
    link: string;
}

export interface NaverBlogSearchResponse {
    items: NaverBlogPost[];
    total: number;
    display: number;
    isMock?: boolean;
}

/**
 * Naver Blog Data Collection Service
 * Now with REAL API integration via Vite proxy!
 */
export const naverBlogService = {
    /**
     * Fetch recent blog posts for a given blog ID
     * Uses real Naver API when credentials are configured
     */
    async fetchBlogPosts(blogId: string): Promise<NaverBlogSearchResponse> {
        const { naverClientId, naverClientSecret } = useAdminStore.getState();

        // Check if credentials are configured
        if (!naverClientId || !naverClientSecret) {
            console.warn('[NaverBlogService] API credentials not configured. Using mock data.');
            return this.generateMockData(blogId);
        }

        // Call REAL Naver API via Vite proxy (local) or CORS Proxy (prod) to bypass CORS!
        const isProd = import.meta.env.PROD;
        const baseUrl = isProd
            ? 'https://cors-anywhere.herokuapp.com/https://openapi.naver.com/v1/search/blog.json'
            : '/api/naver/v1/search/blog.json';

        const url = `${baseUrl}?query=${encodeURIComponent(blogId)}&display=5&sort=date`;
        console.log(`[NaverBlogService] 🚀 Fetching REAL data. URL: ${url}`);
        console.log(`[NaverBlogService] Using Naver Client ID length: ${naverClientId?.length || 0}`);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Naver-Client-Id': naverClientId,
                    'X-Naver-Client-Secret': naverClientSecret,
                }
            });

            console.log(`[NaverBlogService] Response Status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[NaverBlogService] ❌ API Error:', response.status, errorText);

                // Show user-friendly alert for common errors
                if (response.status === 401) {
                    alert('네이버 API 인증 실패: Client ID/Secret을 확인해 주세요.');
                } else if (response.status === 429) {
                    alert('API 호출 한도 초과: 잠시 후 다시 시도해 주세요.');
                }

                throw new Error(`Naver API Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('[NaverBlogService] ✅ Successfully fetched API data:', data.items?.length, 'items');

            // 🎯 CRITICAL: Filter by bloggerlink to ensure it's the CORRECT blog
            // Naver Search API returns any post matching the query, so we must filter.
            const filteredItems = (data.items || []).filter((item: any) => {
                const bloggerLink = item.bloggerlink || '';
                return bloggerLink.includes(blogId);
            });

            console.log(`[NaverBlogService] 🎯 Filtered items for ${blogId}:`, filteredItems.length);

            // If no items found for THIS blog, fall back to mock or return empty (but mock is better for the motivation system UX)
            if (filteredItems.length === 0) {
                console.warn(`[NaverBlogService] No posts found SPECIFICALLY for ${blogId}. Using mock data to avoid empty UI.`);
                return this.generateMockData(blogId);
            }

            // Clean HTML tags from titles and descriptions
            const cleanedItems = filteredItems.map((item: any) => ({
                ...item,
                title: item.title.replace(/<[^>]*>/g, ''),
                description: item.description.replace(/<[^>]*>/g, '')
            }));

            return {
                items: cleanedItems,
                total: cleanedItems.length,
                display: cleanedItems.length,
                isMock: false
            };
        } catch (error) {
            console.error('[NaverBlogService] API call failed:', error);
            return this.generateMockData(blogId);
        }
    },

    /**
     * Generate realistic mock data for UI testing
     */
    generateMockData(blogId: string): NaverBlogSearchResponse {
        const { subjects, clinicName } = (window as any).useProfileStore?.getState() || {};

        const baseTitles = subjects && subjects.length > 0
            ? subjects.slice(0, 5).map((s: string) => `🌿 ${s} 치료, ${clinicName || '저희 병원'}에서 도와드립니다`)
            : [
                '📌 블로그 운영의 핵심은 꾸준함입니다',
                '🌿 건강한 생활 습관, 오늘부터 시작하세요',
                '💪 성장을 위한 데일리 루틴 가이드',
                '🔥 효과적인 전문 지식 전달 방법',
                '✨ 독자와 소통하는 글쓰기의 비결'
            ];

        const items: NaverBlogPost[] = baseTitles.map((title: string, index: number) => ({
            title,
            description: `안녕하세요, ${blogId} 블로그입니다. ${title}에 대해 자세히 알아보겠습니다. ${clinicName || '저희'}만의 특별한 노하우와 진심을 담은 진료 철학을 소개합니다...`,
            postdate: this.getRecentDate(index),
            link: `https://blog.naver.com/${blogId}/${220000 + index}`
        }));

        return {
            items,
            total: items.length,
            display: items.length,
            isMock: true
        };
    },

    /**
     * Helper: Generate recent dates (YYYYMMDD format)
     */
    getRecentDate(daysAgo: number): string {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    },

    /**
     * Format blog data for Gemini analysis
     */
    formatForAnalysis(response: NaverBlogSearchResponse): string {
        let context = `블로그 최근 게시물 정보:\n`;

        response.items.forEach((item, index) => {
            const formattedDate = `${item.postdate.slice(0, 4)}-${item.postdate.slice(4, 6)}-${item.postdate.slice(6, 8)}`;
            context += `${index + 1}. 제목: ${item.title}\n`;
            context += `   요약: ${item.description}\n`;
            context += `   날짜: ${formattedDate}\n\n`;
        });

        return context;
    }
};
