"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
const http = __importStar(require("http"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function createSwiftServe() {
    const routes = {
        GET: [],
        POST: [],
        DELETE: [],
        PUT: [],
        PATCH: [],
    };
    const middlewares = [];
    let webSocketHandlers = [];
    let corsOptions = null;
    let staticFolderPath = null;
    function use(middleware) {
        middlewares.push(middleware);
    }
    function addRoute(method, routePath, handler) {
        if (routes[method]) {
            routes[method].push({ path: routePath, handler });
        }
    }
    function get(routePath, handler) {
        addRoute("GET", routePath, handler);
    }
    function post(routePath, handler) {
        addRoute("POST", routePath, handler);
    }
    function deleteRoute(routePath, handler) {
        addRoute("DELETE", routePath, handler);
    }
    function put(routePath, handler) {
        addRoute("PUT", routePath, handler);
    }
    function patch(routePath, handler) {
        addRoute("PATCH", routePath, handler);
    }
    function api(Path, APIRequestType = "POST", version = 0, handler) {
        addRoute(APIRequestType, `/api/v${version}${Path}`, handler);
    }
    function onWebSocket(handler) {
        webSocketHandlers.push(handler);
    }
    function match(method, url) {
        const routesForMethod = routes[method];
        for (const route of routesForMethod) {
            const regex = new RegExp(`^${route.path.replace(/:[^\s/]+/g, "([^/]+)")}$`);
            const match = url.match(regex);
            if (match) {
                const params = route.path.match(/:([^\s/]+)/g) || [];
                const paramsObject = {};
                params.forEach((param, index) => {
                    paramsObject[param.substring(1)] = match[index + 1];
                });
                return { handler: route.handler, params: paramsObject };
            }
        }
        return null;
    }
    function extendResponse(res) {
        res.status = (code) => {
            res.statusCode = code;
            return res;
        };
        res.json = (data) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
        };
        res.send = (data) => {
            const decodedData = decodeURIComponent(data);
            res.setHeader("Content-Type", "text/html");
            res.end(decodedData);
        };
        res.sendFile = (filePath) => {
            const fullPath = path.resolve(filePath);
            fs.exists(fullPath, (exists) => {
                if (exists) {
                    fs.readFile(fullPath, (err, data) => {
                        if (err) {
                            res.status(500).send("Internal Server Error");
                        }
                        else {
                            res.setHeader("Content-Type", getContentType(fullPath));
                            res.end(data);
                        }
                    });
                }
                else {
                    res.status(404).send("Not Found");
                }
            });
        };
        res.sendText = (text) => res.send(text);
        res.redirect = (url) => {
            res.status(302).setHeader("Location", url);
            res.end();
        };
    }
    function extendRequest(req) {
        const urlObj = new URL(req.url || "", `http://${req.headers.host}`);
        req.query = Object.fromEntries(Array.from(urlObj.searchParams.entries()).map(([key, value]) => [
            key,
            value,
        ]));
        req.params = {}; // تعيين params ككائن فارغ بشكل افتراضي
        req.isGet = () => req.method === "GET";
        req.isPost = () => req.method === "POST";
        req.isDelete = () => req.method === "DELETE";
        req.isPut = () => req.method === "PUT";
        req.isPatch = () => req.method === "PATCH";
        req.isApi = () => req.method === "POST";
        req.body = {};
        // Body Parsing Middleware
        if (req.headers["content-type"] === "application/json") {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk.toString();
            });
            req.on("end", () => {
                req.body = JSON.parse(body);
            });
        }
        else if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk.toString();
            });
            req.on("end", () => {
                req.body = new URLSearchParams(body);
            });
        }
    }
    function getContentType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case ".html":
                return "text/html";
            case ".js":
                return "application/javascript";
            case ".css":
                return "text/css";
            case ".json":
                return "application/json";
            case ".png":
                return "image/png";
            case ".jpg":
                return "image/jpeg";
            case ".gif":
                return "image/gif";
            default:
                return "application/octet-stream";
        }
    }
    function listen(port, callback, options = {}) {
        const server = options.http2
            ? http.createServer(options.http2Options, (req, res) => handleRequest(req, res))
            : http.createServer((req, res) => handleRequest(req, res));
        server.listen(port, callback);
    }
    function cors(options) {
        corsOptions = options;
    }
    function handleRequest(req, res) {
        const reqType = req.method || "GET";
        const reqUrl = req.url || "/";
        console.log(`Received request: ${reqType} ${reqUrl}`);
        const [path, queryString] = reqUrl.split("?");
        console.log(`Matching route for method: ${reqType}, url: ${path}`);
        const routeMatch = match(reqType, path);
        if (routeMatch) {
            const enhancedReq = req;
            const enhancedRes = res;
            enhancedReq.query = Object.fromEntries(new URLSearchParams(queryString || "").entries());
            enhancedReq.params = routeMatch.params;
            extendRequest(enhancedReq);
            extendResponse(enhancedRes);
            middlewares.forEach((middleware) => middleware(enhancedReq, enhancedRes, () => { }));
            routeMatch.handler(enhancedReq, enhancedRes);
        }
        else {
            console.log(`Route not found for: ${reqType} ${path}`);
            res.statusCode = 404;
            res.end("Not Found");
        }
    }
    return {
        use,
        get,
        post,
        delete: deleteRoute,
        put,
        patch,
        api,
        onWebSocket,
        listen,
        cors,
        serveStatic: () => { },
    };
}
module.exports = createSwiftServe;
