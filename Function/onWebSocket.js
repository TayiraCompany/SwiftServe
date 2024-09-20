"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onWebSocket = onWebSocket;
const Attreg_1 = require("../Export/Attreg");
function onWebSocket(handler) {
    Attreg_1.webSocketHandlers.push(handler);
}
