// OPG 템플릿 인터페이스
export interface OPGTemplate {
    id: string;
    name: string;
    size: 'A4' | 'A5' | 'Poster';
    htmlTemplate: string;
    cssStyles: string;
}

// 기본 A4 세로형 템플릿
export const DEFAULT_TEMPLATES: OPGTemplate[] = [
    {
        id: 'basic-a4',
        name: '기본 A4 세로',
        size: 'A4',
        htmlTemplate: `
            <div class="opg-container">
                <header class="opg-header">
                    <h1 class="opg-title">{{TITLE}}</h1>
                    <div class="opg-clinic-name">{{CLINIC_NAME}}</div>
                </header>
                
                <div class="opg-content">
                    {{CONTENT}}
                </div>
                
                <div class="opg-image">
                    {{IMAGE}}
                </div>
                
                <footer class="opg-footer">
                    <div class="opg-contact">
                        <div class="opg-address">📍 {{ADDRESS}}</div>
                        <div class="opg-phone">📞 {{PHONE}}</div>
                    </div>
                    <div class="opg-qr">
                        <!-- QR 코드 영역 -->
                    </div>
                </footer>
            </div>
        `,
        cssStyles: `
            @page {
                size: A4 portrait;
                margin: 0;
            }
            
            .opg-container {
                width: 210mm;
                height: 297mm;
                padding: 20mm;
                background: white;
                color: #1a1a1a;
                font-family: 'Pretendard', -apple-system, sans-serif;
                box-sizing: border-box;
                position: relative;
            }
            
            .opg-header {
                margin-bottom: 15mm;
                border-bottom: 2px solid #00e0ff;
                padding-bottom: 5mm;
            }
            
            .opg-title {
                font-size: 24pt;
                font-weight: 900;
                color: #1a1a1a;
                margin: 0 0 3mm 0;
                line-height: 1.3;
            }
            
            .opg-clinic-name {
                font-size: 16pt;
                font-weight: 700;
                color: #00e0ff;
                margin: 0;
            }
            
            .opg-content {
                font-size: 11pt;
                line-height: 1.8;
                color: #333;
                margin-bottom: 10mm;
                max-height: 150mm;
                overflow: hidden;
            }
            
            .opg-content p {
                margin: 0 0 3mm 0;
            }
            
            .opg-image {
                width: 100%;
                height: 60mm;
                background: #f5f5f5;
                border-radius: 4mm;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 10mm;
                overflow: hidden;
            }
            
            .opg-image img {
                max-width: 100%;
                max-height: 100%;
                object-fit: cover;
            }
            
            .opg-footer {
                position: absolute;
                bottom: 20mm;
                left: 20mm;
                right: 20mm;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                padding-top: 5mm;
                border-top: 1px solid #e5e5e5;
            }
            
            .opg-contact {
                font-size: 10pt;
                line-height: 1.6;
                color: #666;
            }
            
            .opg-address,
            .opg-phone {
                margin: 1mm 0;
                font-weight: 600;
            }
            
            .opg-qr {
                width: 25mm;
                height: 25mm;
                background: #f5f5f5;
                border-radius: 2mm;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8pt;
                color: #999;
            }
        `,
    },
    {
        id: 'simple-a4',
        name: '심플 A4',
        size: 'A4',
        htmlTemplate: `
            <div class="opg-simple">
                <div class="opg-simple-logo">{{CLINIC_NAME}}</div>
                <h1 class="opg-simple-title">{{TITLE}}</h1>
                <div class="opg-simple-content">{{CONTENT}}</div>
                <div class="opg-simple-footer">
                    <span>{{ADDRESS}}</span>
                    <span>{{PHONE}}</span>
                </div>
            </div>
        `,
        cssStyles: `
            @page {
                size: A4 portrait;
                margin: 0;
            }
            
            .opg-simple {
                width: 210mm;
                height: 297mm;
                padding: 25mm;
                background: white;
                font-family: 'Pretendard', -apple-system, sans-serif;
            }
            
            .opg-simple-logo {
                font-size: 14pt;
                font-weight: 700;
                color: #00e0ff;
                margin-bottom: 10mm;
            }
            
            .opg-simple-title {
                font-size: 28pt;
                font-weight: 900;
                margin: 0 0 15mm 0;
                line-height: 1.2;
            }
            
            .opg-simple-content {
                font-size: 12pt;
                line-height: 2;
                color: #333;
                margin-bottom: 20mm;
            }
            
            .opg-simple-footer {
                position: absolute;
                bottom: 25mm;
                left: 25mm;
                right: 25mm;
                text-align: center;
                font-size: 10pt;
                color: #666;
                display: flex;
                justify-content: space-around;
                padding-top: 5mm;
                border-top: 2px solid #00e0ff;
            }
        `,
    },
];

/**
 * 템플릿 변수 치환
 */
export function renderTemplate(
    template: OPGTemplate,
    data: {
        title: string;
        clinicName: string;
        content: string;
        address: string;
        phone: string;
        image?: string;
    }
): string {
    let html = template.htmlTemplate
        .replace(/{{TITLE}}/g, data.title)
        .replace(/{{CLINIC_NAME}}/g, data.clinicName)
        .replace(/{{CONTENT}}/g, data.content)
        .replace(/{{ADDRESS}}/g, data.address)
        .replace(/{{PHONE}}/g, data.phone);

    if (data.image) {
        html = html.replace(/{{IMAGE}}/g, `<img src="${data.image}" alt="promotional image" />`);
    } else {
        html = html.replace(/{{IMAGE}}/g, '<div style="color: #999;">이미지 영역</div>');
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>${template.cssStyles}</style>
        </head>
        <body>
            ${html}
        </body>
        </html>
    `;
}
