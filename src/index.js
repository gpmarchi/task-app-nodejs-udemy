const app = require("./app");

const port = process.env.PORT;

app.listen(port, () => {
  log(`Server is up on ${port}`);
});
