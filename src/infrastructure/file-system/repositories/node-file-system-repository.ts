// src/infrastructure/file-system/repositories/node-file-system-repository.ts
import { injectable } from "inversify";
import { promises as fs } from "fs";
import {
  FileSystemRepository,
  FileStats,
} from "../../../core/domain/repositories/file-system-repository";

@injectable()
export class NodeFileSystemRepository implements FileSystemRepository {
  async readDirectory(path: string): Promise<string[]> {
    return fs.readdir(path);
  }

  async readFile(
    path: string,
    encoding: BufferEncoding = "utf-8"
  ): Promise<string> {
    return fs.readFile(path, encoding);
  }

  async stat(path: string): Promise<FileStats> {
    const stats = await fs.stat(path);
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      modified: stats.mtime,
    };
  }

  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}
