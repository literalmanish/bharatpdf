import { PDFDocument } from 'pdf-lib';
import { parsePageRanges } from './split';

export async function removePagesFromPDF(file: File, pagesToRemoveStr: string): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const total = pdfDoc.getPageCount();

  const toRemove = new Set(parsePageRanges(pagesToRemoveStr, total));
  if (toRemove.size >= total) {
    throw new Error('You cannot remove all pages from the document.');
  }

  // Create new document keeping only non-removed pages
  const newPdf = await PDFDocument.create();
  const keepIndices: number[] = [];
  for (let i = 1; i <= total; i++) {
    if (!toRemove.has(i)) {
      keepIndices.push(i - 1);
    }
  }

  const copied = await newPdf.copyPages(pdfDoc, keepIndices);
  copied.forEach((p) => newPdf.addPage(p));

  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
}
