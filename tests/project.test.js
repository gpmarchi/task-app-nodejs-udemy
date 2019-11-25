const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");
const Project = require("../src/models/project");
const Task = require("../src/models/task");
const {
  testUserOne,
  testUserTwo,
  testProjectOne,
  testProjectTwo,
  testProjectThree,
  testProjectFour,
  testProjectFive,
  testProjectSeven,
  setupDatabase
} = require("./fixtures/db");

beforeEach(setupDatabase);

// CREATE ---------------------------------------------------------------------

test("Should create project for authenticated user", async () => {
  const response = await request(app)
    .post("/projects")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: "New project"
    })
    .expect(201);

  const project = await Project.findById(response.body._id);
  expect(project).not.toBeNull();
});

test("Should create new child project and update children ref on ancestor", async () => {
  const response = await request(app)
    .post("/projects")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: "New child project",
      ancestor: testProjectOne._id
    })
    .expect(201);

  const ancestor = await Project.findById(testProjectOne._id);
  await ancestor.populate({ path: "subprojects" }).execPopulate();
  const newProject = await Project.findById(response.body._id);
  expect(newProject).not.toBeNull();
  expect(newProject.ancestor).toEqual(testProjectOne._id);
  expect(ancestor.subprojects).toEqual(
    expect.arrayContaining([expect.objectContaining({ _id: newProject._id })])
  );
});

test("Should not create project with invalid data", async () => {
  await request(app)
    .post("/projects")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: ""
    })
    .expect(400);
});

test("Should not create project with invalid ancestor id", async () => {
  await request(app)
    .post("/projects")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: "Test Project",
      ancestor: "oi2u34oiu23o4iu2o3u4"
    })
    .expect(400);
});

test("Should not create project with inexistent ancestor id", async () => {
  await request(app)
    .post("/projects")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: "Test Project",
      ancestor: mongoose.Types.ObjectId("5d7e3a11ed8c380e25b81839")
    })
    .expect(404);
});

test("Should not create project if unauthenticated", async () => {
  await request(app)
    .post("/projects")
    .send({
      name: "New project",
      ancestor: testProjectOne._id,
      children: []
    })
    .expect(401);
});

test("Should not create project for another user", async () => {
  const response = await request(app)
    .post("/projects")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: "New project",
      owner: testUserTwo._id,
      ancestor: testProjectOne._id,
      children: []
    })
    .expect(201);

  const project = await Project.findById(response.body._id);
  expect(project).not.toBeNull();
  expect(project.owner).not.toEqual(testUserTwo._id);
});

test("Should not create subproject on another user's project", async () => {
  await request(app)
    .post("/projects")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: "New subproject",
      ancestor: testProjectThree._id
    })
    .expect(404);
});

// READ -----------------------------------------------------------------------

test("Should get list of projects for authenticated user", async () => {
  const response = await request(app)
    .get("/projects")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const projects = response.body;
  expect(projects.length).toBe(3);
});

test("Should get project by id for authenticated user", async () => {
  const response = await request(app)
    .get(`/projects/${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const project = await Project.findById(testProjectOne._id);
  expect(response.body.name).toEqual(project.name);
});

test("Should get subprojects of project for authenticated user", async () => {
  const response = await request(app)
    .get(`/projects/${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const project = await Project.findById(testProjectOne._id);
  await project.populate({ path: "subprojects" }).execPopulate();
  const subproject = await Project.findById(testProjectTwo._id);
  expect(response.body.name).toEqual(project.name);
  expect(project.subprojects).toEqual(
    expect.arrayContaining([expect.objectContaining({ _id: subproject._id })])
  );
});

test("Should not get list of projects if unauthenticated", async () => {
  await request(app)
    .get("/projects")
    .send()
    .expect(401);
});

test("Should not get project by id if unauthenticated", async () => {
  await request(app)
    .get(`/projects/${testProjectOne._id}`)
    .send()
    .expect(401);
});

test("Should not get another user's project by id", async () => {
  await request(app)
    .get(`/projects/${testProjectThree._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(404);
});

// UPDATE ---------------------------------------------------------------------

test("Should update project for authenticated user", async () => {
  const name = "new name";

  const response = await request(app)
    .patch(`/projects/${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name
    })
    .expect(200);

  expect(response.body.name).toEqual(name);
});

test("Should remove child ref from parent when removing ancestor from child", async () => {
  const response = await request(app)
    .patch(`/projects/${testProjectFive._id}`)
    .set("Authorization", `Bearer ${testUserTwo.tokens[0].token}`)
    .send({
      ancestor: null
    })
    .expect(200);

  const ancestor = await Project.findById(testProjectFour._id);
  await ancestor.populate({ path: "subprojects" }).execPopulate();

  expect(response.body.ancestor).toBeNull();
  expect(ancestor.subprojects).toEqual(
    expect.not.arrayContaining([
      expect.objectContaining({ _id: testProjectFive._id })
    ])
  );
});

test("Should add child ref to parent when updating ancestor", async () => {
  const response = await request(app)
    .patch(`/projects/${testProjectSeven._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      ancestor: testProjectOne._id
    })
    .expect(200);

  const ancestor = await Project.findById(testProjectOne._id);
  await ancestor.populate({ path: "subprojects" }).execPopulate();

  expect(response.body.ancestor).toEqual(testProjectOne._id.toString());
  expect(ancestor.subprojects).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ _id: testProjectSeven._id })
    ])
  );
});

test("Should swap child ref from old parent to new parent when updating ancestor", async () => {
  const response = await request(app)
    .patch(`/projects/${testProjectTwo._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      ancestor: testProjectSeven._id
    })
    .expect(200);

  const oldAncestor = await Project.findById(testProjectOne._id);
  await oldAncestor.populate({ path: "subprojects" }).execPopulate();
  const newAncestor = await Project.findById(testProjectSeven._id);
  await newAncestor.populate({ path: "subprojects" }).execPopulate();

  expect(response.body.ancestor).toEqual(testProjectSeven._id.toString());
  expect(oldAncestor.subprojects).toEqual(
    expect.not.arrayContaining([
      expect.objectContaining({ _id: testProjectTwo._id })
    ])
  );
  expect(newAncestor.subprojects).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ _id: testProjectTwo._id })
    ])
  );
});

