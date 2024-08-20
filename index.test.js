const createSwiftServe = require("./src/swiftServe");
const app = createSwiftServe();

// Middleware that will throw an error
app.use(async (req, res, next) => {
  console.log(`YOU REQUESTED: ${req.url}`);
  await next();
});

// Define a route
app.get("/hello/:p2", (req, res) => {
  const { p = 0, s = 1 } = req.query;
  const { p2 } = req.params;
  res.send(
    `Hello, World! , ${p} + ${s} = ${Number(p) + Number(s)} <br/> ${p2}`
  );
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
