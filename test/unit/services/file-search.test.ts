import "reflect-metadata";
import { container } from "../../../src/infrastructure/di/container";
import { TYPES } from "../../../src/infrastructure/di/types";
import { FileSearchService } from "../../../src/core/domain/services/file-search-service";

describe("FileSearchService", () => {
  let fileSearchService: FileSearchService;

  beforeEach(() => {
    // Reset container and setup mocks
    container.snapshot();

    // Mock dependencies
    // container.unbind(TYPES.FileSystemRepository);
    // container.bind(TYPES.FileSystemRepository).to(MockFileSystemRepository);

    fileSearchService = container.get<FileSearchService>(
      TYPES.FileSearchService
    );
  });

  afterEach(() => {
    container.restore();
  });

  test("should search files successfully", async () => {
    // Test implementation
  });
});
