import * as http from "http";
import * as path from "path";
import * as fs from "fs";
import * as WebSocket from "ws";
import * as url from "url";

type RequestHandler = (req: EnhancedRequest, res: EnhancedResponse) => void;
type Middleware = (
  req: EnhancedRequest,
  res: EnhancedResponse,
  next: () => void
) => void;
type WebSocketHandler = (ws: WebSocket, req: http.IncomingMessage) => void;

interface EnhancedRequest extends http.IncomingMessage {
  query: { [key: string]: string };
  body: any;
  params: { [key: string]: string };
  isGet(): boolean;
  isPost(): boolean;
  isDelete(): boolean;
  isPut(): boolean;
  isPatch(): boolean;
  isApi(): boolean;
}

interface EnhancedResponse extends http.ServerResponse {
  status(code: number): this;
  json(data: any): void;
  send(data: string): void;
  sendFile(filePath: string): void;
  sendText(text: string): void;
  redirect(url: string): void;
}

interface CorsOptions {
  origin: string | string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
}

interface SwiftServe {
  use(middleware: Middleware): void;
  get(routePath: string, handler: RequestHandler): void;
  post(routePath: string, handler: RequestHandler): void;
  delete(routePath: string, handler: RequestHandler): void;
  put(routePath: string, handler: RequestHandler): void;
  patch(routePath: string, handler: RequestHandler): void;
  api(
    Path: string,
    APIRequestType?: string,
    version?: number,
    handler?: RequestHandler
  ): void;
  onWebSocket(handler: WebSocketHandler): void;
  listen(
    port: number,
    callback: () => void,
    options?: { http2?: boolean; http2Options?: any; webSocket?: boolean }
  ): void;
  cors(options: CorsOptions): void;
  serveStatic(folderPath: string): void;
}

