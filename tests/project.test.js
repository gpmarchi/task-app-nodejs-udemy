const request = require("supertest");
const app = require("../src/app");
const Project = require("../src/models/project");
const {
  testUserOne,
  testUserTwo,
  testProjectOne,
  testProjectThree,
  setupDatabase
} = require("./fixtures/db");

beforeEach(setupDatabase);

// CREATE ---------------------------------------------------------------------

test("Should create project for authenticated user", async () => {
  const response = await request(app)
    .post("/projects")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: "New project",
      ancestor: testProjectOne._id,
      children: []
    })
    .expect(201);

  const project = await Project.findById(response.body._id);
  expect(project).not.toBeNull();
  expect(project.ancestor).toEqual(testProjectOne._id);
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

// READ -----------------------------------------------------------------------

test("Should get list of projects for authenticated user", async () => {
  const response = await request(app)
    .get("/projects")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const projects = response.body;
  expect(projects.length).toBe(2);
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
      owner: testProjectOne._id
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
  await request(app)
    .delete(`/projects/${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const project = await Project.findById(testProjectOne._id);
  const children = await Project.find({ ancestor: testProjectOne._id });
  expect(project).toBeNull();
  expect(children).toBeNull;
});
