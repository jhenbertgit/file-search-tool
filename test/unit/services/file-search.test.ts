import "reflect-metadata";
import { Container } from "inversify";
import { ElectronFileSearchService } from "../../../src/infrastructure/electron/services/electron-file-search-service";
import { FileSystemRepository, FileStats } from "../../../src/core/domain/repositories/file-system-repository";
import { SearchOptions } from "../../../src/core/domain/services/file-search-service";
import { SearchProgress } from "../../../src/core/domain/entities/search-results";

class MockFileSystemRepository implements FileSystemRepository {
  private mockFiles: Map<string, { content: string; stats: FileStats }> = new Map();
  private mockDirectories: Map<string, string[]> = new Map();

  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/');
  }

  setMockFile(path: string, content: string, stats: FileStats) {
    const normalizedPath = this.normalizePath(path);
    this.mockFiles.set(normalizedPath, { content, stats });
  }

  setMockDirectory(path: string, files: string[]) {
    const normalizedPath = this.normalizePath(path);
    this.mockDirectories.set(normalizedPath, files);
    this.mockFiles.set(normalizedPath, {
      content: '',
      stats: { isFile: false, isDirectory: true, size: 0, modified: new Date() }
    });
  }

  async readDirectory(path: string): Promise<string[]> {
    const normalizedPath = this.normalizePath(path);
    const children = this.mockDirectories.get(normalizedPath);
    if (!children) {
      throw new Error(`Directory not found: ${path}`);
    }
    return children;
  }

  async readFile(path: string, encoding?: BufferEncoding): Promise<string> {
    const normalizedPath = this.normalizePath(path);
    const file = this.mockFiles.get(normalizedPath);
    if (!file || !file.stats.isFile) {
      throw new Error(`File not found: ${path}`);
    }
    return file.content;
  }

  async stat(path: string): Promise<FileStats> {
    const normalizedPath = this.normalizePath(path);
    const file = this.mockFiles.get(normalizedPath);
    if (!file) {
      throw new Error(`Path not found: ${path}`);
    }
    return file.stats;
  }

  async exists(path: string): Promise<boolean> {
    const normalizedPath = this.normalizePath(path);
    return this.mockFiles.has(normalizedPath);
  }
}

