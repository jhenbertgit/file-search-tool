export interface FileSystemRepository {
  readDirectory(path: string): Promise<string[]>;
  readFile(path: string, encoding?: BufferEncoding): Promise<string>;
  stat(path: string): Promise<FileStats>;
  exists(path: string): Promise<boolean>;
}

export interface FileStats {
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  modified: Date;
}
