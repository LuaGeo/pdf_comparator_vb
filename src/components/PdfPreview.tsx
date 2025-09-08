import React, { useState } from "react";
import { Document, Page } from "react-pdf";
import { ChevronLeft, ChevronRight, Eye, AlertCircle } from "lucide-react";

// Worker é configurado globalmente em src/main.tsx

interface UploadedFile {
  file: File;
  url: string;
  name: string;
}

interface PdfPreviewProps {
  file: UploadedFile | null;
  title: string;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ file, title }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = () => {
    setError("Erreur lors du chargement du PDF");
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber((page) => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setPageNumber((page) => Math.min(numPages, page + 1));
  };

  if (!file) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">{title} - En attente du fichier</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Eye className="w-5 h-5 mr-2 text-blue-600" />
          {title}
        </h3>
        <p className="text-sm text-gray-600 truncate mt-1">{file.name}</p>
      </div>

      <div className="p-4">
        {error ? (
          <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <Document
                  file={file.url}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center h-64 bg-gray-50">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    width={300}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
              </div>
            </div>

            {numPages > 1 && (
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-sm text-gray-600 min-w-0">
                  Page {pageNumber} sur {numPages}
                </span>

                <button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfPreview;
