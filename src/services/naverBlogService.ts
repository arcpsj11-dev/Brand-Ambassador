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
 * [UPGRADE] Switched to RSS Feed for 100% accuracy on recent posts.
 */
export const naverBlogService = {
    /**
     * Fetch recent blog posts via RSS Feed
     * RSS Feed URL: https://rss.blog.naver.com/{blogId}.xml
     */
    // [RSS STRATEGY] Switch to RSS Feed for 100% accuracy on recent posts
    // RSS URL: https://rss.blog.naver.com/{blogId}.xml
    const rssUrl = `https://rss.blog.naver.com/${blogId}.xml`;
    console.log(`[NaverBlogService] 🚀 Fetching RSS data from: ${rssUrl}`);

    try {
        // Use allorigins.win to bypass CORS (Returning JSON with stringified XML)
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
        const response = await fetch(proxyUrl);

        if(!response.ok) {
            console.error('[NaverBlogService] ❌ RSS Error:', response.status);
throw new Error(`RSS Error: ${response.status}`);
            }

const data = await response.json();
const xmlText = data.contents; // allorigins returns content in 'contents' field

if (!xmlText) throw new Error("Empty response from Proxy");

const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlText, "text/xml");

const items = Array.from(xmlDoc.querySelectorAll("item"));
console.log('[NaverBlogService] ✅ RSS Fetched. Items found:', items.length);

if (items.length === 0) {
    console.warn(`[NaverBlogService] RSS returned 0 items. ID might be wrong or blog is empty.`);
    return this.generateMockData(blogId);
}

const blogPosts = items.slice(0, 5).map(item => {
    const title = item.querySelector("title")?.textContent || "";
    const link = item.querySelector("link")?.textContent || "";
    const description = item.querySelector("description")?.textContent || "";
    const dateRaw = item.querySelector("pubDate")?.textContent || "";

    // Convert PubDate (Fri, 24 Jan 2025...) to YYYYMMDD
    let postdate = "";
    try {
        const dateObj = new Date(dateRaw);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        postdate = `${yyyy}${mm}${dd}`;
    } catch (e) {
        postdate = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // Fallback to today
    }

    // Clean CDATA and HTML tags
    const cleanTitle = title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '');
    const cleanDesc = description.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '');

    return {
        title: cleanTitle,
        link: link,
        description: cleanDesc.substring(0, 200) + "...", // Truncate summary for display
        postdate: postdate
    };
});

return {
    items: blogPosts,
    total: blogPosts.length,
    display: blogPosts.length,
    isMock: false
};
        } catch (error) {
    console.warn('[NaverBlogService] RSS call failed, falling back to mock:', error);
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
