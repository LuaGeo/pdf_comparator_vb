import React, { useState, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { pdfjs } from 'react-pdf';
import * as diff from 'diff';
import { saveAs } from 'file-saver';
import { Download, Loader2, AlertCircle } from 'lucide-react';

interface UploadedFile {
  file: File;
  url: string;
  name: string;
}

interface DiffProcessorProps {
  file1: UploadedFile | null;
  file2: UploadedFile | null;
}

const DiffProcessor: React.FC<DiffProcessorProps> = ({ file1, file2 }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [diffPdfUrl, setDiffPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText;
    } catch (err) {
      throw new Error('Erreur lors de l\'extraction du texte du PDF');
    }
  };

  const createDiffPdf = async (text1: string, text2: string): Promise<Blob> => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage([595, 842]); // A4 size

    const { width, height } = page.getSize();
    const fontSize = 12;
    const lineHeight = fontSize * 1.2;
    const margin = 50;
    const maxWidth = width - 2 * margin;

    // Calculate differences
    const differences = diff.diffLines(text1, text2);
    
    let yPosition = height - margin;
    let pageCount = 1;
    let currentPage = page;

    // Title
    currentPage.drawText('Comparaison PDF - Différences', {
      x: margin,
      y: yPosition,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    // Legend
    currentPage.drawText('Légende:', {
      x: margin,
      y: yPosition,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;

    currentPage.drawText('• Texte supprimé (rouge)', {
      x: margin + 10,
      y: yPosition,
      size: 10,
      font,
      color: rgb(0.8, 0, 0),
    });
    yPosition -= lineHeight * 0.8;

    currentPage.drawText('• Texte ajouté (vert)', {
      x: margin + 10,
      y: yPosition,
      size: 10,
      font,
      color: rgb(0, 0.6, 0),
    });
    yPosition -= 30;

    // Process differences
    for (const part of differences) {
      if (yPosition < margin + 50) {
        // Create new page if needed
        currentPage = pdfDoc.addPage([595, 842]);
        yPosition = height - margin;
        pageCount++;
      }

      const lines = part.value.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (!line.trim()) continue;

        // Word wrap for long lines
        const words = line.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);
          
          if (textWidth > maxWidth && currentLine) {
            // Draw current line
            let color = rgb(0, 0, 0); // default black
            if (part.removed) color = rgb(0.8, 0, 0); // red for removed
            if (part.added) color = rgb(0, 0.6, 0); // green for added

            currentPage.drawText(currentLine, {
              x: margin,
              y: yPosition,
              size: fontSize,
              font,
              color,
            });
            
            yPosition -= lineHeight;
            currentLine = word;
            
            // Check if we need a new page
            if (yPosition < margin + 50) {
              currentPage = pdfDoc.addPage([595, 842]);
              yPosition = height - margin;
              pageCount++;
            }
          } else {
            currentLine = testLine;
          }
        }
        
        // Draw remaining text
        if (currentLine) {
          let color = rgb(0, 0, 0);
          if (part.removed) color = rgb(0.8, 0, 0);
          if (part.added) color = rgb(0, 0.6, 0);

          currentPage.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font,
            color,
          });
          
          yPosition -= lineHeight;
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  };

  const processDiff = async () => {
    if (!file1 || !file2) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Extract text from both PDFs
      const text1 = await extractTextFromPdf(file1.file);
      const text2 = await extractTextFromPdf(file2.file);

      // Create diff PDF
      const diffBlob = await createDiffPdf(text1, text2);
      const diffUrl = URL.createObjectURL(diffBlob);
      setDiffPdfUrl(diffUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du traitement');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadDiff = () => {
    if (!diffPdfUrl) return;
    
    const fileName = `differences_${file1?.name.replace('.pdf', '')}_vs_${file2?.name.replace('.pdf', '')}.pdf`;
    
    // Create download link
    const link = document.createElement('a');
    link.href = diffPdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (file1 && file2) {
      processDiff();
    }
  }, [file1, file2]);

  useEffect(() => {
    return () => {
      if (diffPdfUrl) {
        URL.revokeObjectURL(diffPdfUrl);
      }
    };
  }, [diffPdfUrl]);

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analyse des différences en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-3 text-red-600 bg-red-50 p-4 rounded-lg">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (diffPdfUrl) {
    return (
      <div className="text-center">
        <button
          onClick={downloadDiff}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-3 mx-auto hover:scale-105 shadow-lg"
        >
          <Download className="w-5 h-5" />
          <span>Télécharger le fichier de différences</span>
        </button>
        <p className="text-sm text-gray-600 mt-3">
          Le fichier PDF contient les différences entre vos documents avec la légende colorée
        </p>
      </div>
    );
  }

  return null;
};

export default DiffProcessor;