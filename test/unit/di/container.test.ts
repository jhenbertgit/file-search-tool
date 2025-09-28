import "reflect-metadata";
import { container } from "../../../src/infrastructure/di/container";
import { TYPES } from "../../../src/infrastructure/di/types";
import { FileSearchService } from "../../../src/core/domain/services/file-search-service";
import { FileSystemRepository } from "../../../src/core/domain/repositories/file-system-repository";
import { ElectronFileSearchService } from "../../../src/infrastructure/electron/services/electron-file-search-service";
import { NodeFileSystemRepository } from "../../../src/infrastructure/file-system/repositories/node-file-system-repository";

describe("DI Container", () => {
  beforeEach(() => {
    container.snapshot();
  });

  afterEach(() => {
    container.restore();
  });

  test("should bind FileSearchService correctly", () => {
    const service = container.get<FileSearchService>(TYPES.FileSearchService);

    expect(service).toBeInstanceOf(ElectronFileSearchService);
    expect(service.searchFiles).toBeDefined();
    expect(service.stopSearch).toBeDefined();
    expect(service.onProgress).toBeDefined();
  });

  test("should bind FileSystemRepository correctly", () => {
    const repository = container.get<FileSystemRepository>(TYPES.FileSystemRepository);

    expect(repository).toBeInstanceOf(NodeFileSystemRepository);
    expect(repository.readDirectory).toBeDefined();
    expect(repository.readFile).toBeDefined();
    expect(repository.stat).toBeDefined();
    expect(repository.exists).toBeDefined();
  });

  test("should inject dependencies correctly", () => {
    const service = container.get<FileSearchService>(TYPES.FileSearchService);

    // The service should be properly instantiated with its dependencies
    expect(service).toBeInstanceOf(ElectronFileSearchService);
  });

  test("should return new instances (transient binding)", () => {
    const service1 = container.get<FileSearchService>(TYPES.FileSearchService);
    const service2 = container.get<FileSearchService>(TYPES.FileSearchService);

    // ElectronFileSearchService is bound as transient, so should get new instances
    expect(service1).not.toBe(service2);
    expect(service1).toBeInstanceOf(ElectronFileSearchService);
    expect(service2).toBeInstanceOf(ElectronFileSearchService);
  });

  test("should allow rebinding for testing", () => {
    class MockFileSystemRepository implements FileSystemRepository {
      async readDirectory(): Promise<string[]> { return []; }
      async readFile(): Promise<string> { return ""; }
      async stat(): Promise<any> { return { isFile: true, isDirectory: false, size: 0, modified: new Date() }; }
      async exists(): Promise<boolean> { return true; }
    }

    container.unbind(TYPES.FileSystemRepository);
    container.bind(TYPES.FileSystemRepository).to(MockFileSystemRepository);

    const repository = container.get<FileSystemRepository>(TYPES.FileSystemRepository);
    expect(repository).toBeInstanceOf(MockFileSystemRepository);
  });
});