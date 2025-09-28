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
import * as path from "path";

@injectable()
export class ElectronFileSearchService implements FileSearchService {
  private isSearching = false;
  private progressCallbacks: Array<(progress: SearchProgress) => void> = [];
  private scannedFiles = 0;

  constructor(
    @inject(TYPES.FileSystemRepository) private fileSystem: FileSystemRepository
  ) {}

  async searchFiles(options: SearchOptions): Promise<SearchResult[]> {
    this.isSearching = true;
    this.scannedFiles = 0;
    const results: SearchResult[] = [];

    try {
      await this.searchDirectory(options.directory, options, results);
      this.notifyProgress({ scanned: this.scannedFiles, matched: results.length, isComplete: true });
      return results;
    } catch (error) {
      console.error("Error during search:", error);
      return []; // Or handle error appropriately
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
    directory: string,
    options: SearchOptions,
    results: SearchResult[]
  ): Promise<void> {
    if (!this.isSearching) {
      return;
    }

    let entries: string[];
    try {
      entries = await this.fileSystem.readDirectory(directory);
    } catch (error) {
      console.error(`Error reading directory ${directory}:`, error);
      return; // Skip directories that can't be read
    }

    for (const entry of entries) {
      if (!this.isSearching) {
        return;
      }

      const fullPath = path.join(directory, entry);
      let stats;
      try {
        stats = await this.fileSystem.stat(fullPath);
      } catch (error) {
        console.error(`Error getting stats for ${fullPath}:`, error);
        continue; // Skip files that can't be accessed
      }

      if (stats.isDirectory) {
        await this.searchDirectory(fullPath, options, results);
      } else if (stats.isFile) {
        this.scannedFiles++;

        const fileExtension = path.extname(fullPath).toLowerCase();
        const allowedFileTypes = options.fileTypes?.map(t => t.toLowerCase().startsWith('.') ? t : `.${t}`) ?? [];
        if (allowedFileTypes.length > 0 && !allowedFileTypes.includes(fileExtension)) {
            continue;
        }

        let isMatch = false;
        if (options.searchType === "file-name") {
          if (entry.toLowerCase().includes(options.searchTerm.toLowerCase())) {
            isMatch = true;
          }
        } else if (options.searchType === "file-content") {
          try {
            const content = await this.fileSystem.readFile(fullPath);
            if (content.toLowerCase().includes(options.searchTerm.toLowerCase())) {
              isMatch = true;
            }
          } catch (error) {
            console.error(`Error reading file ${fullPath}:`, error);
          }
        }

        if (isMatch) {
          results.push({
            name: entry,
            path: fullPath,
            size: stats.size,
            modified: stats.modified,
            extension: fileExtension,
          });
        }
        
        if (this.scannedFiles % 50 === 0) { // Notify every 50 files
            this.notifyProgress({ scanned: this.scannedFiles, matched: results.length, isComplete: false });
        }
      }
    }
  }

  private notifyProgress(progress: SearchProgress): void {
    this.progressCallbacks.forEach((callback) => callback(progress));
  }
}
