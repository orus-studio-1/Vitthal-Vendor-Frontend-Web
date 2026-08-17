type CsvCell = string | number | boolean | null | undefined;

function csvEscape(value: CsvCell) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]) {
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function pdfEscape(value: CsvCell) {
  return (value === null || value === undefined ? "" : String(value))
    .replace(/[₹–—]/g, (match) => (match === "₹" ? "INR " : "-"))
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function splitPdfText(text: string, maxLength = 88) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export function downloadPdfReport(
  title: string,
  sections: Array<{ heading: string; rows: CsvCell[][]; headers?: string[] }>,
  filename: string
) {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 42;
  const lineHeight = 14;
  const contentLines: Array<{ text: string; size?: number; bold?: boolean }> = [
    { text: "MTWO GROUP - VENDOR MANAGEMENT PORTAL", size: 16, bold: true },
    { text: title, size: 12, bold: true },
    { text: `Generated: ${new Date().toLocaleString("en-IN")}`, size: 9 },
    { text: "--------------------------------------------------------------------------------" },
  ];

  sections.forEach((section) => {
    contentLines.push({ text: section.heading, size: 12, bold: true });
    if (section.headers?.length) {
      contentLines.push({ text: section.headers.join(" | "), size: 8.5, bold: true });
    }
    section.rows.forEach((row) => {
      splitPdfText(row.map((cell) => (cell === null || cell === undefined ? "" : String(cell))).join(" | ")).forEach(
        (line) => {
          contentLines.push({ text: line, size: 8.5 });
        }
      );
    });
    contentLines.push({ text: " " });
  });

  const pages: (typeof contentLines)[] = [];
  let currentPage: typeof contentLines = [];
  let y = pageHeight - margin;

  contentLines.forEach((line) => {
    const size = line.size || 10;
    const needed = Math.max(lineHeight, size + 4);
    if (y - needed < margin && currentPage.length) {
      pages.push(currentPage);
      currentPage = [];
      y = pageHeight - margin;
    }
    currentPage.push(line);
    y -= needed;
  });
  if (currentPage.length) pages.push(currentPage);

  const objects: string[] = [];
  const addObject = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const fontRegular = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBold = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageObjectIds: number[] = [];

  pages.forEach((page) => {
    let cursorY = pageHeight - margin;
    const commands = ["BT"];
    page.forEach((line) => {
      const size = line.size || 10;
      const fontId = line.bold ? "F2" : "F1";
      commands.push(`/${fontId} ${size} Tf`);
      commands.push(`1 0 0 1 ${margin} ${cursorY} Tm`);
      commands.push(`(${pdfEscape(line.text)}) Tj`);
      cursorY -= Math.max(lineHeight, size + 4);
    });
    commands.push("ET");
    const stream = commands.join("\n");
    const streamObject = addObject(`<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`);
    const pageObject = addObject(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${streamObject} 0 R >>`
    );
    pageObjectIds.push(pageObject);
  });

  const pagesObject = addObject(
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`
  );
  pageObjectIds.forEach((id) => {
    objects[id - 1] = objects[id - 1].replace("/Parent 0 0 R", `/Parent ${pagesObject} 0 R`);
  });
  const catalogObject = addObject(`<< /Type /Catalog /Pages ${pagesObject} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObject} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
