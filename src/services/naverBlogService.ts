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
 * [ULTIMATE HYBRID] RSS (via AllOrigins) -> Search API (Official) -> Mock
 */
export const naverBlogService = {
    async fetchBlogPosts(blogId: string): Promise<NaverBlogSearchResponse> {
        console.log(`[NaverBlogService] 🚀 Starting Ultimate Hybrid Fetch for: ${blogId}`);

        // 1. Try RSS Strategy (High Accuracy)
        // [UPGRADE] Use AllOrigins 'raw' to avoid proxy redirect/CORS issues
        try {
            const rssResult = await this.fetchViaRSS(blogId);
            if (rssResult && rssResult.items.length > 0) {
                console.log(`[NaverBlogService] ✅ RSS Success (${rssResult.items.length} items)`);
                return rssResult;
            }
        } catch (e) {
            console.warn(`[NaverBlogService] ⚠️ RSS Strategy failed or returned 0 items.`, e);
        }

        // 2. Try Search API Strategy (Official Auth)
        try {
            console.log(`[NaverBlogService] 🔄 Falling back to official Search API...`);
            const apiResult = await this.fetchViaSearchAPI(blogId);
            if (apiResult && apiResult.items.length > 0) {
                console.log(`[NaverBlogService] ✅ Search API Success (${apiResult.items.length} items)`);
                return apiResult;
            }
        } catch (e) {
            console.warn(`[NaverBlogService] ⚠️ Search API Strategy failed.`, e);
        }

        // 3. Last Resort: Mock Data
        console.warn(`[NaverBlogService] 🛑 All real data attempts failed. Providing realistic Mock data.`);
        return this.generateMockData(blogId);
    },

    /**
     * Strategy A: RSS via AllOrigins (Proven to bypass CORS)
     */
    async fetchViaRSS(blogId: string): Promise<NaverBlogSearchResponse | null> {
        const rssTarget = `https://rss.blog.naver.com/${blogId}.xml?t=${Date.now()}`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssTarget)}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const xmlText = await response.text();
        if (!xmlText || xmlText.includes("<!DOCTYPE html")) return null;

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // Find items case-insensitively
        const allElements = xmlDoc.querySelectorAll("*");
        const items = Array.from(allElements).filter(el =>
            el.nodeName.toLowerCase() === 'item' || el.localName?.toLowerCase() === 'item'
        );

        if (items.length === 0) return null;

        const blogPosts = items.slice(0, 5).map(item => {
            const title = item.querySelector("title")?.textContent || "";
            const link = item.querySelector("link")?.textContent || "";
            const description = item.querySelector("description")?.textContent || "";
            const dateRaw = item.querySelector("pubDate")?.textContent || "";

            let postdate = "";
            try {
                const dateObj = new Date(dateRaw);
                const yyyy = dateObj.getFullYear();
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getDate()).padStart(2, '0');
                postdate = `${yyyy}${mm}${dd}`;
            } catch (e) {
                postdate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            }

            const cleanText = (text: string) => text.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '');

            return {
                title: cleanText(title),
                link: link,
                description: cleanText(description).substring(0, 200) + "...",
                postdate: postdate
            };
        });

        return { items: blogPosts, total: blogPosts.length, display: blogPosts.length, isMock: false };
    },

    /**
     * Strategy B: Official Naver Search API (Authorized)
     */
    async fetchViaSearchAPI(blogId: string): Promise<NaverBlogSearchResponse | null> {
        const { naverClientId, naverClientSecret } = useAdminStore.getState();
        if (!naverClientId || !naverClientSecret) return null;

        // Try searching for the blog URL specifically
        const searchQuery = `blog.naver.com/${blogId}`;
        const url = `/api/naver/v1/search/blog.json?query=${encodeURIComponent(searchQuery)}&display=20&sort=date`;

        const response = await fetch(url, {
            headers: {
                'X-Naver-Client-Id': naverClientId,
                'X-Naver-Client-Secret': naverClientSecret,
            }
        });

        if (!response.ok) return null;
        const data = await response.json();

        // Ensure items belong to this blogger
        const lowerId = blogId.toLowerCase();
        const filteredItems = (data.items || []).filter((item: any) =>
            (item.bloggerlink || '').toLowerCase().includes(lowerId) ||
            (item.link || '').toLowerCase().includes(lowerId)
        );

        if (filteredItems.length === 0) return null;

        const blogPosts = filteredItems.slice(0, 5).map((item: any) => ({
            title: item.title.replace(/<[^>]*>/g, ''),
            description: item.description.replace(/<[^>]*>/g, ''),
            postdate: item.postdate,
            link: item.link
        }));

        return { items: blogPosts, total: blogPosts.length, display: blogPosts.length, isMock: false };
    },

    /**
     * Strategy C: Mock Data
     */
    generateMockData(blogId: string): NaverBlogSearchResponse {
        const { clinicName = '저희' } = (window as any).useProfileStore?.getState() || {};
        const baseTitles = [
            '📌 블로그 운영의 핵심은 꾸준함입니다',
            '🌿 건강한 생활 습관, 오늘부터 시작하세요',
            '💪 성장을 위한 데일리 루틴 가이드',
            '🔥 효과적인 전문 지식 전달 방법',
            '✨ 독자와 소통하는 글쓰기의 비결'
        ];

        const items: NaverBlogPost[] = baseTitles.map((title: string, index: number) => ({
            title,
            description: `안녕하세요, ${blogId} 블로그입니다. ${title}에 대해 자세히 알아보겠습니다. ${clinicName}만의 특별한 철학을 소개합니다...`,
            postdate: this.getRecentDate(index),
            link: `https://blog.naver.com/${blogId}/${220000 + index}`
        }));

        return { items, total: items.length, display: items.length, isMock: true };
    },

    getRecentDate(daysAgo: number): string {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}${m}${d}`;
    },

    formatForAnalysis(response: NaverBlogSearchResponse): string {
        let context = `블로그 최근 게시물 정보:\n`;
        response.items.forEach((item, index) => {
            const fd = `${item.postdate.slice(0, 4)}-${item.postdate.slice(4, 6)}-${item.postdate.slice(6, 8)}`;
            context += `${index + 1}. 제목: ${item.title}\n   요약: ${item.description}\n   날짜: ${fd}\n\n`;
        });
        return context;
    }
};
