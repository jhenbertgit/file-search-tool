import { SearchResult, SearchProgress } from "../entities/search-results";

export interface FileSearchService {
  searchFiles(options: SearchOptions): Promise<SearchResult[]>;
  stopSearch(): void;
  onProgress(callback: (progress: SearchProgress) => void): void;
}

export interface SearchOptions {
  directory: string;
  searchTerm: string;
  searchType: "file-name" | "file-content";
  fileTypes?: string[];
  maxFileSize?: number;
}
