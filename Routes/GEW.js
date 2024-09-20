"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = get;
exports.post = post;
exports.patch = patch;
exports.put = put;
exports.api = api;
exports.deleteRoute = deleteRoute;
exports.use = use;
const Attreg_1 = require("../Export/Attreg");
const AddRoute_1 = require("../Function/AddRoute");
const Error_1 = require("../Handler/Error");
function get(routePath, handler) {
    (0, AddRoute_1.addRoute)("GET", routePath, handler);
}
function use(middleware) {
    function wrapMiddleware(middleware) {
        return (req, res, next) => {
            try {
                middleware(req, res, next);
            }
            catch (err) {
                (0, Error_1.errorHandler)(err, req, res, next);
            }
        };
    }
    // Wrap and add middleware
    Attreg_1.middlewares.push(wrapMiddleware(middleware));
}
function post(routePath, handler) {
    (0, AddRoute_1.addRoute)("POST", routePath, handler);
}
function deleteRoute(routePath, handler) {
    (0, AddRoute_1.addRoute)("DELETE", routePath, handler);
}
function put(routePath, handler) {
    (0, AddRoute_1.addRoute)("PUT", routePath, handler);
}
function patch(routePath, handler) {
    (0, AddRoute_1.addRoute)("PATCH", routePath, handler);
}
function api(Path, APIRequestType = "POST", version = 0, handler) {
    (0, AddRoute_1.addRoute)(APIRequestType, `/api/v${version}${Path}`, handler);
}