function createSwiftServe(): SwiftServe {
  const routes: Record<string, { path: string; handler: RequestHandler }[]> = {
    GET: [],
    POST: [],
    DELETE: [],
    PUT: [],
    PATCH: [],
  };
  const middlewares: Middleware[] = [];
  let webSocketHandlers: WebSocketHandler[] = [];
  let corsOptions: CorsOptions | null = null;
  let staticFolderPath: string | null = null;

  function use(middleware: Middleware) {
    function errorHandler(
      err: unknown,
      req: EnhancedRequest,
      res: EnhancedResponse,
      next: () => void
    ) {
      let statusCode = 500;
      let errorMessage = "Internal Server Error";

      if (err instanceof SyntaxError) {
        statusCode = 400;
        errorMessage = "Bad Request: Invalid JSON";
      } else if (err instanceof Error) {
        if (err.message.includes("Not Found")) {
          statusCode = 404;
          errorMessage = "Not Found: The requested resource could not be found";
        } else if (err.message.includes("Unauthorized")) {
          statusCode = 401;
          errorMessage =
            "Unauthorized: You do not have permission to access this resource";
        }
      }

      res.status(statusCode).send(`
      <style>
      body {
        background-color: #333;
        width: 100vw;
        height: 100vh;
        color: #fff;
        font-family: 'Arial Black';
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .error-num {
        font-size: 8em;
      }
      .eye {
        background: #fff;
        border-radius: 50%;
        display: inline-block;
        height: 100px;
        position: relative;
        width: 100px;
      }
      .eye::after {
        background: #000;
        border-radius: 50%;
        bottom: 56.1px;
        content: '';
        height: 33px;
        position: absolute;
        right: 33px;
        width: 33px;
      }
      p {
        margin-bottom: 4em;
      }
      a {
        color: #fff;
        text-decoration: none;
        text-transform: uppercase;
      }
      a:hover {
        color: #d3d3d3;
      }
      </style>
      <div>
        <span class='error-num'>${statusCode}</span>
        <div class='eye'></div>
        <div class='eye'></div>
        <p class='sub-text'>${errorMessage}</p>
        <a href='/'>Go back</a>
      </div>`);
    }

    function wrapMiddleware(middleware: Middleware) {
      return (
        req: EnhancedRequest,
        res: EnhancedResponse,
        next: () => void
      ) => {
        try {
          middleware(req, res, next);
        } catch (err) {
          errorHandler(err, req, res, next);
        }
      };
    }

    // Wrap and add middleware
    middlewares.push(wrapMiddleware(middleware));
  }

  function addRoute(
    method: string,
    routePath: string,
    handler: RequestHandler
  ) {
    if (routes[method]) {
      routes[method].push({ path: routePath, handler });
    }
  }

  function get(routePath: string, handler: RequestHandler) {
    addRoute("GET", routePath, handler);
  }

  function post(routePath: string, handler: RequestHandler) {
    addRoute("POST", routePath, handler);
  }

  function deleteRoute(routePath: string, handler: RequestHandler) {
    addRoute("DELETE", routePath, handler);
  }

  function put(routePath: string, handler: RequestHandler) {
    addRoute("PUT", routePath, handler);
  }

  function patch(routePath: string, handler: RequestHandler) {
    addRoute("PATCH", routePath, handler);
  }

  function api(
    Path: string,
    APIRequestType: string = "POST",
    version: number = 0,
    handler: RequestHandler
  ) {
    addRoute(APIRequestType, `/api/v${version}${Path}`, handler);
  }

  function onWebSocket(handler: WebSocketHandler) {
    webSocketHandlers.push(handler);
  }

  function match(method: string, url: string) {
    const routesForMethod = routes[method];
    for (const route of routesForMethod) {
      const regex = new RegExp(
        `^${route.path.replace(/:[^\s/]+/g, "([^/]+)")}$`
      );
      const match = url.match(regex);
      if (match) {
        const params = route.path.match(/:([^\s/]+)/g) || [];
        const paramsObject: { [key: string]: string } = {};
        params.forEach((param, index) => {
          paramsObject[param.substring(1)] = match[index + 1];
        });
        return { handler: route.handler, params: paramsObject };
      }
    }
    return null;
  }

  function extendResponse(res: EnhancedResponse) {
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };

    res.json = (data: any) => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    };

    res.send = (data: string) => {
      res.setHeader("Content-Type", "text/html");
      res.end(data);
    };

    res.sendFile = (filePath: string) => {
      const fullPath = path.resolve(filePath);
      fs.exists(fullPath, (exists) => {
        if (exists) {
          fs.readFile(fullPath, (err, data) => {
            if (err) {
              res.status(500).send("Internal Server Error");
            } else {
              res.setHeader("Content-Type", getContentType(fullPath));
              res.end(data);
            }
          });
        } else {
          res.status(404).send("Not Found");
        }
      });
    };

    res.sendText = (text: string) => res.send(text);

    res.redirect = (url: string) => {
      res.status(302).setHeader("Location", url);
      res.end();
    };
  }

  function extendRequest(req: EnhancedRequest) {
    const urlObj = new URL(req.url || "", `http://${req.headers.host}`);
    req.query = Object.fromEntries(
      Array.from(urlObj.searchParams.entries()).map(([key, value]) => [
        key,
        value,
      ])
    );
    req.params = {};
    req.isGet = () => req.method === "GET";
    req.isPost = () => req.method === "POST";
    req.isDelete = () => req.method === "DELETE";
    req.isPut = () => req.method === "PUT";
    req.isPatch = () => req.method === "PATCH";
    req.isApi = () => req.method === "POST";
    req.body = {};

    // Body Parsing Middleware
    if (req.headers["content-type"] === "application/json") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        req.body = JSON.parse(body);
      });
    } else if (
      req.headers["content-type"] === "application/x-www-form-urlencoded"
    ) {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        req.body = new URLSearchParams(body);
      });
    }
  }

  function getContentType(filePath: string) {
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

  function listen(
    port: number,
    callback: () => void,
    options: { http2?: boolean; http2Options?: any; webSocket?: boolean } = {}
  ) {
    const server = options.http2
      ? http.createServer(options.http2Options, (req: any, res: any) =>
          handleRequest(req, res)
        )
      : http.createServer((req, res) => handleRequest(req, res));

    server.listen(port, callback);
  }

  function cors(options: CorsOptions) {
    corsOptions = options;
  }

  function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const reqType = req.method || "GET";
    const reqUrl = req.url || "/";
    const [path, queryString] = reqUrl.split("?");

    // Create enhanced request and response objects
    const enhancedReq: EnhancedRequest = req as EnhancedRequest;
    const enhancedRes: EnhancedResponse = res as EnhancedResponse;

    enhancedReq.query = Object.fromEntries(
      new URLSearchParams(queryString || "").entries()
    );
    enhancedReq.params = {};

    extendRequest(enhancedReq);
    extendResponse(enhancedRes);

    // Execute middlewares and handle errors
    const executeMiddlewares = async (index: number) => {
      if (index < middlewares.length) {
        try {
          await middlewares[index](enhancedReq, enhancedRes, () =>
            executeMiddlewares(index + 1)
          );
        } catch (err: any) {
          errorHandler(err, enhancedReq, enhancedRes, () => {});
        }
      } else {
        const routeMatch = match(reqType, path);
        if (routeMatch) {
          enhancedReq.params = routeMatch.params;
          routeMatch.handler(enhancedReq, enhancedRes);
        } else {
          console.log(`Route not found for: ${reqType} ${path}`);
          enhancedRes.status(404).send("Not Found");
        }
      }
    };

    executeMiddlewares(0);
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
    serveStatic: () => {},
  };
}

export = createSwiftServe;
function errorHandler(
  err: any,
  enhancedReq: EnhancedRequest,
  enhancedRes: EnhancedResponse,
  arg3: () => void
) {
  return new Error(`${err}`);
}