test("Should not update project with invalid ancestor", async () => {
  await request(app)
    .patch(`/projects/${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      ancestor: new mongoose.Types.ObjectId()
    })
    .expect(404);
});

test("Should not update project for unauthenticated user", async () => {
  await request(app)
    .patch(`/projects/${testProjectOne._id}`)
    .send({
      name: "new name"
    })
    .expect(401);
});

test("Should not update project of another user", async () => {
  await request(app)
    .patch(`/projects/${testProjectThree._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: "new name"
    })
    .expect(404);
});

test("Should not update project with invalid field", async () => {
  await request(app)
    .patch(`/projects/${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      whatever: "somestring"
    })
    .expect(400);
});

test("Should not update project with empty name", async () => {
  await request(app)
    .patch(`/projects/${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: "",
      owner: testUserOne._id
    })
    .expect(400);
});

test("Should not update project with empty owner", async () => {
  await request(app)
    .patch(`/projects/${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: "somename",
      owner: null
    })
    .expect(400);
});

test("Should not move subproject to another user's project", async () => {
  await request(app)
    .patch(`/projects/${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      ancestor: testProjectThree._id
    })
    .expect(404);
});

// DELETE ---------------------------------------------------------------------

test("Should delete project by id from authenticated user", async () => {
  await request(app)
    .delete(`/projects/${testProjectThree._id}`)
    .set("Authorization", `Bearer ${testUserTwo.tokens[0].token}`)
    .send()
    .expect(200);

  const deletedProject = await Project.findById(testProjectThree._id);
  expect(deletedProject).toBeNull();
});

test("Should not delete project by id from unauthenticated user", async () => {
  await request(app)
    .delete(`/projects/${testProjectThree._id}`)
    .send()
    .expect(401);

  const project = await Project.findById(testProjectThree._id);
  expect(project).not.toBeNull();
  expect(project._id).toEqual(testProjectThree._id);
});

test("Should not delete project by id from another user", async () => {
  await request(app)
    .delete(`/projects/${testProjectThree._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(404);

  const project = await Project.findById(testProjectThree._id);
  expect(project).not.toBeNull();
  expect(project._id).toEqual(testProjectThree._id);
});

test("Should cascade delete children from deleted parent project", async () => {
  const response = await request(app)
    .delete(`/projects/${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const project = await Project.findById(response.body._id);
  const children = await Project.find({ ancestor: testProjectOne._id });
  expect(project).toBeNull();
  expect(children).toEqual([]);
});

test("Should remove child ref from ancestor's subprojects on delete", async () => {
  const response = await request(app)
    .delete(`/projects/${testProjectTwo._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const deletedProject = await Project.findById(response.body._id);
  const ancestorProject = await Project.findById(response.body.ancestor);
  await ancestorProject.populate({ path: "subprojects" }).execPopulate();
  expect(deletedProject).toBeNull();
  expect(ancestorProject.subprojects).toEqual(expect.arrayContaining([]));
});

test("Should cascade delete project's children tasks", async () => {
  const response = await request(app)
    .delete(`/projects/${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const deletedProjectId = response.body._id;
  const deletedProject = await Project.findById(deletedProjectId);
  const childrenTasks = await Task.find({ project: deletedProjectId });
  expect(deletedProject).toBeNull();
  expect(childrenTasks).toEqual(expect.arrayContaining([]));
});
