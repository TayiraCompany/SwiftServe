# Default

`
const createSwiftServe = require("swiftserve-pkg");
const app = createSwiftServe();

app.use(async (req, res, next) => {
  await next();
});

app.get("/hello/:p2", (req, res) => {
  const { p = 0, s = 1 } = req.query;
  const { p2 } = req.params;
  res.send(
    `Hello, World! , ${p} + ${s} = ${Number(p) + Number(s)} <br/> ${p2}`
  );
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
`