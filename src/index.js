const app = require("./app");

const port = process.env.PORT;
const log = console.log;

app.listen(port, () => {
  log(`Server is up on ${port}`);
});
