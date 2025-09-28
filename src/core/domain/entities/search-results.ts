export interface SearchResult {
  name: string;
  path: string;
  size: number;
  modified: Date;
  extension: string;
  contentPreview?: string;
}

export interface SearchProgress {
  scanned: number;
  total?: number;
  matched: number;
  percentage?: number;
  currentFile?: string;
  isComplete: boolean;
}
