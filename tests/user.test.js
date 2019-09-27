const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const {
  testAdminUser,
  testUserOne,
  testUserTwo,
  setupDatabase
} = require("./fixtures/db");

beforeEach(setupDatabase);

test("Should signup a new user", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "Gustavo",
      email: "gustavo@example.com",
      password: "mypass777!",
      admin: true
    })
    .expect(201);

  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  expect(response.body).toMatchObject({
    user: {
      name: "Gustavo",
      email: "gustavo@example.com"
    },
    token: user.tokens[0].token
  });

  expect(user.password).not.toBe("mypass777!");
  expect(user.admin).toEqual(false);
});

test("Should not signup a user with invalid name", async () => {
  await request(app)
    .post("/users")
    .send({
      email: "test@test.com",
      password: "2397erwiueroi9@"
    })
    .expect(400);
});

test("Should not signup a user with invalid password", async () => {
  await request(app)
    .post("/users")
    .send({
      name: "Test",
      email: "test@test.com",
      password: "password"
    })
    .expect(400);
});

test("Should not signup a user with invalid email", async () => {
  await request(app)
    .post("/users")
    .send({
      name: "Test",
      email: "test",
      password: "1234567"
    })
    .expect(400);
});

test("Should login existing user", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: testUserOne.email,
      password: testUserOne.password
    })
    .expect(200);

  const user = await User.findById(testUserOne._id);
  expect(response.body.token).toBe(user.tokens[1].token);
});

test("Should not login nonexisting user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: testUserOne.email,
      password: "notmypassword"
    })
    .expect(401);
});

test("Should logout existing user", async () => {
  const response = await request(app)
    .patch("/users/logout")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(testUserOne._id);
  expect(user.tokens).not.toContain(testUserOne.tokens[0].token);
});

test("Should not logout nonexisting user", async () => {
  const response = await request(app)
    .patch("/users/logout")
    .send()
    .expect(401);
});

test("Should logout all existing user sessions", async () => {
  let response = await request(app)
    .post("/users/login")
    .send({
      email: testUserOne.email,
      password: testUserOne.password
    })
    .expect(200);

  let user = await User.findById(testUserOne._id);
  expect(user.tokens.length).toBe(2);

  response = await request(app)
    .delete("/users/logoutAll")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  user = await User.findById(testUserOne._id);
  expect(user.tokens.length).toBe(0);
});

test("Should not logout all nonexisting user sessions", async () => {
  response = await request(app)
    .delete("/users/logoutAll")
    .send()
    .expect(401);
});

test("Should get profile for user", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test("Should not get profile for unauthenticated user", async () => {
  await request(app)
    .get("/users/me")
    .send()
    .expect(401);
});

test("Should delete account for logged in user", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(testUserOne._id);
  expect(user).toBeNull();
});

test("Should not delete account for unauthenticated user", async () => {
  await request(app)
    .delete("/users/me")
    .send()
    .expect(401);
});

test("Should upload avatar image", async () => {
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/profile-pic.jpg")
    .expect(200);

  const user = await User.findById(testUserOne._id);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test("Should not upload invalid avatar image", async () => {
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/fall.jpg")
    .expect(400);
});

test("Should not upload invalid file extension to avatar image", async () => {
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/sample-pdf-file.pdf")
    .expect(400);
});

test("Should update valid user fields", async () => {
  const response = await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({ name: "Peter", admin: true })
    .expect(200);

  const user = await User.findById(testUserOne._id);
  expect(user.name).toEqual(response.body.name);
  expect(user.admin).toEqual(false);
});

test("Should not update invalid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({ location: "Whatever" })
    .expect(400);
});

test("Should not update unauthenticated user", async () => {
  await request(app)
    .patch("/users/me")
    .send({ name: "Peter" })
    .expect(401);
});

test("Should not update user with invalid name", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({ name: "" })
    .expect(400);
});

test("Should not update user with invalid password", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({ password: "123456" })
    .expect(400);
});

test("Should not update user with invalid email", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({ email: "jen@example.com" })
    .expect(400);
});

test("Should not list all users if not admin", async () => {
  await request(app)
    .get("/admin/users")
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .expect(403);
});

test("Should list all users if admin", async () => {
  const response = await request(app)
    .get("/admin/users")
    .set("Authorization", `Bearer ${testAdminUser.tokens[0].token}`)
    .expect(200);

  expect(response.body.length).toEqual(3);
});

test("Should not show user by id if not admin", async () => {
  await request(app)
    .get(`/admin/users/${testUserTwo._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .expect(403);
});

test("Should show user by id if admin", async () => {
  const response = await request(app)
    .get(`/admin/users/${testUserOne._id}`)
    .set("Authorization", `Bearer ${testAdminUser.tokens[0].token}`)
    .expect(200);

  expect(response.body.name).toEqual("Mike");
});

test("Should not update user by id if not admin", async () => {
  await request(app)
    .patch(`/admin/users/${testUserTwo._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send({ name: "Larry" })
    .expect(403);
});

test("Should update user by id if admin", async () => {
  const response = await request(app)
    .patch(`/admin/users/${testUserOne._id}`)
    .set("Authorization", `Bearer ${testAdminUser.tokens[0].token}`)
    .send({ name: "Larry" })
    .expect(200);

  expect(response.body.name).toEqual("Larry");
});

test("Should not delete user by id if not admin", async () => {
  await request(app)
    .delete(`/admin/users/${testUserTwo._id}`)
    .set("Authorization", `Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(403);
});

test("Should delete user by id if admin", async () => {
  const response = await request(app)
    .delete(`/admin/users/${testUserOne._id}`)
    .set("Authorization", `Bearer ${testAdminUser.tokens[0].token}`)
    .send()
    .expect(200);

  const deletedUser = await User.findById(testUserOne._id);
  expect(deletedUser).toBeNull();
});
