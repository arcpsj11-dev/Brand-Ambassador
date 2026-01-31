import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * PDF 생성 서비스
 */
export class PDFExporter {
    /**
     * HTML을 PDF로 변환
     */
    async exportToPDF(htmlContent: string, filename: string = 'promotional-material.pdf'): Promise<void> {
        // 임시 div 생성
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        document.body.appendChild(tempDiv);

        try {
            // HTML을 캔버스로 변환
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });

            // A4 사이즈 (210mm x 297mm)
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(filename);
        } finally {
            // 임시 div 제거
            document.body.removeChild(tempDiv);
        }
    }

    /**
     * HTML을 이미지로 변환
     */
    async exportToImage(htmlContent: string, filename: string = 'promotional-material.png'): Promise<void> {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        document.body.appendChild(tempDiv);

        try {
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });

            // 캔버스를 blob으로 변환 후 다운로드
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    link.click();
                    URL.revokeObjectURL(url);
                }
            }, 'image/png');
        } finally {
            document.body.removeChild(tempDiv);
        }
    }
}

export const pdfExporter = new PDFExporter();
