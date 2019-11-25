const request = require("supertest");
const app = require("../src/app");
const mongoose = require("mongoose");
const Task = require("../src/models/task");
const {
  testUserOne,
  testUserTwo,
  testTaskOne,
  testTaskTwo,
  testTaskFour,
  testProjectOne,
  testProjectThree,
  setupDatabase
} = require("./fixtures/db");

beforeEach(setupDatabase);

// CREATE ---------------------------------------------------------------------

test("Should create task for user", async () => {
  const response = await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      description: "Task from test"
    })
    .expect(201);

  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.completed).toEqual(false);
});

test("Should not create task with invalid description", async () => {
  await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({})
    .expect(400);
});

test("Should not create task with invalid completed flag", async () => {
  await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({ completed: "true" })
    .expect(400);
});

test("Should not create task on another user's project", async () => {
  await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      description: "Task from test",
      project: testProjectThree._id
    })
    .expect(404);
});

test("Should not create task with inexistent project id", async () => {
  await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      description: "Task from test",
      project: new mongoose.Types.ObjectId()
    })
    .expect(404);
});

test("Should not create task with invalid project id", async () => {
  await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      description: "Task from test",
      project: "2398409284092"
    })
    .expect(400);
});

test("Should not create task for another user", async () => {
  const response = await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      description: "Task from test",
      owner: testUserTwo._id
    })
    .expect(201);

  expect(response.body.owner).not.toEqual(testUserTwo._id);
});

// UPDATE ---------------------------------------------------------------------

test("Should update task from logged in user", async () => {
  const response = await request(app)
    .patch(`/tasks/${testTaskOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      description: "First task updated",
      completed: true
    })
    .expect(200);

  const updatedTask = await Task.findById(testTaskOne._id);
  expect(updatedTask.description).toEqual(response.body.description);
  expect(updatedTask.completed).toEqual(response.body.completed);
});

test("Should not update task with invalid description", async () => {
  await request(app)
    .patch(`/tasks/${testTaskOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      description: "",
      completed: true
    })
    .expect(400);
});

