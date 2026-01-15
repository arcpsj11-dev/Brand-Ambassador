export interface MediaAssets {
    images: string[];
}

export async function generateMediaForContent(
    title: string,
    _bodyExcerpt: string,
    options: { count: number } = { count: 5 }
): Promise<MediaAssets> {
    try {
        const images = await Promise.all(
            Array(options.count).fill(null).map((_, idx) =>
                generateNanoBananaImage(title, idx)
            )
        );
        return { images };
    } catch (error) {
        console.error("[MediaGen] failure", error);
        return { images: [] };
    }
}

/**
 * 나노 바나나 이미지 생성 V4 Core (wsrv.nl 프록시 + pollinations.ai 조합)
 * @param prompt 영문 프롬프트
 * @param index 이미지 순번 (시드 결정용)
 * @param model 모델명 (flux, turbo 등)
 */
export async function generateNanoBananaImage(prompt: string, index: number = 0, model: 'flux' | 'turbo' = 'flux'): Promise<string> {
    const seed = Date.now() + index;
    // wsrv.nl 프록시를 통해 Pollinations AI 이미지에 접근 (CORS 및 방화벽 우회)
    // model 파라미터 추가
    const baseUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=1024&height=1792&model=${model}&nologo=true`;
    return `https://wsrv.nl/?url=${encodeURIComponent(baseUrl)}&default=https://placehold.co/1024x1792/1a1a1a/666666?text=RETRYING+ENGINE`;
}

/**
 * 이미지 4장을 기판으로 하여 15초 분량의 슬라이드쇼 MP4(또는 WebM) 생성
 * requestAnimationFrame 대신 타이머 기반으로 더 안정적인 프레임 생성을 보장함
 */
export async function createSlideVideo(images: string[]): Promise<Blob> {
    console.log("[VideoGen] Starting process with images:", images.length);

    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 1280;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return reject("Canvas context failed");

        const stream = canvas.captureStream(25); // 25 FPS
        const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
        console.log("[VideoGen] Using MimeType:", mimeType);

        const recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 2500000 // 2.5 Mbps
        });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
            console.log("[VideoGen] Recording stopped, chunks:", chunks.length);
            resolve(new Blob(chunks, { type: mimeType }));
        };
        recorder.onerror = (e) => {
            console.error("[VideoGen] Recorder Error:", e);
            reject(e);
        };

        const loadImage = (url: string): Promise<HTMLImageElement> => new Promise((res, rej) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => res(img);
            img.onerror = (e) => {
                console.error("[VideoGen] Image Load Failed:", url);
                rej(e);
            };
            img.src = url;
        });

        const run = async () => {
            try {
                const targets = images.slice(0, 4);
                console.log("[VideoGen] Loading images...");
                const loadedImages = await Promise.all(targets.map(loadImage));
                console.log("[VideoGen] All images loaded. Starting recorder...");

                recorder.start();

                const fps = 25;
                const durationPerImage = 4; // 4초씩 (총 16초)
                const framesPerImage = fps * durationPerImage;
                const totalFrames = loadedImages.length * framesPerImage;

                let currentFrame = 0;
                console.log("[VideoGen] Rendering frames:", totalFrames);

                // 타이머 기반으로 프레임을 강제로 그림
                const interval = setInterval(() => {
                    if (currentFrame >= totalFrames) {
                        clearInterval(interval);
                        console.log("[VideoGen] Frame rendering complete. Waiting for buffer...");
                        // 데이터가 완벽히 기록되도록 2초 더 대기 후 종료 (7초 이슈 방지)
                        setTimeout(() => {
                            recorder.stop();
                        }, 2000);
                        return;
                    }

                    const imgIndex = Math.floor(currentFrame / framesPerImage);
                    const img = loadedImages[imgIndex];

                    // Draw
                    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                    const w = img.width * scale;
                    const h = img.height * scale;
                    const x = (canvas.width - w) / 2;
                    const y = (canvas.height - h) / 2;

                    ctx.fillStyle = "black";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, x, y, w, h);

                    // Overlay 텍스트
                    ctx.fillStyle = "rgba(0,0,0,0.6)";
                    ctx.fillRect(0, canvas.height - 180, canvas.width, 120);
                    ctx.fillStyle = "white";
                    ctx.font = "bold 44px sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText("NANO BANANA AI", canvas.width / 2, canvas.height - 105);

                    currentFrame++;
                }, 1000 / fps);

            } catch (err) {
                console.error("[VideoGen] Run Error:", err);
                reject(err);
            }
        };

        run();
    });
}

export async function createCollage(_images: string[]): Promise<string> { return ""; }
