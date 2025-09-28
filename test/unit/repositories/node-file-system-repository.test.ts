import "reflect-metadata";
import { NodeFileSystemRepository } from "../../../src/infrastructure/file-system/repositories/node-file-system-repository";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";

jest.mock("fs", () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
    stat: jest.fn(),
    access: jest.fn(),
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe("NodeFileSystemRepository", () => {
  let repository: NodeFileSystemRepository;

  beforeEach(() => {
    repository = new NodeFileSystemRepository();
    jest.clearAllMocks();
  });

  describe("readDirectory", () => {
    test("should return directory contents", async () => {
      const mockFiles = ["file1.txt", "file2.js", "subdirectory"];
      mockFs.readdir.mockResolvedValue(mockFiles as any);

      const result = await repository.readDirectory("/test/path");

      expect(mockFs.readdir).toHaveBeenCalledWith("/test/path");
      expect(result).toEqual(mockFiles);
    });

    test("should propagate errors", async () => {
      const error = new Error("Permission denied");
      mockFs.readdir.mockRejectedValue(error);

      await expect(repository.readDirectory("/test/path")).rejects.toThrow("Permission denied");
    });
  });

  describe("readFile", () => {
    test("should read file with default encoding", async () => {
      const mockContent = "file content";
      mockFs.readFile.mockResolvedValue(mockContent as any);

      const result = await repository.readFile("/test/file.txt");

      expect(mockFs.readFile).toHaveBeenCalledWith("/test/file.txt", "utf-8");
      expect(result).toBe(mockContent);
    });

    test("should read file with specified encoding", async () => {
      const mockContent = "file content";
      mockFs.readFile.mockResolvedValue(mockContent as any);

      const result = await repository.readFile("/test/file.txt", "ascii");

      expect(mockFs.readFile).toHaveBeenCalledWith("/test/file.txt", "ascii");
      expect(result).toBe(mockContent);
    });

    test("should propagate read errors", async () => {
      const error = new Error("File not found");
      mockFs.readFile.mockRejectedValue(error);

      await expect(repository.readFile("/test/file.txt")).rejects.toThrow("File not found");
    });
  });

  describe("stat", () => {
    test("should return file stats", async () => {
      const mockStats = {
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date("2023-01-01T00:00:00Z"),
      };
      mockFs.stat.mockResolvedValue(mockStats as any);

      const result = await repository.stat("/test/file.txt");

      expect(mockFs.stat).toHaveBeenCalledWith("/test/file.txt");
      expect(result).toEqual({
        isFile: true,
        isDirectory: false,
        size: 1024,
        modified: new Date("2023-01-01T00:00:00Z"),
      });
    });

    test("should return directory stats", async () => {
      const mockStats = {
        isFile: () => false,
        isDirectory: () => true,
        size: 0,
        mtime: new Date("2023-01-01T00:00:00Z"),
      };
      mockFs.stat.mockResolvedValue(mockStats as any);

      const result = await repository.stat("/test/directory");

      expect(result).toEqual({
        isFile: false,
        isDirectory: true,
        size: 0,
        modified: new Date("2023-01-01T00:00:00Z"),
      });
    });

    test("should propagate stat errors", async () => {
      const error = new Error("Path not found");
      mockFs.stat.mockRejectedValue(error);

      await expect(repository.stat("/test/nonexistent")).rejects.toThrow("Path not found");
    });
  });

  describe("exists", () => {
    test("should return true for existing paths", async () => {
      mockFs.access.mockResolvedValue(undefined as any);

      const result = await repository.exists("/test/existing");

      expect(mockFs.access).toHaveBeenCalledWith("/test/existing");
      expect(result).toBe(true);
    });

    test("should return false for non-existing paths", async () => {
      mockFs.access.mockRejectedValue(new Error("ENOENT"));

      const result = await repository.exists("/test/nonexistent");

      expect(mockFs.access).toHaveBeenCalledWith("/test/nonexistent");
      expect(result).toBe(false);
    });

    test("should return false for permission denied", async () => {
      mockFs.access.mockRejectedValue(new Error("EACCES"));

      const result = await repository.exists("/test/forbidden");

      expect(result).toBe(false);
    });
  });
});