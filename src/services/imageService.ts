import { useAdminStore } from '../store/useAdminStore';

export const imageService = {
    /**
     * Generate an image from a text prompt using the active provider.
     * @param prompt English prompt for image generation
     * @returns URL of the generated image
     */
    async generateImage(prompt: string): Promise<string> {
        const { activeImageProvider, nanoBananaApiKey, dallEApiKey } = useAdminStore.getState();

        console.log(`[ImageService] Generating image via ${activeImageProvider}...`);

        // ==========================================
        // 1. DALL-E Provider (OpenAI)
        // ==========================================
        if (activeImageProvider === 'dalle') {
            if (!dallEApiKey) throw new Error("API_KEY_MISSING: DALL-E API Key is not set.");

            try {
                const response = await fetch('https://api.openai.com/v1/images/generations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${dallEApiKey}`
                    },
                    body: JSON.stringify({
                        model: "dall-e-3", // Using DALL-E 3 for quality
                        prompt: prompt,
                        n: 1,
                        size: "1024x1024",
                        response_format: "url"
                    })
                });

                if (!response.ok) {
                    const err = await response.text();
                    throw new Error(`OpenAI API Error ${response.status}: ${err}`);
                }

                const data = await response.json();
                return data.data[0].url;
            } catch (error) {
                console.error("[ImageService] DALL-E Error:", error);
                throw error;
            }
        }

        // ==========================================
        // 2. Nano Banana Provider (Custom/Karlo/etc.)
        // ==========================================
        if (activeImageProvider === 'nano') {
            if (!nanoBananaApiKey) throw new Error("API_KEY_MISSING: Nano Banana API Key is not set.");

            try {
                // [NOTE] Using a Banana.dev styled or Generic Inference endpoint structure.
                // Replace URL with actual endpoint if different.

                // For now, if user hasn't provided details, we can't guess.
                // But since they reported "Load failed" on the PREVIOUS try (which hit api.banana.dev),
                // it means they tried to use it.

                // I will alert that specific configuration is needed OR use a safe mock if in dev.
                // But better to throw a clear error than a network error.

                // MOCK Implementation for immediate feedback if they just want to see it "work" without a real backend:
                // return `https://placehold.co/1024x1024?text=${encodeURIComponent(prompt.substring(0, 20))}`;

                // REAL CALL (Commented out until URL confirmed):
                /*
                const response = await fetch('https://MY_NANO_BANANA_ENDPOINT', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${nanoBananaApiKey}` },
                    body: JSON.stringify({ prompt })
                });
                */

                throw new Error("Nano Banana Endpoint URL is not configured. Please contact support or use DALL-E.");

            } catch (error) {
                console.error("[ImageService] Nano Banana Error:", error);
                throw error;
            }
        }

        throw new Error("Unknown Image Provider Selected");
    }
};
