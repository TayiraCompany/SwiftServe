"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRoute = addRoute;
const Attreg_1 = require("../Export/Attreg");
function addRoute(method, routePath, handler) {
    if (Attreg_1.routes[method]) {
        Attreg_1.routes[method].push({ path: routePath, handler });
    }
}
