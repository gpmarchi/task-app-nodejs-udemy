const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");
const Project = require("../src/models/project");
const {
  testUserOne,
  testUserTwo,
  testProjectOne,
  testProjectTwo,
  testProjectThree,
  testProjectFour,
  testProjectFive,
  testProjectSix,
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
  const newProject = await Project.findById(response.body._id);
  expect(newProject).not.toBeNull();
  expect(newProject.ancestor).toEqual(testProjectOne._id);
  expect(ancestor.children).toEqual(expect.arrayContaining([newProject._id]));
});

test("Should create new parent project and update ancestor ref on children", async () => {
  const response = await request(app)
    .post("/projects")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: "New parent project",
      children: [testProjectSeven._id]
    })
    .expect(201);

  const child = await Project.findById(testProjectSeven._id);
  const newProject = await Project.findById(response.body._id);
  expect(newProject).not.toBeNull();
  expect(child.ancestor).toEqual(mongoose.Types.ObjectId(response.body._id));
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

test("Should not create project with invalid child id", async () => {
  await request(app)
    .post("/projects")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: "Test Project",
      children: ["oi2u34oiu23o4iu2o3u4"]
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

test("Should not create project with inexistent child id", async () => {
  await request(app)
    .post("/projects")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: "Test Project",
      children: [mongoose.Types.ObjectId("5d7e3a11ed8c380e25b81839")]
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

test("Should clear children and remove ancestor ref from child", async () => {
  const response = await request(app)
    .patch(`/projects/${testProjectFour._id}`)
    .set("Authorization", `Bearer ${testUserTwo.tokens[0].token}`)
    .send({
      children: []
    })
    .expect(200);

  const childProject1 = await Project.findById(testProjectFour.children[0]);
  const childProject2 = await Project.findById(testProjectFour.children[1]);

  expect(response.body.children).toEqual([]);
  expect(childProject1.ancestor).toEqual(null);
  expect(childProject2.ancestor).toEqual(null);
});

test("Should remove child ref from parent when removing ancestor from child", async () => {
  const response = await request(app)
    .patch(`/projects/${testProjectFive._id}`)
    .set("Authorization", `Bearer ${testUserTwo.tokens[0].token}`)
    .send({
      ancestor: null
    })
    .expect(200);

  const removedAncestorChild = [testProjectFive._id];
  const ancestor = await Project.findById(testProjectFour._id);

  expect(response.body.ancestor).toBeNull();
  expect(ancestor.children).toEqual(
    expect.not.arrayContaining(removedAncestorChild)
  );
});

test("Should add child project and update ancestor ref in child", async () => {
  const response = await request(app)
    .patch(`/projects/${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      children: [testProjectTwo._id, testProjectSeven._id]
    })
    .expect(200);

  const newChildProject = await Project.findById(testProjectSeven._id);

  const convertedChildren = response.body.children.map(child => {
    return JSON.stringify(child);
  });

  expect(convertedChildren).toEqual([
    JSON.stringify(testProjectTwo._id),
    JSON.stringify(testProjectSeven._id)
  ]);
  expect(newChildProject.ancestor).toEqual(testProjectOne._id);
});

test("Should add child ref to parent when updating ancestor", async () => {
  const response = await request(app)
    .patch(`/projects/${testProjectSeven._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      ancestor: testProjectOne._id
    })
    .expect(200);

  const addedAncestorChild = [testProjectSeven._id];
  const ancestor = await Project.findById(testProjectOne._id);

  expect(JSON.stringify(response.body.ancestor)).toEqual(
    JSON.stringify(testProjectOne._id)
  );
  expect(ancestor.children).toEqual(expect.arrayContaining(addedAncestorChild));
});

test("Should remove child project and update ancestor ref in child", async () => {
  const response = await request(app)
    .patch(`/projects/${testProjectFour._id}`)
    .set("Authorization", `Bearer ${testUserTwo.tokens[0].token}`)
    .send({
      children: [testProjectFive._id]
    })
    .expect(200);

  const oldChildProject = await Project.findById(testProjectSix._id);
  const currentChildProject = await Project.findById(testProjectFive._id);

  const convertedChildren = response.body.children.map(child => {
    return JSON.stringify(child);
  });

  expect(convertedChildren).toEqual([JSON.stringify(testProjectFive._id)]);
  expect(oldChildProject.ancestor).toBeNull();
  expect(currentChildProject.ancestor).toEqual(testProjectFour._id);
});

test("Should swap child project and update ancestor ref in old and new child", async () => {
  const response = await request(app)
    .patch(`/projects/${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      children: [testProjectSeven._id]
    })
    .expect(200);

  const oldChildProject = await Project.findById(testProjectTwo._id);
  const currentChildProject = await Project.findById(testProjectSeven._id);

  const convertedChildren = response.body.children.map(child => {
    return JSON.stringify(child);
  });

  expect(convertedChildren).toEqual([JSON.stringify(testProjectSeven._id)]);
  expect(oldChildProject.ancestor).toBeNull();
  expect(currentChildProject.ancestor).toEqual(testProjectOne._id);
});

test("Should swap child ref from old parent to new parent when updating ancestor", async () => {
  const response = await request(app)
    .patch(`/projects/${testProjectTwo._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      ancestor: testProjectSeven._id
    })
    .expect(200);

  const swappedAncestorChild = [testProjectTwo._id];
  const oldAncestor = await Project.findById(testProjectOne._id);
  const newAncestor = await Project.findById(testProjectSeven._id);

  expect(JSON.stringify(response.body.ancestor)).toEqual(
    JSON.stringify(testProjectSeven._id)
  );
  expect(oldAncestor.children).toEqual(
    expect.not.arrayContaining(swappedAncestorChild)
  );
  expect(newAncestor.children).toEqual(
    expect.arrayContaining(swappedAncestorChild)
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

test("Should not update project with invalid child", async () => {
  await request(app)
    .patch(`/projects/${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      children: [new mongoose.Types.ObjectId()]
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
