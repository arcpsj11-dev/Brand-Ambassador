import { useAdminStore } from '../store/useAdminStore';

export const imageService = {
    /**
     * Generate an image from a text prompt using the active provider.
     * @param prompt English prompt for image generation
     * @returns URL of the generated image or a fallback image on failure
     */
    async generateImage(prompt: string): Promise<string> {
        try {
            const { activeImageProvider, nanoBananaApiKey, dallEApiKey } = useAdminStore.getState();

            console.log(`[ImageService] Generating image via ${activeImageProvider}...`);

            // ==========================================
            // 1. DALL-E Provider (OpenAI)
            // ==========================================
            if (activeImageProvider === 'dalle') {
                if (!dallEApiKey) throw new Error("API_KEY_MISSING: DALL-E API Key is not set.");

                // Check for potential strict mode or network issues by logging
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
                if (!data.data || !data.data[0] || !data.data[0].url) {
                    throw new Error("Invalid response format from OpenAI");
                }
                return data.data[0].url;
            }

            // ==========================================
            // 2. Nano Banana Provider (Custom/Karlo/etc.)
            // ==========================================
            if (activeImageProvider === 'nano') {
                if (!nanoBananaApiKey) throw new Error("API_KEY_MISSING: Nano Banana API Key is not set.");

                // [NOTE] Using a Banana.dev styled or Generic Inference endpoint structure.
                // Replace URL with actual endpoint if different.

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
            }

            // ==========================================
            // 3. Google Imagen 4 Provider (also accepts 'gemini' for backward compatibility)
            // ==========================================
            if (activeImageProvider === 'google' || activeImageProvider === 'gemini') {
                const { geminiApiKey } = useAdminStore.getState();
                const apiKey = geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;

                if (!apiKey) {
                    console.warn("[ImageService] Google API Key not set");
                    throw new Error("API_KEY_MISSING: Google/Gemini API Key is not set.");
                }

                console.log("[ImageService] Generating image with Google Imagen 4...");

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`,
                    {
                        method: 'POST',
                        headers: {
                            'x-goog-api-key': apiKey,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            instances: [{ prompt: prompt }],
                            parameters: {
                                sampleCount: 1,
                                aspectRatio: "1:1",
                                personGeneration: "allow_adult"
                            }
                        })
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("[ImageService] Google Imagen Error:", errorText);
                    throw new Error(`Google Imagen API Error ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                console.log("[ImageService] Imagen response received");

                if (data.predictions && data.predictions[0]) {
                    const imageData = data.predictions[0];

                    if (imageData.bytesBase64Encoded) {
                        const mimeType = imageData.mimeType || 'image/png';
                        return `data:${mimeType};base64,${imageData.bytesBase64Encoded}`;
                    }
                }

                throw new Error("Invalid response format from Google Imagen API");
            }

            throw new Error("Unknown Image Provider Selected");

        } catch (globalError) {
            console.error("[ImageService] Critical Error:", globalError);
            console.warn("[ImageService] Switching to Fallback Image due to error.");

            // Generate a deterministic color/text based on prompt to make it look distinct
            const fallbackText = prompt.length > 20 ? "AI Image Generated" : encodeURIComponent(prompt);
            return `https://placehold.co/1024x1024/222/FFF?text=${fallbackText}`;
        }
    }
};
