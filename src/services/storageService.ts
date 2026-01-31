import { supabase } from '../lib/supabaseClient';

export const storageService = {
    /**
     * Uploads an image file to Supabase Storage after converting it to WebP.
     * @param file The original image file
     * @param userId The user ID (used for folder organization)
     * @param category The photo category (e.g., 'entrance', 'desk')
     * @returns Promise resolving to the public URL of the uploaded image
     */
    async uploadImage(file: File, userId: string, category: string): Promise<string> {
        try {
            // 1. Convert to WebP
            const webpBlob = await this.convertToWebP(file);

            // 2. Generate path: {userId}/{category}_{uuid}.webp
            const fileName = `${category}_${crypto.randomUUID()}.webp`;
            const filePath = `${userId}/${fileName}`;

            // 3. Upload to Supabase 'clinic_photos' bucket
            const { error: uploadError } = await supabase.storage
                .from('clinic_photos')
                .upload(filePath, webpBlob, {
                    contentType: 'image/webp',
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Supabase Upload Error:', uploadError);
                throw new Error('이미지 업로드에 실패했습니다.');
            }

            // 4. Get Public URL
            const { data } = supabase.storage
                .from('clinic_photos')
                .getPublicUrl(filePath);

            return data.publicUrl;

        } catch (error) {
            console.error('[StorageService] Upload failed:', error);
            throw error;
        }
    },

    /**
     * Converts a File object to a WebP Blob using Canvas.
     */
    async convertToWebP(file: File): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Resize if too large (optional, but good for optimization. let's keep original size for now or cap at 1920)
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 1920;

                if (width > MAX_SIZE || height > MAX_SIZE) {
                    if (width > height) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    } else {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context unavailable'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('WebP conversion failed'));
                    }
                }, 'image/webp', 0.8); // 80% quality
            };

            img.onerror = () => reject(new Error('Failed to load image for conversion'));

            // Create object URL for the file to load into Image
            img.src = URL.createObjectURL(file);
        });
    }
};
