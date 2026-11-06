import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export function parsePageRanges(rangeStr: string, maxPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
          pages.add(i);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPages) {
        pages.add(p);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export async function splitPDFByRange(file: File, pageRange: string): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const totalPages = sourcePdf.getPageCount();

  const selectedPages = parsePageRanges(pageRange, totalPages);
  if (selectedPages.length === 0) {
    throw new Error('Please specify at least one valid page range (e.g. 1-3, 5).');
  }

  const newPdf = await PDFDocument.create();
  // 0-indexed in pdf-lib
  const zeroIndexed = selectedPages.map((p) => p - 1);
  const copiedPages = await newPdf.copyPages(sourcePdf, zeroIndexed);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
}

export async function splitAllPagesToZip(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const totalPages = sourcePdf.getPageCount();
  const zip = new JSZip();

  const baseName = file.name.replace(/\.pdf$/i, '');

  for (let i = 0; i < totalPages; i++) {
    const singleDoc = await PDFDocument.create();
    const [page] = await singleDoc.copyPages(sourcePdf, [i]);
    singleDoc.addPage(page);
    const bytes = await singleDoc.save();
    zip.file(`${baseName}_page_${i + 1}.pdf`, bytes);
  }

  return await zip.generateAsync({ type: 'blob' });
}
