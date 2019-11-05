const express = require("express");
require("./db/mongoose");
const authRouter = require("./routers/auth");
const userRouter = require("./routers/user");
const avatarRouter = require("./routers/avatar");
const adminRouter = require("./routers/admin");
const taskRouter = require("./routers/task");
const projectRouter = require("./routers/project");

const app = express();

app.use(express.json());
app.use(authRouter);
app.use(userRouter);
app.use(avatarRouter);
app.use(adminRouter);
app.use(taskRouter);
app.use(projectRouter);

app.disable("x-powered-by");

module.exports = app;
