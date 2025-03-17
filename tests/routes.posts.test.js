"use strict";

const request = require("supertest");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testPostIds,
    u1Token,
    adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /posts */

describe("POST /posts", function () {
    const newPost = {
        title: "New Post",
        content: "This is a new post.",
        tags: ["test", "new"],
    };

    test("ok for logged-in user", async function () {
        const resp = await request(app)
            .post("/posts")
            .send(newPost)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body.post).toHaveProperty("id");
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .post("/posts")
            .send(newPost);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/posts")
            .send({ title: "New Post" })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /posts */

describe("GET /posts", function () {
    test("works for logged-in user", async function () {
        const resp = await request(app)
            .get("/posts")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body.posts.length).toBeGreaterThan(0);
    });

    test("unauth for anon", async function () {
        const resp = await request(app).get("/posts");
        expect(resp.statusCode).toEqual(401);
    });
});

/************************************** GET /posts/:id */

describe("GET /posts/:id", function () {
    test("works for logged-in user", async function () {
        const resp = await request(app)
            .get(`/posts/${testPostIds[0]}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(200);
    });

    test("not found for no such post", async function () {
        const resp = await request(app)
            .get("/posts/99999")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /posts/:id */

describe("PATCH /posts/:id", function () {
    test("works for correct user or admin", async function () {
        const resp = await request(app)
            .patch(`/posts/${testPostIds[0]}`)
            .send({ title: "Updated Title" })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body.post.title).toEqual("Updated Title");
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/posts/${testPostIds[0]}`)
            .send({ title: "Updated Title" });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such post", async function () {
        const resp = await request(app)
            .patch("/posts/99999")
            .send({ title: "Updated Title" })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** DELETE /posts/:id */

describe("DELETE /posts/:id", function () {
    test("works for correct user or admin", async function () {
        const resp = await request(app)
            .delete(`/posts/${testPostIds[0]}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(200);
    });

    test("unauth for anon", async function () {
        const resp = await request(app).delete(`/posts/${testPostIds[0]}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such post", async function () {
        const resp = await request(app)
            .delete("/posts/99999")
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});
