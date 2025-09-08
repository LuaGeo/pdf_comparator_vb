import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { pdfjs } from "react-pdf";
import PdfJsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";
import App from "./App.tsx";
import "./index.css";

// Configure pdf.js worker for react-pdf globally (Vite module worker)
pdfjs.GlobalWorkerOptions.workerPort = new PdfJsWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
