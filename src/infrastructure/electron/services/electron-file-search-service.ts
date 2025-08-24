import { inject, injectable } from "inversify";
import { TYPES } from "../../di/types";
import {
  FileSearchService,
  SearchOptions,
} from "../../../core/domain/services/file-search-service";
import { FileSystemRepository } from "../../../core/domain/repositories/file-system-repository";
import {
  SearchResult,
  SearchProgress,
} from "../../../core/domain/entities/search-results";

@injectable()
export class ElectronFileSearchService implements FileSearchService {
  private isSearching = false;
  private progressCallbacks: Array<(progress: SearchProgress) => void> = [];

  constructor(
    @inject(TYPES.FileSystemRepository) private fileSystem: FileSystemRepository
  ) {}

  async searchFiles(options: SearchOptions): Promise<SearchResult[]> {
    this.isSearching = true;
    const results: SearchResult[] = [];

    try {
      await this.searchDirectory(options, results);
      return results;
    } finally {
      this.isSearching = false;
    }
  }

  stopSearch(): void {
    this.isSearching = false;
  }

  onProgress(callback: (progress: SearchProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  private async searchDirectory(
    options: SearchOptions,
    results: SearchResult[]
  ): Promise<void> {
    // Implementation with proper DI and error handling
  }

  private notifyProgress(progress: SearchProgress): void {
    this.progressCallbacks.forEach((callback) => callback(progress));
  }
}
