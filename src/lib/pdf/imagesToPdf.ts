import { PDFDocument } from 'pdf-lib';

export async function convertImagesToPDF(
  imageFiles: File[],
  fitMode: 'contain' | 'original' = 'contain'
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  // A4 dimensions in points (72 points per inch)
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;

  for (const imgFile of imageFiles) {
    const arrayBuffer = await imgFile.arrayBuffer();
    let embeddedImg;

    if (imgFile.type.includes('png')) {
      embeddedImg = await pdfDoc.embedPng(arrayBuffer);
    } else {
      embeddedImg = await pdfDoc.embedJpg(arrayBuffer);
    }

    const { width: origWidth, height: origHeight } = embeddedImg;

    if (fitMode === 'contain') {
      const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      const margin = 36; // 0.5 inch margin
      const maxWidth = A4_WIDTH - margin * 2;
      const maxHeight = A4_HEIGHT - margin * 2;

      const scaleFactor = Math.min(maxWidth / origWidth, maxHeight / origHeight, 1);
      const renderWidth = origWidth * scaleFactor;
      const renderHeight = origHeight * scaleFactor;

      const x = (A4_WIDTH - renderWidth) / 2;
      const y = (A4_HEIGHT - renderHeight) / 2;

      page.drawImage(embeddedImg, {
        x,
        y,
        width: renderWidth,
        height: renderHeight,
      });
    } else {
      // Create page sized exactly to image
      const page = pdfDoc.addPage([origWidth, origHeight]);
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: origWidth,
        height: origHeight,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
}
