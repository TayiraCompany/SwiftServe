const http = require("http");
const http2 = require("http2");
const path = require("path");
const fs = require("fs").promises;
const WebSocket = require("ws");

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

  function use(middleware) {
    middlewares.push(middleware);
  }

  function addRoute(method, routePath, handler) {
    routes[method].push({ path: routePath, handler });
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
    if (!routes[method]) {
      throw new Error(`Unsupported method: ${method}`);
    }

    const routesForMethod = routes[method];
    for (const route of routesForMethod) {
      if (url === route.path) {
        return route;
      }
    }
    return null;
  }

  function parseQueryParams(url) {
    const queryString = url.split("?")[1] || "";
    return new URLSearchParams(queryString);
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
      const HTMDataContsruction = `
        <style>
        body {
          background: #ccc;
          color: #222;
        }
        </style>
        <body>
        ${data}
        </body>
        `;
      res.end(HTMDataContsruction);
    };

    res.sendFile = async (filePath) => {
      try {
        const fullPath = path.resolve(filePath);
        const data = await fs.readFile(fullPath);
        res.setHeader("Content-Type", getContentType(fullPath));
        res.send(data);
      } catch (err) {
        res.status(500).send("Internal Server Error");
      }
    };

    res.sendText = (text) => res.send(text);

    res.redirect = (url) => {
      res.status(302).setHeader("Location", url);
      res.end();
    };
  }

  function extendRequest(req) {
    req.isGet = () => req.method === "GET";
    req.isPost = () => req.method === "POST";
    req.isDelete = () => req.method === "DELETE";
    req.isPut = () => req.method === "PUT";
    req.isPatch = () => req.method === "PATCH";
    req.isApi = () => req.method === "POST";
    req.query = parseQueryParams(req.url);
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

  async function listen(port, callback, options = {}) {
    const server = options.http2
      ? http2.createSecureServer(options.http2Options, (req, res) =>
          handleRequest(req, res)
        )
      : http.createServer((req, res) => handleRequest(req, res));

    if (options.webSocket) {
      const wss = new WebSocket.Server({ server });
      wss.on("connection", (ws, req) => {
        webSocketHandlers.forEach((handler) => handler(ws, req));
      });
    }

    server.listen(port, callback);
  }

  async function handleRequest(req, res) {
    extendResponse(res);
    extendRequest(req);

    if (corsOptions) {
      applyCors(req, res);
    }

    let i = 0;
    const next = async () => {
      if (i < middlewares.length) {
        await middlewares[i++](req, res, next);
      } else {
        const route = match(req.method, req.url);
        if (route) {
          await route.handler(req, res);
        } else {
          res.status(404).send("Not Found");
        }
      }
    };

    await next();
  }

  function applyCors(req, res) {
    const origin = req.headers.origin;
    if (corsOptions.origin === "*" || corsOptions.origin.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    }
    if (corsOptions.methods) {
      res.setHeader(
        "Access-Control-Allow-Methods",
        corsOptions.methods.join(",")
      );
    }
    if (corsOptions.headers) {
      res.setHeader(
        "Access-Control-Allow-Headers",
        corsOptions.headers.join(",")
      );
    }
    if (corsOptions.credentials) {
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      res.status(204).end();
    }
  }

  function cors(options) {
    corsOptions = options;
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
  };
}

module.exports = createSwiftServe;
