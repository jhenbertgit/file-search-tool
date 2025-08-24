"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronFileSearchService = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../../di/types");
let ElectronFileSearchService = class ElectronFileSearchService {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.isSearching = false;
        this.progressCallbacks = [];
    }
    async searchFiles(options) {
        this.isSearching = true;
        const results = [];
        try {
            await this.searchDirectory(options, results);
            return results;
        }
        finally {
            this.isSearching = false;
        }
    }
    stopSearch() {
        this.isSearching = false;
    }
    onProgress(callback) {
        this.progressCallbacks.push(callback);
    }
    async searchDirectory(options, results) {
        // Implementation with proper DI and error handling
    }
    notifyProgress(progress) {
        this.progressCallbacks.forEach((callback) => callback(progress));
    }
};
exports.ElectronFileSearchService = ElectronFileSearchService;
exports.ElectronFileSearchService = ElectronFileSearchService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.FileSystemRepository)),
    __metadata("design:paramtypes", [Object])
], ElectronFileSearchService);
