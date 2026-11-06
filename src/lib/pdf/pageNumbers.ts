import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export type PageNumberPosition = 'bottom-center' | 'bottom-right' | 'top-right';

export async function addPageNumbers(
  file: File,
  position: PageNumberPosition = 'bottom-center',
  prefix: string = 'Page '
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const total = pages.length;
  const fontSize = 10;
  const margin = 28;

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const text = `${prefix}${index + 1} of ${total}`;
    const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);

    let x = (width - textWidth) / 2;
    let y = margin;

    if (position === 'bottom-right') {
      x = width - textWidth - margin;
      y = margin;
    } else if (position === 'top-right') {
      x = width - textWidth - margin;
      y = height - margin;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
}
