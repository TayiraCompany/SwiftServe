"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendResponse = extendResponse;
const Attreg_1 = require("../Export/Attreg");
const Module_Export_1 = require("../Module_Export");
function extendResponse(res) {
    const originalSetHeader = res.setHeader;
    res.send = {
        status: (code) => {
            res.statusCode = code;
            return res;
        },
        json: (data) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
        },
        jsonp: (data) => {
            const callback = res.getQuery("callback");
            if (callback) {
                res.setHeader("Content-Type", "application/javascript");
                res.end(`${callback}(${JSON.stringify(data)})`);
            }
            else {
                res.send.json(data);
            }
        },
        Body: (data) => {
            res.setHeader("Content-Type", "text/html");
            res.end(data);
        },
        File: (filePath) => {
            const fullPath = Module_Export_1.path.resolve(filePath);
            Module_Export_1.fs.exists(fullPath, (exists) => {
                if (exists) {
                    Module_Export_1.fs.readFile(fullPath, (err, data) => {
                        if (err) {
                            res.send.Error(500, "Internal Server Error", "");
                        }
                        else {
                            res.setHeader("Content-Type", (0, Attreg_1.getContentType)(fullPath));
                            res.end(data);
                        }
                    });
                }
                else {
                    res.send.Error(404, "Not Found", "");
                }
            });
        },
        Text: (text) => {
            res.send.Body(text);
        },
        Xml: (xml) => {
            res.setHeader("Content-Type", "application/xml");
            res.end(xml);
        },
        MimeType: (data, mimeType) => {
            res.setHeader("Content-Type", mimeType);
            res.end(data);
        },
        Error: (code, message, btnMsg) => {
            res.send.status(code);
            res.send.Body(`
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background-color: #f4f4f4;
                color: #333;
              }
              .error-container {
                text-align: center;
                padding: 20px;
                border-radius: 8px;
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .error-code {
                font-size: 72px;
                font-weight: bold;
                color: #e74c3c;
              }
              .error-message {
                font-size: 24px;
                margin: 20px 0;
              }
              .error-description {
                font-size: 16px;
                color: #555;
              }
              .back-link {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 20px;
                font-size: 16px;
                color: #fff;
                background-color: #3498db;
                text-decoration: none;
                border-radius: 5px;
                transition: background-color 0.3s;
              }
              .back-link:hover {
                background-color: #2980b9;
              }
            </style>
          </head>
          <body>
            <div class="error-container">
              <div class="error-code">${code}</div>
              <div class="error-message">${message}</div>
              <div class="error-description">
                Oops! Something went wrong. Please try again later.
              </div>
              <a href="javascript:void" onclick="${!btnMsg && "history.back()"} ${btnMsg && "location.reload()"} " class="back-link">${btnMsg ? btnMsg : "BACK"}</a>
            </div>
          </body>
        </html>
        `);
        },
        Encrypted: (data, encryptionKey) => {
            const cipher = Module_Export_1.crypto.createCipheriv("aes-256-cbc", Buffer.from(encryptionKey), Buffer.alloc(16, 0));
            let encrypted = cipher.update(data);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            res.send.MimeType(encrypted, "application/octet-stream");
        },
    };
    res.getQuery = (name) => {
        const url = new URL(res.req.url, `http://${res.req.headers.host}`);
        return url.searchParams.get(name) || undefined;
    };
    res.setHeader = (key, value) => {
        originalSetHeader.call(res, key, value);
        return res;
    };
    res.Cookie = {
        set: (name, value, options = {}) => {
            let cookie = `${name}=${encodeURIComponent(value)}`;
            if (options.maxAge) {
                cookie += `; Max-Age=${options.maxAge}`;
            }
            if (options.httpOnly) {
                cookie += `; HttpOnly`;
            }
            res.setHeader("Set-Cookie", cookie);
            return res;
        },
        clear: (name) => {
            res.setHeader("Set-Cookie", `${name}=; Max-Age=0; HttpOnly`);
            return res;
        },
    };
    res.setCacheControl = (value) => {
        res.setHeader("Cache-Control", value);
        return res;
    };
    res.redirect = (url) => {
        res.send.status(302);
        res.setHeader("Location", url);
        res.end();
    };
}
