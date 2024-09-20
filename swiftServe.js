"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSwiftServe = createSwiftServe;
// Module_Export.ts
const Module_Export_1 = require("./Module_Export");
// Export  - Attr
const Attreg_1 = require("./Export/Attreg");
// Extend
const Request_1 = require("./Handler/Request");
const onWebSocket_1 = require("./Function/onWebSocket");
const cors_1 = require("./Function/cors");
const serveStatic_1 = require("./Function/serveStatic");
const GEW_1 = require("./Routes/GEW");
function createSwiftServe() {
    let staticFolderPath = null;
    function readStaticFile(filePath, res) {
        Module_Export_1.fs.readFile(filePath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end("Internal Server Error");
            }
            else {
                res.setHeader("Content-Type", (0, Attreg_1.getContentType)(filePath));
                res.end(data);
            }
        });
    }
    function listen(port, callback, options) {
        const server = Module_Export_1.http.createServer((req, res) => {
            if (staticFolderPath) {
                const filePath = Module_Export_1.path.join(staticFolderPath, req.url || "");
                Module_Export_1.fs.access(filePath, Module_Export_1.fs.constants.F_OK, (err) => {
                    if (!err) {
                        readStaticFile(filePath, res);
                    }
                    else {
                        (0, Request_1.handleRequest)(req, res);
                    }
                });
            }
            else {
                (0, Request_1.handleRequest)(req, res);
            }
        });
        if (options === null || options === void 0 ? void 0 : options.webSocket) {
            const wss = new Module_Export_1.WebSocket.Server({ server });
            wss.on("connection", (ws, req) => {
                Attreg_1.webSocketHandlers.forEach((handler) => handler(ws, req));
            });
        }
        server.listen(port, callback);
    }
    return {
        use: GEW_1.use,
        get: GEW_1.get,
        post: GEW_1.post,
        delete: GEW_1.deleteRoute,
        put: GEW_1.put,
        patch: GEW_1.patch,
        api: GEW_1.api,
        onWebSocket: onWebSocket_1.onWebSocket,
        cors: cors_1.cors,
        serveStatic: serveStatic_1.serveStatic,
        listen,
    };
}
