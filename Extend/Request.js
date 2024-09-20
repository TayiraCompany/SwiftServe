"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendRequest = extendRequest;
function extendRequest(req) {
    req.isGet = () => req.method === "GET";
    req.isPost = () => req.method === "POST";
    req.isDelete = () => req.method === "DELETE";
    req.isPut = () => req.method === "PUT";
    req.isPatch = () => req.method === "PATCH";
    req.isApi = () => { var _a; return ((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith("/api")) || false; };
    req.query = req.query || {};
    req.params = req.params || {};
    req.cookies = req.cookies || {};
    req.body = {};
    req.checkers = {
        isOnline: () => {
            const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
            return !/^(127\.0\.0\.1|::1|localhost)$/.test(ip);
        },
        isMobile: () => isMobile(req.headers["user-agent"] || ""),
        validateBody: (schema) => validateBody(req.body, schema),
        isAuthorized: (role) => {
            var _a;
            return isAuthorized(((_a = req.headers["authorization"]) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "")) || "", role);
        },
        isValidUrl: (urlString) => isValidUrl(urlString),
        hasQueryParam: (param) => param in req.query,
        checkRateLimit: (rateLimit) => checkRateLimit(req, rateLimit),
        isSecure: () => {
            if (req.headers["x-forwarded-proto"] === "https") {
                return true;
            }
            return false;
        },
    };
    req.getCookie = (name) => req.cookies[name];
    // Function to check if the user agent is mobile
    function isMobile(userAgent) {
        return /Mobi|Android|iPad|iPhone|iPod/i.test(userAgent);
    }
    function validateBody(body, schema) {
        return schema(body);
    }
    function isAuthorized(token, role) {
        return token === "valid_token" && role === "admin";
    }
    function isValidUrl(urlString) {
        try {
            new URL(urlString);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    function checkRateLimit(req, rateLimit) {
        const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        const rateLimitStore = {};
        if (!rateLimitStore[ip]) {
            rateLimitStore[ip] = { count: 1, lastRequest: Date.now() };
            return true;
        }
        const currentTime = Date.now();
        const windowStart = rateLimitStore[ip].lastRequest;
        if (currentTime - windowStart > rateLimit.windowMs) {
            rateLimitStore[ip] = { count: 1, lastRequest: currentTime };
            return true;
        }
        if (rateLimitStore[ip].count >= rateLimit.limit) {
            return false;
        }
        rateLimitStore[ip].count++;
        return true;
    }
    req.log = (message) => {
        const method = req.method || "UNKNOWN";
        const url = req.url || "UNKNOWN";
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${method} ${url} - ${message}`);
    };
    req.startTime = Date.now();
    req.locale = req.headers["accept-language"] || "en";
    req.getCustomHeader = (name) => {
        const header = req.headers[name.toLowerCase()];
        if (Array.isArray(header)) {
            return header[0];
        }
        return header;
    };
    req.getClientIP = () => {
        return (req.headers["x-forwarded-for"] ||
            req.connection.remoteAddress ||
            "")
            .split(",")[0]
            .trim();
    };
    req.getContentLength = () => req.headers["content-length"]
        ? parseInt(req.headers["content-length"], 10)
        : undefined;
    req.getHost = () => req.headers["host"];
    req.getReferer = () => req.headers["referer"];
    req.getUserAgent = () => req.headers["user-agent"];
    req.hasHeader = (name) => name.toLowerCase() in req.headers;
    req.getRequestTime = () => new Date().toISOString();
    req.parseCookies = () => {
        const cookieHeader = req.headers["cookie"];
        if (!cookieHeader)
            return {};
        return cookieHeader
            .split(";")
            .reduce((cookies, cookie) => {
            const [name, value] = cookie.split("=").map((c) => c.trim());
            cookies[name] = value;
            return cookies;
        }, {});
    };
    req.getRequestTime = () => req.method || "UNKNOWN";
}
