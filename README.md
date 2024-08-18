const createSwiftServe = require('swiftServe');
const WebSocket = require('ws');

// Create an instance of SwiftServe
const app = createSwiftServe();

// Middleware test
app.use(async (req, res, next) => {
  req.middlewareTest = 'Middleware Passed';
  await next();
});

// Route tests
app.get('/hello', async (req, res) => {
  res.send('Hello, World!');
});

app.post('/data', async (req, res) => {
  res.status(201).json({ received: true });
});

// CORS configuration
app.cors({
  origin: '*',
  methods: ['GET', 'POST'],
  headers: ['Content-Type'],
  credentials: true
});

app.get('/cors-test', async (req, res) => {
  res.json({ message: 'CORS Test Successful' });
});

// WebSocket setup
app.onWebSocket((ws, req) => {
  ws.on('message', (message) => {
    ws.send(`Received: ${message}`);
  });
});

// Start the server
app.listen(3000, { webSocket: true }, () => {
  console.log('Server is running on port 3000 with WebSocket support');

  // WebSocket client for testing
  const ws = new WebSocket('ws://localhost:3000');

  ws.on('open', () => {
    ws.send('Hello, WebSocket!');
  });

  ws.on('message', (message) => {
    console.log(message);  // Should output: Received: Hello, WebSocket!
  });
});