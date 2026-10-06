import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportToPdf(elementId = 'resume-a4-page', filename = 'curriculo.pdf') {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Elemento do currículo não encontrado');
  }

  // Create temporary container clone to avoid any screen zoom/scroll artifacts
  const clone = element.cloneNode(true);

  // Strip all non-printable/screen elements (such as guide lines and modals)
  clone.querySelectorAll('.no-print').forEach((el) => el.remove());

  // Wait for web fonts to be completely ready before snapshotting
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  clone.style.width = '794px'; // Exactly 210mm at 96 DPI
  clone.style.minHeight = '1123px'; // Exactly 297mm at 96 DPI
  clone.style.position = 'fixed';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.zIndex = '-9999';
  clone.style.opacity = '1';
  clone.style.pointerEvents = 'none';
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2, // 2x resolution for sharp text
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const originalImgHeight = (canvas.height * pdfWidth) / canvas.width;

    // Smart 1-Page Fit:
    // If the content is within 1.25 pages (up to ~370mm),
    // scale it cleanly to fit onto EXACTLY 1 A4 page with full bleed (no white border margins!)
    if (originalImgHeight <= pdfHeight * 1.25) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    } else {
      // Genuinely multi-page document: paginate properly
      let heightLeft = originalImgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, originalImgHeight);
      heightLeft -= pdfHeight;

      // Subsequent pages only if more than 15mm remains
      while (heightLeft > 15) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, originalImgHeight);
        heightLeft -= pdfHeight;
      }
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(clone);
  }
}

export function printResume() {
  window.print();
}

