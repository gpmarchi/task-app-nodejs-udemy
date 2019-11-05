const request = require("supertest");
const app = require("../src/app");
const Project = require("../src/models/project");
const { testUserOne, testProjectOne, setupDatabase } = require("./fixtures/db");

beforeEach(setupDatabase);

test("Should create project for user", async () => {
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
