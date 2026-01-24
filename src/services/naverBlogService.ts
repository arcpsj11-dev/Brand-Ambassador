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
 * [HYBRID STRATEGY] RSS (Best) -> Search API (Backup) -> Mock (Final Fallback)
 */
export const naverBlogService = {
    async fetchBlogPosts(blogId: string): Promise<NaverBlogSearchResponse> {
        console.log(`[NaverBlogService] 🚀 Starting Hybrid Fetch for: ${blogId}`);

        // 1. Try RSS Strategy First (High Fidelity, no indexing delay)
        try {
            const rssResult = await this.fetchViaRSS(blogId);
            if (rssResult && rssResult.items.length > 0) {
                console.log(`[NaverBlogService] ✅ RSS Success with ${rssResult.items.length} items.`);
                return rssResult;
            }
        } catch (e) {
            console.warn(`[NaverBlogService] ⚠️ RSS Strategy failed:`, e);
        }

        // 2. Try Search API Strategy (Official Auth, highly reliable bypass for data center blocks)
        try {
            console.log(`[NaverBlogService] 🔄 RSS yielded no items. Falling back to Search API...`);
            const apiResult = await this.fetchViaSearchAPI(blogId);
            if (apiResult && apiResult.items.length > 0) {
                console.log(`[NaverBlogService] ✅ Search API Success with ${apiResult.items.length} items.`);
                return apiResult;
            }
        } catch (e) {
            console.warn(`[NaverBlogService] ⚠️ Search API Strategy failed:`, e);
        }

        // 3. Final Fallback: Mock Data
        console.warn(`[NaverBlogService] 🛑 All real data strategies failed. Using Mock data.`);
        return this.generateMockData(blogId);
    },

    /**
     * Strategy A: RSS Feed Fetching
     */
    async fetchViaRSS(blogId: string): Promise<NaverBlogSearchResponse | null> {
        const rssUrl = `/api/rss/${blogId}.xml?t=${Date.now()}`;
        const response = await fetch(rssUrl);

        if (!response.ok) throw new Error(`RSS HTTP Error: ${response.status}`);

        const xmlText = await response.text();
        if (!xmlText || xmlText.includes("<!DOCTYPE html")) throw new Error("Invalid RSS response (HTML/Empty)");

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // Case-insensitive search for <item>
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

            return {
                title: title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ''),
                link: link,
                description: description.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').substring(0, 200) + "...",
                postdate: postdate
            };
        });

        return { items: blogPosts, total: blogPosts.length, display: blogPosts.length, isMock: false };
    },

    /**
     * Strategy B: Naver Search API (Official Authorized Backup)
     */
    async fetchViaSearchAPI(blogId: string): Promise<NaverBlogSearchResponse | null> {
        const { naverClientId, naverClientSecret } = useAdminStore.getState();
        if (!naverClientId || !naverClientSecret) return null;

        // Search by Blog ID as query
        const searchQuery = `${blogId}`;
        const url = `/api/naver/v1/search/blog.json?query=${encodeURIComponent(searchQuery)}&display=20&sort=date`;

        const response = await fetch(url, {
            headers: {
                'X-Naver-Client-Id': naverClientId,
                'X-Naver-Client-Secret': naverClientSecret,
            }
        });

        if (!response.ok) return null;

        const data = await response.json();

        // Filter specifically for this blogger to avoid mixed results from other blogs mentioning the ID
        const filteredItems = (data.items || []).filter((item: any) => {
            const bloggerLink = item.bloggerlink || '';
            const postLink = item.link || '';
            const lowerId = blogId.toLowerCase();
            return bloggerLink.toLowerCase().includes(lowerId) || postLink.toLowerCase().includes(lowerId);
        });

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
     * Strategy C: Mock Data (Final Safety Net)
     */
    generateMockData(blogId: string): NaverBlogSearchResponse {
        const { subjects, clinicName = '원장님' } = (window as any).useProfileStore?.getState() || {};

        const baseTitles = [
            '📌 블로그 운영의 핵심은 꾸준함입니다',
            '🌿 건강한 생활 습관, 오늘부터 시작하세요',
            '💪 성장을 위한 데일리 루틴 가이드',
            '🔥 효과적인 전문 지식 전달 방법',
            '✨ 독자와 소통하는 글쓰기의 비결'
        ];

        const items: NaverBlogPost[] = baseTitles.map((title: string, index: number) => ({
            title,
            description: `안녕하세요, ${blogId} 블로그입니다. ${title}에 대해 자세히 알아보겠습니다. ${clinicName}만의 특별한 노하우와 진심을 담은 진료 철학을 소개합니다...`,
            postdate: this.getRecentDate(index),
            link: `https://blog.naver.com/${blogId}/${220000 + index}`
        }));

        return { items, total: items.length, display: items.length, isMock: true };
    },

    getRecentDate(daysAgo: number): string {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    },

    formatForAnalysis(response: NaverBlogSearchResponse): string {
        let context = `블로그 최근 게시물 정보:\n`;
        response.items.forEach((item, index) => {
            const formattedDate = `${item.postdate.slice(0, 4)}-${item.postdate.slice(4, 6)}-${item.postdate.slice(6, 8)}`;
            context += `${index + 1}. 제목: ${item.title}\n   요약: ${item.description}\n   날짜: ${formattedDate}\n\n`;
        });
        return context;
    }
};