test("Should not update task with invalid completed flag", async () => {
  await request(app)
    .patch(`/tasks/${testTaskOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      description: "Test update description",
      completed: "tru"
    })
    .expect(400);
});

test("Should not update task with invalid field", async () => {
  await request(app)
    .patch(`/tasks/${testTaskOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({
      name: "Test invalid field"
    })
    .expect(400);
});

test("Should not update other users task", async () => {
  const description = "Updating other user's task";
  await request(app)
    .patch(`/tasks/${testTaskOne._id}`)
    .set("Authorization", `Bearer ${testUserTwo.tokens[0].token}`)
    .send({ description })
    .expect(404);

  const userOneTask = await Task.findById(testTaskOne._id);
  expect(userOneTask.description).not.toEqual(description);
});

test("Should not update task with inexistent project id", async () => {
  await request(app)
    .patch(`/tasks/${testTaskOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({ project: new mongoose.Types.ObjectId() })
    .expect(404);
});

test("Should not update task with other user's project id", async () => {
  await request(app)
    .patch(`/tasks/${testTaskOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({ project: testProjectThree._id })
    .expect(404);
});

test("Should not update task with invalid project id", async () => {
  await request(app)
    .patch(`/tasks/${testTaskOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({ project: "sldkfjslkjfsl" })
    .expect(400);
});

// DELETE ---------------------------------------------------------------------

test("Should delete user task from logged in user", async () => {
  await request(app)
    .delete(`/tasks/${testTaskOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const deletedTask = await Task.findById(testTaskOne._id);
  expect(deletedTask).toBeNull();
});

test("Should not delete task if unauthenticated", async () => {
  await request(app)
    .delete(`/tasks/${testTaskOne._id}`)
    .send()
    .expect(401);
});

test("Should not delete tasks from another user", async () => {
  await request(app)
    .delete(`/tasks/${testTaskOne._id}`)
    .set("Authorization", `Bearer ${testUserTwo.tokens[0].token}`)
    .send()
    .expect(404);

  const userOneTask = await Task.findById(testTaskOne._id);
  expect(userOneTask).not.toBeNull();
});

// READ -----------------------------------------------------------------------

test("Should fetch all tasks from logged in user", async () => {
  const response = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const tasks = response.body;

  expect(tasks.length).toEqual(3);
  tasks.forEach(task => {
    expect(task.owner).toEqual(testUserOne._id.toString());
  });
});

test("Should fetch user task by id", async () => {
  const response = await request(app)
    .get(`/tasks/${testTaskOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const task = await Task.findById(testTaskOne._id);
  expect(task.description).toEqual(response.body.description);
});

test("Should not fetch user task by id if unauthenticated", async () => {
  await request(app)
    .get(`/tasks/${testTaskOne._id}`)
    .send()
    .expect(401);
});

test("Should not fetch other users task by id", async () => {
  await request(app)
    .get(`/tasks/${testTaskOne._id}`)
    .set("Authorization", `Bearer ${testUserTwo.tokens[0].token}`)
    .send()
    .expect(404);
});

test("Should fetch only completed tasks", async () => {
  const response = await request(app)
    .get("/tasks?completed=true")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const completedTasks = response.body;

  completedTasks.forEach(task => {
    expect(task.completed).toEqual(true);
  });
});

test("Should fetch only incomplete tasks", async () => {
  const response = await request(app)
    .get("/tasks?completed=false")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const completedTasks = response.body;

  completedTasks.forEach(task => {
    expect(task.completed).toEqual(false);
  });
});

test("Should fetch tasks by project id", async () => {
  const response = await request(app)
    .get(`/tasks?project=${testProjectOne._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const projectsTasks = response.body;

  projectsTasks.forEach(task => {
    expect(task.project).toEqual(testProjectOne._id.toString());
  });
});

test("Should not fetch tasks by project id from another user", async () => {
  const response = await request(app)
    .get(`/tasks?project=${testProjectThree._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body).toEqual([]);
});

// SORTING --------------------------------------------------------------------

test("Should sort tasks by description", async () => {
  const response = await request(app)
    .get("/tasks?sortBy=description:asc")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const tasks = response.body;

  expect(tasks.length).toEqual(3);
  expect(tasks[0].description).toEqual(testTaskOne.description);
  expect(tasks[1].description).toEqual(testTaskFour.description);
  expect(tasks[2].description).toEqual(testTaskTwo.description);
});

test("Should sort tasks by completed", async () => {
  const response = await request(app)
    .get("/tasks?sortBy=completed:asc")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const tasks = response.body;

  expect(tasks.length).toEqual(3);
  expect(tasks[0].description).toEqual(testTaskOne.description);
  expect(tasks[1].description).toEqual(testTaskFour.description);
  expect(tasks[2].description).toEqual(testTaskTwo.description);
});

test("Should sort tasks by createdAt", async () => {
  const response = await request(app)
    .get("/tasks?sortBy=createdAt:asc")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const tasks = response.body;

  expect(tasks.length).toEqual(3);
  expect(tasks[0].description).toEqual(testTaskOne.description);
  expect(tasks[1].description).toEqual(testTaskTwo.description);
  expect(tasks[2].description).toEqual(testTaskFour.description);
});

test("Should sort tasks by updatedAt", async () => {
  const response = await request(app)
    .get("/tasks?sortBy=updatedAt:desc")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const tasks = response.body;

  expect(tasks.length).toEqual(3);
  expect(tasks[0].description).toEqual(testTaskFour.description);
  expect(tasks[1].description).toEqual(testTaskTwo.description);
  expect(tasks[2].description).toEqual(testTaskOne.description);
});

// PAGINATION -----------------------------------------------------------------

test("Should fetch page of tasks", async () => {
  const response = await request(app)
    .get("/tasks?limit=1&skip=0")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const tasks = response.body;

  expect(tasks.length).toEqual(1);
});
