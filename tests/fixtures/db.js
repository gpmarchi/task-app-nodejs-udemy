const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../../src/models/user");
const Task = require("../../src/models/task");

const testAdminUserId = new mongoose.Types.ObjectId();
const testAdminUser = {
  _id: testAdminUserId,
  name: "admin",
  email: "admin@test.com",
  password: "56what!!",
  tokens: [
    { token: jwt.sign({ _id: testAdminUserId }, process.env.JWT_SIGN_KEY) }
  ],
  admin: true
};

const testUserOneId = new mongoose.Types.ObjectId();
const testUserOne = {
  _id: testUserOneId,
  name: "Mike",
  email: "mike@example.com",
  password: "56what!!",
  tokens: [
    { token: jwt.sign({ _id: testUserOneId }, process.env.JWT_SIGN_KEY) }
  ]
};

const testUserTwoId = new mongoose.Types.ObjectId();
const testUserTwo = {
  _id: testUserTwoId,
  name: "Jen",
  email: "jen@example.com",
  password: "test@456!!",
  tokens: [
    { token: jwt.sign({ _id: testUserTwoId }, process.env.JWT_SIGN_KEY) }
  ]
};

const testTaskOne = {
  _id: new mongoose.Types.ObjectId(),
  description: "First task",
  completed: false,
  owner: testUserOne._id
};

const testTaskTwo = {
  _id: new mongoose.Types.ObjectId(),
  description: "Second task",
  completed: true,
  owner: testUserOne._id
};

const testTaskThree = {
  _id: new mongoose.Types.ObjectId(),
  description: "Third task",
  completed: true,
  owner: testUserTwo._id
};

const setupDatabase = async () => {
  await User.deleteMany();
  await Task.deleteMany();
  await new User(testAdminUser).save();
  await new User(testUserOne).save();
  await new User(testUserTwo).save();
  await new Task(testTaskOne).save();
  await new Task(testTaskTwo).save();
  await new Task(testTaskThree).save();
};

module.exports = {
  testAdminUser,
  testUserOne,
  testUserTwo,
  testTaskOne,
  testTaskTwo,
  testTaskThree,
  setupDatabase
};
