# SwiftServe

SwiftServe is a lightweight and fast framework for building web applications and APIs using 
TypeScript and Node.js. It offers a clean and user-friendly API for developing applications 
with advanced support for HTTP and WebSocket.

# Quick Start

Here's a simple example of how to use SwiftServe to create an HTTP server that serves a basic HTML page:
page:
```
const createSwiftServe = require("swiftserve-pkg");
const app = createSwiftServe();

app.use(async (req, res, next) => {
  // Middleware function to execute operations before handling requests
  await next();
});

app.get("/", (req, res) => {
  res.send(`Hello, World!`);
});

app.listen(3000, () => {
  console.log("🚀 Server is running on port 3000");
});
```

# Key Features

* Ease of Use: With a simple API, you can quickly start developing your applications.

* WebSocket Support: Easily create WebSocket-based applications.

* Extensibility: Use Middleware to add additional functionality to your application effortlessly.

* Flexibility: Full support for various HTTP methods like GET, POST, PUT, DELETE, PATCH, API.

# Installation

```npm install swiftserve-pkg```

# Usage Examples
## Creating a Simple Endpoint:

```
app.get("/welcome", (req, res) => {
  res.send("Welcome to SwiftServe!");
});
```

## Using WebSocket:

```
app.onWebSocket((ws, req) => {
  ws.on("message", (message) => {
    console.log("Received message:", message);
    ws.send("Your message has been received!");
  });
});
```

## Contributing
We welcome contributions! If you'd like to improve SwiftServe, please open an issue or submit a pull 
request on GitHub.


This version provides a clear and concise introduction to using SwiftServe, making it easy for developers to get started. You can further customize this README to suit your project's specific needs.