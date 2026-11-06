import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export async function addWatermark(
  file: File,
  watermarkText: string,
  options?: {
    fontSize?: number;
    opacity?: number;
    rotation?: number;
    color?: { r: number; g: number; b: number };
  }
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = options?.fontSize ?? 48;
  const opacity = options?.opacity ?? 0.3;
  const rotation = degrees(options?.rotation ?? 45);
  const color = options?.color ?? { r: 0.8, g: 0.1, b: 0.1 };

  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
    const textHeight = helveticaFont.heightAtSize(fontSize);

    // Approximate center with rotation
    const x = (width - textWidth) / 2;
    const y = (height - textHeight) / 2;

    page.drawText(watermarkText, {
      x,
      y,
      size: fontSize,
      font: helveticaFont,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: rotation,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
}
