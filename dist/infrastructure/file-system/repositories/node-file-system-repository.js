"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeFileSystemRepository = void 0;
// src/infrastructure/file-system/repositories/node-file-system-repository.ts
const inversify_1 = require("inversify");
const fs_1 = require("fs");
let NodeFileSystemRepository = class NodeFileSystemRepository {
    async readDirectory(path) {
        return fs_1.promises.readdir(path);
    }
    async readFile(path, encoding = "utf-8") {
        return fs_1.promises.readFile(path, encoding);
    }
    async stat(path) {
        const stats = await fs_1.promises.stat(path);
        return {
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modified: stats.mtime,
        };
    }
    async exists(path) {
        try {
            await fs_1.promises.access(path);
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.NodeFileSystemRepository = NodeFileSystemRepository;
exports.NodeFileSystemRepository = NodeFileSystemRepository = __decorate([
    (0, inversify_1.injectable)()
], NodeFileSystemRepository);
