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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
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
        function errorHandler(err, req, res, next) {
            let statusCode = 500;
            let errorMessage = "Internal Server Error";
            if (err instanceof SyntaxError) {
                statusCode = 400;
                errorMessage = "Bad Request: Invalid JSON";
            }
            else if (err instanceof Error) {
                if (err.message.includes("Not Found")) {
                    statusCode = 404;
                    errorMessage = "Not Found: The requested resource could not be found";
                }
                else if (err.message.includes("Unauthorized")) {
                    statusCode = 401;
                    errorMessage =
                        "Unauthorized: You do not have permission to access this resource";
                }
            }
            res.status(statusCode).send(`
      <style>
      body {
        background-color: #333;
        width: 100vw;
        height: 100vh;
        color: #fff;
        font-family: 'Arial Black';
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .error-num {
        font-size: 8em;
      }
      .eye {
        background: #fff;
        border-radius: 50%;
        display: inline-block;
        height: 100px;
        position: relative;
        width: 100px;
      }
      .eye::after {
        background: #000;
        border-radius: 50%;
        bottom: 56.1px;
        content: '';
        height: 33px;
        position: absolute;
        right: 33px;
        width: 33px;
      }
      p {
        margin-bottom: 4em;
      }
      a {
        color: #fff;
        text-decoration: none;
        text-transform: uppercase;
      }
      a:hover {
        color: #d3d3d3;
      }
      </style>
      <div>
        <span class='error-num'>${statusCode}</span>
        <div class='eye'></div>
        <div class='eye'></div>
        <p class='sub-text'>${errorMessage}</p>
        <a href='/'>Go back</a>
      </div>`);
        }
        function wrapMiddleware(middleware) {
            return (req, res, next) => {
                try {
                    middleware(req, res, next);
                }
                catch (err) {
                    errorHandler(err, req, res, next);
                }
            };
        }
        // Wrap and add middleware
        middlewares.push(wrapMiddleware(middleware));
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
            res.setHeader("Content-Type", "text/html");
            res.end(data);
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
        req.params = {};
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
        const [path, queryString] = reqUrl.split("?");
        // Create enhanced request and response objects
        const enhancedReq = req;
        const enhancedRes = res;
        enhancedReq.query = Object.fromEntries(new URLSearchParams(queryString || "").entries());
        enhancedReq.params = {};
        extendRequest(enhancedReq);
        extendResponse(enhancedRes);
        // Execute middlewares and handle errors
        const executeMiddlewares = (index) => __awaiter(this, void 0, void 0, function* () {
            if (index < middlewares.length) {
                try {
                    yield middlewares[index](enhancedReq, enhancedRes, () => executeMiddlewares(index + 1));
                }
                catch (err) {
                    errorHandler(err, enhancedReq, enhancedRes, () => { });
                }
            }
            else {
                const routeMatch = match(reqType, path);
                if (routeMatch) {
                    enhancedReq.params = routeMatch.params;
                    routeMatch.handler(enhancedReq, enhancedRes);
                }
                else {
                    console.log(`Route not found for: ${reqType} ${path}`);
                    enhancedRes.status(404).send("Not Found");
                }
            }
        });
        executeMiddlewares(0);
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
function errorHandler(err, enhancedReq, enhancedRes, arg3) {
    return new Error(`${err}`);
}
module.exports = createSwiftServe;
