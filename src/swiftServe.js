"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var http = require("http");
var path = require("path");
var fs = require("fs");
function createSwiftServe() {
    var routes = {
        GET: [],
        POST: [],
        DELETE: [],
        PUT: [],
        PATCH: [],
    };
    var middlewares = [];
    var webSocketHandlers = [];
    var corsOptions = null;
    var staticFolderPath = null;
    function use(middleware) {
        function errorHandler(err, req, res, next) {
            var statusCode = 500;
            var errorMessage = "Internal Server Error";
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
            res.status(statusCode).send("\n      <style>\n      body {\n        background-color: #333;\n        width: 100vw;\n        height: 100vh;\n        color: #fff;\n        font-family: 'Arial Black';\n        text-align: center;\n        display: flex;\n        justify-content: center;\n        align-items: center;\n      }\n      .error-num {\n        font-size: 8em;\n      }\n      .eye {\n        background: #fff;\n        border-radius: 50%;\n        display: inline-block;\n        height: 100px;\n        position: relative;\n        width: 100px;\n      }\n      .eye::after {\n        background: #000;\n        border-radius: 50%;\n        bottom: 56.1px;\n        content: '';\n        height: 33px;\n        position: absolute;\n        right: 33px;\n        width: 33px;\n      }\n      p {\n        margin-bottom: 4em;\n      }\n      a {\n        color: #fff;\n        text-decoration: none;\n        text-transform: uppercase;\n      }\n      a:hover {\n        color: #d3d3d3;\n      }\n      </style>\n      <div>\n        <span class='error-num'>".concat(statusCode, "</span>\n        <div class='eye'></div>\n        <div class='eye'></div>\n        <p class='sub-text'>").concat(errorMessage, "</p>\n        <a href='/'>Go back</a>\n      </div>"));
        }
        function wrapMiddleware(middleware) {
            return function (req, res, next) {
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
            routes[method].push({ path: routePath, handler: handler });
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
    function api(Path, APIRequestType, version, handler) {
        if (APIRequestType === void 0) { APIRequestType = "POST"; }
        if (version === void 0) { version = 0; }
        addRoute(APIRequestType, "/api/v".concat(version).concat(Path), handler);
    }
    function onWebSocket(handler) {
        webSocketHandlers.push(handler);
    }
    function match(method, url) {
        var routesForMethod = routes[method];
        var _loop_1 = function (route) {
            var regex = new RegExp("^".concat(route.path.replace(/:[^\s/]+/g, "([^/]+)"), "$"));
            var match_1 = url.match(regex);
            if (match_1) {
                var params = route.path.match(/:([^\s/]+)/g) || [];
                var paramsObject_1 = {};
                params.forEach(function (param, index) {
                    paramsObject_1[param.substring(1)] = match_1[index + 1];
                });
                return { value: { handler: route.handler, params: paramsObject_1 } };
            }
        };
        for (var _i = 0, routesForMethod_1 = routesForMethod; _i < routesForMethod_1.length; _i++) {
            var route = routesForMethod_1[_i];
            var state_1 = _loop_1(route);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return null;
    }
    function extendResponse(res) {
        res.status = function (code) {
            res.statusCode = code;
            return res;
        };
        res.json = function (data) {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
        };
        res.send = function (data) {
            res.setHeader("Content-Type", "text/html");
            res.end(data);
        };
        res.sendFile = function (filePath) {
            var fullPath = path.resolve(filePath);
            fs.exists(fullPath, function (exists) {
                if (exists) {
                    fs.readFile(fullPath, function (err, data) {
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
        res.sendText = function (text) { return res.send(text); };
        res.redirect = function (url) {
            res.status(302).setHeader("Location", url);
            res.end();
        };
    }
    function extendRequest(req) {
        var urlObj = new URL(req.url || "", "http://".concat(req.headers.host));
        req.query = Object.fromEntries(Array.from(urlObj.searchParams.entries()).map(function (_a) {
            var key = _a[0], value = _a[1];
            return [
                key,
                value,
            ];
        }));
        req.params = {};
        req.isGet = function () { return req.method === "GET"; };
        req.isPost = function () { return req.method === "POST"; };
        req.isDelete = function () { return req.method === "DELETE"; };
        req.isPut = function () { return req.method === "PUT"; };
        req.isPatch = function () { return req.method === "PATCH"; };
        req.isApi = function () { return req.method === "POST"; };
        req.body = {};
        // Body Parsing Middleware
        if (req.headers["content-type"] === "application/json") {
            var body_1 = "";
            req.on("data", function (chunk) {
                body_1 += chunk.toString();
            });
            req.on("end", function () {
                req.body = JSON.parse(body_1);
            });
        }
        else if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
            var body_2 = "";
            req.on("data", function (chunk) {
                body_2 += chunk.toString();
            });
            req.on("end", function () {
                req.body = new URLSearchParams(body_2);
            });
        }
    }
    function getContentType(filePath) {
        var ext = path.extname(filePath).toLowerCase();
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
    function listen(port, callback, options) {
        if (options === void 0) { options = {}; }
        var server = options.http2
            ? http.createServer(options.http2Options, function (req, res) {
                return handleRequest(req, res);
            })
            : http.createServer(function (req, res) { return handleRequest(req, res); });
        server.listen(port, callback);
    }
    function cors(options) {
        corsOptions = options;
    }
    function handleRequest(req, res) {
        var _this = this;
        var reqType = req.method || "GET";
        var reqUrl = req.url || "/";
        var _a = reqUrl.split("?"), path = _a[0], queryString = _a[1];
        // Create enhanced request and response objects
        var enhancedReq = req;
        var enhancedRes = res;
        enhancedReq.query = Object.fromEntries(new URLSearchParams(queryString || "").entries());
        enhancedReq.params = {};
        extendRequest(enhancedReq);
        extendResponse(enhancedRes);
        // Execute middlewares and handle errors
        var executeMiddlewares = function (index) { return __awaiter(_this, void 0, void 0, function () {
            var err_1, routeMatch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(index < middlewares.length)) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, middlewares[index](enhancedReq, enhancedRes, function () {
                                return executeMiddlewares(index + 1);
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        errorHandler(err_1, enhancedReq, enhancedRes, function () { });
                        return [3 /*break*/, 4];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        routeMatch = match(reqType, path);
                        if (routeMatch) {
                            enhancedReq.params = routeMatch.params;
                            routeMatch.handler(enhancedReq, enhancedRes);
                        }
                        else {
                            console.log("Route not found for: ".concat(reqType, " ").concat(path));
                            enhancedRes.status(404).send("Not Found");
                        }
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        executeMiddlewares(0);
    }
    return {
        use: use,
        get: get,
        post: post,
        delete: deleteRoute,
        put: put,
        patch: patch,
        api: api,
        onWebSocket: onWebSocket,
        listen: listen,
        cors: cors,
        serveStatic: function () { },
    };
}
function errorHandler(err, enhancedReq, enhancedRes, arg3) {
    return new Error("".concat(err));
}
module.exports = createSwiftServe;
