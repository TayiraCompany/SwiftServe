"use strict";
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
        middlewares.push(middleware);
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
            var decodedData = decodeURIComponent(data);
            res.setHeader("Content-Type", "text/html");
            res.end(decodedData);
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
        req.params = {}; // تعيين params ككائن فارغ بشكل افتراضي
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
        var reqType = req.method || "GET";
        var reqUrl = req.url || "/";
        console.log("Received request: ".concat(reqType, " ").concat(reqUrl));
        var _a = reqUrl.split("?"), path = _a[0], queryString = _a[1];
        console.log("Matching route for method: ".concat(reqType, ", url: ").concat(path));
        var routeMatch = match(reqType, path);
        if (routeMatch) {
            var enhancedReq_1 = req;
            var enhancedRes_1 = res;
            enhancedReq_1.query = Object.fromEntries(new URLSearchParams(queryString || "").entries());
            enhancedReq_1.params = routeMatch.params;
            extendRequest(enhancedReq_1);
            extendResponse(enhancedRes_1);
            middlewares.forEach(function (middleware) {
                return middleware(enhancedReq_1, enhancedRes_1, function () { });
            });
            routeMatch.handler(enhancedReq_1, enhancedRes_1);
        }
        else {
            console.log("Route not found for: ".concat(reqType, " ").concat(path));
            res.statusCode = 404;
            res.end("Not Found");
        }
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
module.exports = createSwiftServe;
