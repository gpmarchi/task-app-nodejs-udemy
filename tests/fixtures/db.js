const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../../src/models/user");
const Task = require("../../src/models/task");
const Project = require("../../src/models/project");

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

const projectOneId = new mongoose.Types.ObjectId();
const projectTwoId = new mongoose.Types.ObjectId();
const projectThreeId = new mongoose.Types.ObjectId();
const projectFourId = new mongoose.Types.ObjectId();
const projectFiveId = new mongoose.Types.ObjectId();
const projectSixId = new mongoose.Types.ObjectId();
const projectSevenId = new mongoose.Types.ObjectId();

const testProjectOne = {
  _id: projectOneId,
  name: "First project",
  owner: testUserOne._id,
  ancestor: null,
  children: [projectTwoId]
};

const testProjectTwo = {
  _id: projectTwoId,
  name: "Second project",
  owner: testUserOne._id,
  ancestor: projectOneId,
  children: []
};

const testProjectThree = {
  _id: projectThreeId,
  name: "Third project",
  owner: testUserTwo._id,
  ancestor: null,
  children: []
};

const testProjectFive = {
  _id: projectFiveId,
  name: "Fifth project",
  owner: testUserTwo._id,
  ancestor: projectFourId,
  children: []
};

const testProjectSix = {
  _id: projectSixId,
  name: "Sixth project",
  owner: testUserTwo._id,
  ancestor: projectFourId,
  children: []
};

const testProjectFour = {
  _id: projectFourId,
  name: "Fourth project",
  owner: testUserTwo._id,
  ancestor: null,
  children: [testProjectFive._id, testProjectSix._id]
};

const testProjectSeven = {
  _id: projectSevenId,
  name: "Seventh project",
  owner: testUserOne._id,
  ancestor: null,
  children: []
};

const testTaskOne = {
  _id: new mongoose.Types.ObjectId(),
  description: "First task",
  completed: false,
  owner: testUserOne._id,
  project: testProjectOne._id
};

const testTaskTwo = {
  _id: new mongoose.Types.ObjectId(),
  description: "Second task",
  completed: true,
  owner: testUserOne._id,
  project: testProjectOne._id
};

const testTaskThree = {
  _id: new mongoose.Types.ObjectId(),
  description: "Third task",
  completed: true,
  owner: testUserTwo._id,
  project: testProjectThree._id
};

const testTaskFour = {
  _id: new mongoose.Types.ObjectId(),
  description: "Fourth task",
  completed: false,
  owner: testUserOne._id,
  project: testProjectTwo._id
};

const setupDatabase = async () => {
  await User.deleteMany();
  await Project.deleteMany();
  await Task.deleteMany();
  await new User(testAdminUser).save();
  await new User(testUserOne).save();
  await new User(testUserTwo).save();
  await new Project(testProjectOne).save();
  await new Project(testProjectTwo).save();
  await new Project(testProjectThree).save();
  await new Project(testProjectFour).save();
  await new Project(testProjectFive).save();
  await new Project(testProjectSix).save();
  await new Project(testProjectSeven).save();
  await new Task(testTaskOne).save();
  await new Task(testTaskTwo).save();
  await new Task(testTaskThree).save();
  await new Task(testTaskFour).save();
};

module.exports = {
  testAdminUser,
  testUserOne,
  testUserTwo,
  testProjectOne,
  testProjectTwo,
  testProjectThree,
  testProjectFour,
  testProjectFive,
  testProjectSix,
  testProjectSeven,
  testTaskOne,
  testTaskTwo,
  testTaskThree,
  testTaskFour,
  setupDatabase
};
