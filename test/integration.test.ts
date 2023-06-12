// import app from "../src/config/app";
// import supertest from "supertest";
// import { expect } from "chai";
// import shortid from "shortid";
// import dataBaseService from "../src/config/db";

// describe("Index Test", () => {
//   it("should always pass", () => {
//     expect(true).to.equal(true);
//   });
// });

// let firstUserIdTest = ""; // will later hold a value returned by our API
// const firstUserBody = {
//   email: `pielly17@gmail.com`,
//   password: "1994",
//   firstName: "Ike",
//   lastName: "Boadu",
// };

// describe("users and auth endpoints", function () {
//   let request: supertest.SuperAgentTest;
//   before(function () {
//     request = supertest.agent(app);
//   });
//   //   after(function (done) {
//   //       // shut down the Express.js server, close our MongoDB connection, then
//   //       // tell Mocha we're done:
//   //       app.close(() => {

//   //       });
//   //   });

//   it("should allow a POST to /users", async function () {
//     const res = await request.post("/users").send(firstUserBody);

//     expect(res.status).to.equal(201);
//     expect(res.body).not.to.be.empty;
//     expect(res.body).to.be.an("object");
//     expect(res.body.id).to.be.a("number");
//     firstUserIdTest = res.body.id;
//   });
//   it("should allow a GET from /users/:userId", async function () {
//     const res = await request.get(`/users/${firstUserIdTest}`).send();

//     expect(res.status).to.equal(200);
//     expect(res.body).not.to.be.empty;
//     expect(res.body).to.be.an("object");
//     expect(res.body.id).to.be.a("number");
//     expect(res.body.id).to.equal(firstUserIdTest);
//     expect(res.body.email).to.equal(firstUserBody.email);
//   });
//   it("should allow a partially Update /users", async function () {
//     const res = await request.patch(`/users/${firstUserIdTest}`).send(firstUserBody);

//     expect(res.status).to.equal(204);
//     expect(res.body).to.be.empty;
//   });
//   it("should allow a full Update /users", async function () {
//     const res = await request.put(`/users/${firstUserIdTest}`).send(firstUserBody);

//     expect(res.status).to.equal(204);
//     expect(res.body).to.be.empty;
//   });

//   it("should allow a Delete from /users", async function () {
//     const res = await request.delete(`/users/${firstUserIdTest}`).send();

//     expect(res.status).to.equal(204);
//     expect(res.body).to.be.empty;
//     // expect(res.body).to.be.an('object');
//     // expect(res.body.id).to.be.a('number');
//   });
// });