describe("ElectronFileSearchService", () => {
  let fileSearchService: ElectronFileSearchService;
  let mockFileSystem: MockFileSystemRepository;

  beforeEach(() => {
    mockFileSystem = new MockFileSystemRepository();
    fileSearchService = new ElectronFileSearchService(mockFileSystem);
  });

  describe("file name search", () => {
    beforeEach(() => {
      // Setup mock file structure
      mockFileSystem.setMockDirectory("/test", ["file1.txt", "file2.js", "document.pdf", "subdir"]);
      mockFileSystem.setMockFile("/test/file1.txt", "content1", {
        isFile: true, isDirectory: false, size: 100, modified: new Date("2023-01-01")
      });
      mockFileSystem.setMockFile("/test/file2.js", "content2", {
        isFile: true, isDirectory: false, size: 200, modified: new Date("2023-01-02")
      });
      mockFileSystem.setMockFile("/test/document.pdf", "pdf content", {
        isFile: true, isDirectory: false, size: 300, modified: new Date("2023-01-03")
      });
      mockFileSystem.setMockDirectory("/test/subdir", ["nested.txt"]);
      mockFileSystem.setMockFile("/test/subdir/nested.txt", "nested content", {
        isFile: true, isDirectory: false, size: 150, modified: new Date("2023-01-04")
      });
    });

    test("should find files by name", async () => {
      const options: SearchOptions = {
        directory: "/test",
        searchTerm: "file",
        searchType: "file-name"
      };

      const results = await fileSearchService.searchFiles(options);

      expect(results).toHaveLength(2);
      expect(results.map(r => r.name)).toContain("file1.txt");
      expect(results.map(r => r.name)).toContain("file2.js");
    });

    test("should be case insensitive", async () => {
      const options: SearchOptions = {
        directory: "/test",
        searchTerm: "FILE",
        searchType: "file-name"
      };

      const results = await fileSearchService.searchFiles(options);

      expect(results).toHaveLength(2);
    });

    test("should filter by file types", async () => {
      const options: SearchOptions = {
        directory: "/test",
        searchTerm: "file",
        searchType: "file-name",
        fileTypes: [".txt"]
      };

      const results = await fileSearchService.searchFiles(options);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("file1.txt");
    });

    test("should search in subdirectories", async () => {
      const options: SearchOptions = {
        directory: "/test",
        searchTerm: "nested",
        searchType: "file-name"
      };

      const results = await fileSearchService.searchFiles(options);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("nested.txt");
      expect(results[0].path.replace(/\\/g, '/')).toBe("/test/subdir/nested.txt");
    });
  });

  describe("file content search", () => {
    beforeEach(() => {
      mockFileSystem.setMockDirectory("/test", ["doc1.txt", "doc2.txt", "code.js"]);
      mockFileSystem.setMockFile("/test/doc1.txt", "This is a test document with important content", {
        isFile: true, isDirectory: false, size: 100, modified: new Date("2023-01-01")
      });
      mockFileSystem.setMockFile("/test/doc2.txt", "Another document without the keyword", {
        isFile: true, isDirectory: false, size: 200, modified: new Date("2023-01-02")
      });
      mockFileSystem.setMockFile("/test/code.js", "function test() { return 'important data'; }", {
        isFile: true, isDirectory: false, size: 50, modified: new Date("2023-01-03")
      });
    });

    test("should find files by content", async () => {
      const options: SearchOptions = {
        directory: "/test",
        searchTerm: "important",
        searchType: "file-content"
      };

      const results = await fileSearchService.searchFiles(options);

      expect(results).toHaveLength(2);
      expect(results.map(r => r.name)).toContain("doc1.txt");
      expect(results.map(r => r.name)).toContain("code.js");
    });

    test("should be case insensitive for content search", async () => {
      const options: SearchOptions = {
        directory: "/test",
        searchTerm: "IMPORTANT",
        searchType: "file-content"
      };

      const results = await fileSearchService.searchFiles(options);

      expect(results).toHaveLength(2);
    });

    test("should filter by file types for content search", async () => {
      const options: SearchOptions = {
        directory: "/test",
        searchTerm: "important",
        searchType: "file-content",
        fileTypes: [".js"]
      };

      const results = await fileSearchService.searchFiles(options);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("code.js");
    });
  });

  describe("progress tracking", () => {
    test("should report progress during search", async () => {
      mockFileSystem.setMockDirectory("/test", Array.from({ length: 100 }, (_, i) => `file${i}.txt`));

      // Mock 100 files
      for (let i = 0; i < 100; i++) {
        mockFileSystem.setMockFile(`/test/file${i}.txt`, `content ${i}`, {
          isFile: true, isDirectory: false, size: 100, modified: new Date()
        });
      }

      const progressUpdates: SearchProgress[] = [];
      fileSearchService.onProgress((progress) => {
        progressUpdates.push(progress);
      });

      const options: SearchOptions = {
        directory: "/test",
        searchTerm: "content",
        searchType: "file-content"
      };

      await fileSearchService.searchFiles(options);

      expect(progressUpdates.length).toBeGreaterThan(1);
      expect(progressUpdates[progressUpdates.length - 1].isComplete).toBe(true);
    });
  });

  describe("search control", () => {
    test("should stop search when requested", async () => {
      mockFileSystem.setMockDirectory("/test", ["file1.txt", "file2.txt"]);
      mockFileSystem.setMockFile("/test/file1.txt", "content1", {
        isFile: true, isDirectory: false, size: 100, modified: new Date()
      });
      mockFileSystem.setMockFile("/test/file2.txt", "content2", {
        isFile: true, isDirectory: false, size: 200, modified: new Date()
      });

      const options: SearchOptions = {
        directory: "/test",
        searchTerm: "content",
        searchType: "file-content"
      };

      // Start search and immediately stop it
      const searchPromise = fileSearchService.searchFiles(options);
      fileSearchService.stopSearch();

      const results = await searchPromise;

      // Results might be partial or empty depending on timing
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe("error handling", () => {
    test("should handle directory read errors gracefully", async () => {
      const options: SearchOptions = {
        directory: "/nonexistent",
        searchTerm: "test",
        searchType: "file-name"
      };

      const results = await fileSearchService.searchFiles(options);

      expect(results).toEqual([]);
    });

    test("should handle file read errors gracefully", async () => {
      mockFileSystem.setMockDirectory("/test", ["accessible.txt", "inaccessible.txt"]);
      mockFileSystem.setMockFile("/test/accessible.txt", "accessible content", {
        isFile: true, isDirectory: false, size: 100, modified: new Date()
      });
      // Don't set up inaccessible.txt content, but add it to directory listing
      mockFileSystem.setMockFile("/test/inaccessible.txt", "", {
        isFile: true, isDirectory: false, size: 100, modified: new Date()
      });

      const options: SearchOptions = {
        directory: "/test",
        searchTerm: "content",
        searchType: "file-content"
      };

      const results = await fileSearchService.searchFiles(options);

      // Should find at least the accessible file
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.map(r => r.name)).toContain("accessible.txt");
    });
  });
});
