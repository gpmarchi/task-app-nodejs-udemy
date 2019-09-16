const express = require("express");

require("./db/mongoose");

const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const log = console.log;

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.disable("x-powered-by");

app.listen(port, () => {
  log(`Server is up on ${port}`);
});
