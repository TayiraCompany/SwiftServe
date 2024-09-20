"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webSocketHandlers = exports.middlewares = exports.routes = void 0;
exports.getContentType = getContentType;
const path_1 = __importDefault(require("path"));
const routes = {
    GET: [],
    POST: [],
    DELETE: [],
    PUT: [],
    PATCH: [],
};
exports.routes = routes;
const middlewares = [];
exports.middlewares = middlewares;
let webSocketHandlers = [];
exports.webSocketHandlers = webSocketHandlers;
function getContentType(filePath) {
    const ext = path_1.default.extname(filePath).toLowerCase();
    const mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".gif": "image/gif",
    };
    return mimeTypes[ext] || "application/octet-stream";
}
