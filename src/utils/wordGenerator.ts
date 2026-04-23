import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

export const generateScreeningWord = async (questions: string[]) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "LAMPIRAN B: SKRENING PROTOKOL PENELITIAN",
              bold: true,
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Wajib diisi secara lengkap sesuai dengan protokol penelitian Anda.",
              italics: true,
              size: 20,
            }),
          ],
        }),
        new Paragraph({ text: "" }), // Spacer

        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 5, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })],
                }),
                new TableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [new TextRun({ text: "Pertanyaan Skrening", bold: true })] })],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [new TextRun({ text: "Jawaban", bold: true })] })],
                }),
              ],
            }),
            ...questions.map((q, i) => (
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: (i + 1).toString() })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: q })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "" })], // Placeholder for answer
                  }),
                ],
              })
            ))
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Form_Skrening_Protokol_Penelitian.docx");
};
