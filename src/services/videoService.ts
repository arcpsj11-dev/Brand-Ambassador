/**
 * Video Service
 * Handles client-side Image-to-Video conversion using Canvas and MediaRecorder.
 */
export const videoService = {
    /**
     * Converts an image URL to a 3-second MP4/WEBM video with a subtle zoom effect.
     * @param imageUrl The URL of the image (can be data URL or remote URL)
     * @param duration Duration in milliseconds (default: 3000ms)
     * @returns Promise resolving to a Blob
     */
    async generateVideoFromImage(imageUrl: string, duration: number = 3000): Promise<{ blob: Blob, extension: string }> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context not available'));

            // Set canvas size (1024x1024 standard for blog images)
            canvas.width = 1024;
            canvas.height = 1024;

            const img = new Image();
            img.crossOrigin = 'anonymous'; // Critical for remote URLs

            img.onload = () => {
                const stream = canvas.captureStream(30); // 30 FPS

                // Chrome supports video/webm;codecs=vp9 or video/mp4
                let mimeType = 'video/mp4';
                let extension = 'mp4';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'video/webm;codecs=vp9';
                    extension = 'webm';
                }

                // Fallback if vp9 not supported
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'video/webm';
                    extension = 'webm';
                }

                console.log(`[VideoService] Recording using ${mimeType}`);

                const recorder = new MediaRecorder(stream, {
                    mimeType,
                    videoBitsPerSecond: 5000000 // 5Mbps for high quality
                });

                const chunks: Blob[] = [];
                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data);
                };

                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: mimeType });
                    resolve({ blob, extension });
                };

                recorder.onerror = (e) => {
                    console.error("[VideoService] Recorder Error:", e);
                    reject(e);
                };

                // Animation parameters
                const startTime = performance.now();

                recorder.start();

                const animate = (time: number) => {
                    const elapsed = time - startTime;
                    if (elapsed >= duration) {
                        recorder.stop();
                        return;
                    }

                    // Progress 0.0 to 1.0
                    const progress = elapsed / duration;

                    // Subtle zoom effect (1.0 to 1.1)
                    const scale = 1.0 + (progress * 0.1);

                    // Clear canvas
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Draw image centered with scale
                    const w = canvas.width * scale;
                    const h = canvas.height * scale;
                    const x = (canvas.width - w) / 2;
                    const y = (canvas.height - h) / 2;

                    try {
                        ctx.drawImage(img, x, y, w, h);
                    } catch (err) {
                        console.error("[VideoService] Draw Error (Tainted?):", err);
                        recorder.stop();
                        reject(err);
                        return;
                    }

                    requestAnimationFrame(animate);
                };

                requestAnimationFrame(animate);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image for video generation'));
            };

            img.src = imageUrl;
        });
    },

    /**
     * Converts multiple image URLs into a single slideshow video.
     * @param imageUrls Array of image URLs
     * @param slideDuration Duration per slide in milliseconds (default: 4000ms)
     * @returns Promise resolving to { blob, extension }
     */
    async generateSlideshowVideo(imageUrls: string[], slideDuration: number = 4000): Promise<{ blob: Blob, extension: string }> {
        return new Promise((resolve, reject) => {
            if (imageUrls.length === 0) return reject(new Error('No images provided'));

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context not available'));

            canvas.width = 1024;
            canvas.height = 1024;

            const totalDuration = imageUrls.length * slideDuration;
            const stream = canvas.captureStream(30);

            let mimeType = 'video/mp4';
            let extension = 'mp4';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm;codecs=vp9';
                extension = 'webm';
            }
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm';
                extension = 'webm';
            }

            console.log(`[VideoService] Slideshow recording using ${mimeType}`);

            const recorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: 5000000
            });

            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                resolve({ blob, extension });
            };

            recorder.onerror = (e) => {
                console.error("[VideoService] Slideshow Recorder Error:", e);
                reject(e);
            };

            const images: HTMLImageElement[] = [];
            let loadedCount = 0;
            let hasError = false;

            const startRecording = () => {
                const startTime = performance.now();

                try {
                    recorder.start();
                } catch (err) {
                    reject(err);
                    return;
                }

                const animate = (time: number) => {
                    const elapsed = time - startTime;
                    if (elapsed >= totalDuration) {
                        recorder.stop();
                        return;
                    }

                    const currentImageIndex = Math.floor(elapsed / slideDuration);
                    const img = images[currentImageIndex];
                    if (!img) {
                        recorder.stop();
                        return;
                    }

                    // Progress within the current slide (0.0 to 1.0)
                    const slideElapsed = elapsed % slideDuration;
                    const progress = slideElapsed / slideDuration;

                    // Subtle zoom effect (1.0 to 1.1)
                    const scale = 1.0 + (progress * 0.1);

                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    const w = canvas.width * scale;
                    const h = canvas.height * scale;
                    const x = (canvas.width - w) / 2;
                    const y = (canvas.height - h) / 2;

                    try {
                        ctx.drawImage(img, x, y, w, h);
                    } catch (err) {
                        console.error("[VideoService] Draw Error:", err);
                    }

                    requestAnimationFrame(animate);
                };

                requestAnimationFrame(animate);
            };

            imageUrls.forEach((url, index) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    if (hasError) return;
                    images[index] = img;
                    loadedCount++;
                    if (loadedCount === imageUrls.length) {
                        startRecording();
                    }
                };
                img.onerror = () => {
                    hasError = true;
                    reject(new Error(`Failed to load image at index ${index}`));
                };
                img.src = url;
            });
        });
    },

    /**
     * Helper to trigger a download of a Blob
     */
    downloadBlob(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    },

    /**
     * Converts an image to WebP and downloads it
     */
    async downloadImageAsWebP(imageUrl: string, filename: string) {
        return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context failed'));
                    return;
                }
                ctx.drawImage(img, 0, 0);

                // Convert to WebP
                canvas.toBlob((blob) => {
                    if (blob) {
                        this.downloadBlob(blob, filename.replace(/\.(png|jpg|jpeg)$/i, '') + '.webp');
                        resolve();
                    } else {
                        reject(new Error('WebP conversion failed'));
                    }
                }, 'image/webp', 0.9);
            };
            img.onerror = () => reject(new Error('Image failed to load for conversion'));
            img.src = imageUrl;
        });
    }
};
