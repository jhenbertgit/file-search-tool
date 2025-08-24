"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPES = exports.container = void 0;
require("reflect-metadata");
const inversify_1 = require("inversify");
const types_1 = require("./types");
Object.defineProperty(exports, "TYPES", { enumerable: true, get: function () { return types_1.TYPES; } });
// Infrastructure implementations
const electron_file_search_service_1 = require("../../infrastructure/electron/services/electron-file-search-service");
const node_file_system_repository_1 = require("../../infrastructure/file-system/repositories/node-file-system-repository");
const container = new inversify_1.Container();
exports.container = container;
// Bind interfaces to implementations
container
    .bind(types_1.TYPES.FileSearchService)
    .to(electron_file_search_service_1.ElectronFileSearchService);
container
    .bind(types_1.TYPES.FileSystemRepository)
    .to(node_file_system_repository_1.NodeFileSystemRepository);
