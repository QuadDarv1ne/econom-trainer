import 'jspdf';

interface AutoTableOptions {
  startY?: number;
  head?: string[][];
  body?: string[][];
  theme?: 'striped' | 'grid' | 'plain';
  headStyles?: Record<string, unknown>;
  styles?: Record<string, unknown>;
  columnStyles?: Record<number, Record<string, unknown>>;
}

interface AutoTableResult {
  finalY: number;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable(options: AutoTableOptions): AutoTableResult;
    lastAutoTable?: AutoTableResult;
  }
}
