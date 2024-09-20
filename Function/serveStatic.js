"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveStatic = serveStatic;
let staticFolderPath = null;
function serveStatic(folderPath) {
    staticFolderPath = folderPath;
}
