"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.match = match;
const Attreg_1 = require("../Export/Attreg");
function match(method, url) {
    const routesForMethod = Attreg_1.routes[method];
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
