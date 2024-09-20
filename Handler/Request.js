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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRequest = handleRequest;
const Attreg_1 = require("../Export/Attreg");
const Request_1 = require("../Extend/Request");
const Response_1 = require("../Extend/Response");
const match_1 = require("../Function/match");
function handleRequest(req, res) {
    const reqType = req.method || "GET";
    const reqUrl = req.url || "/";
    const [path, queryString] = reqUrl.split("?");
    const enhancedReq = req;
    const enhancedRes = res;
    enhancedReq.query = queryString
        ? Object.fromEntries(new URLSearchParams(queryString).entries())
        : {};
    (0, Request_1.extendRequest)(enhancedReq);
    (0, Response_1.extendResponse)(enhancedRes);
    const executeMiddlewares = (index) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (index < Attreg_1.middlewares.length) {
                yield Attreg_1.middlewares[index](enhancedReq, enhancedRes, () => executeMiddlewares(index + 1));
            }
            else {
                const routeMatch = (0, match_1.match)(reqType, path);
                if (routeMatch) {
                    enhancedReq.params = routeMatch.params;
                    routeMatch.handler(enhancedReq, enhancedRes);
                }
                else {
                    renderErrorPage(404, enhancedRes);
                }
            }
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            const errorMessage = error.message || "Internal Server Error";
            renderErrorPage(statusCode, enhancedRes, errorMessage);
        }
    });
    function renderErrorPage(statusCode, res, errorMessage) {
        let errorTitle, errorDescription;
        switch (statusCode) {
            case 404:
                errorTitle = "404 - Page Not Found";
                errorDescription =
                    "The page you're looking for doesn't exist or has been moved.";
                break;
            case 500:
                errorTitle = "500 - Internal Server Error";
                errorDescription =
                    errorMessage || "Something went wrong on our server.";
                break;
            default:
                errorTitle = `${statusCode} - Unexpected Error`;
                errorDescription = errorMessage || "An unexpected error occurred.";
                break;
        }
        res.send.status(statusCode).send.Body(`
    <html>
      <head>
        <style>
          body {
            background-color: #1e1e1e;
            font-family: Arial, sans-serif;
            color: #fff;
            text-align: center;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          h1 {
            font-size: 5rem;
            margin: 0;
            color: #ff6666;
            animation: pulse 2s infinite;
          }
          h2 {
            font-size: 2rem;
            color: #e2e2e2;
            margin: 20px 0;
          }
          p {
            font-size: 1.2rem;
            color: #ccc;
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          .error-code {
            font-size: 10rem;
            font-weight: bold;
            color: #ff4444;
          }
          .glitch {
            color: #fff;
            position: relative;
            display: inline-block;
          }
          .glitch::before, .glitch::after {
            content: attr(data-text);
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            overflow: hidden;
            background: #1e1e1e;
            clip: rect(0, 900px, 0, 0);
            animation: glitch-skew 2s infinite linear;
          }
          .glitch::before {
            left: 2px;
            text-shadow: -2px 0 red;
            animation: glitch-anim-1 2s infinite linear;
          }
          .glitch::after {
            left: -2px;
            text-shadow: -2px 0 blue;
            animation: glitch-anim-2 2s infinite linear;
          }
          @keyframes glitch-anim-1 {
            0%, 100% { clip: rect(0, 900px, 0, 0); }
            50% { clip: rect(0, 900px, 200px, 0); }
          }
          @keyframes glitch-anim-2 {
            0%, 100% { clip: rect(200px, 900px, 900px, 0); }
            50% { clip: rect(0, 900px, 100px, 0); }
          }
        </style>
      </head>
      <body>
        <div>
          <h1 class="error-code glitch" data-text="${statusCode}">${statusCode}</h1>
          <h2 class="glitch" data-text="${errorTitle}">${errorTitle}</h2>
          <p>${errorDescription}</p>
        </div>
      </body>
    </html>
  `);
    }
    executeMiddlewares(0);
}
