import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";

// Domain interfaces
import { FileSearchService } from "../../core/domain/services/file-search-service";
import { FileSystemRepository } from "../../core/domain/repositories/file-system-repository";

// Infrastructure implementations
import { ElectronFileSearchService } from "../../infrastructure/electron/services/electron-file-search-service";
import { NodeFileSystemRepository } from "../../infrastructure/file-system/repositories/node-file-system-repository";

const container = new Container();

// Bind interfaces to implementations
container
  .bind<FileSearchService>(TYPES.FileSearchService)
  .to(ElectronFileSearchService);
container
  .bind<FileSystemRepository>(TYPES.FileSystemRepository)
  .to(NodeFileSystemRepository);

export { container, TYPES };
