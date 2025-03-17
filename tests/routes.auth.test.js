"use strict";

const request = require("supertest");
const bcrypt = require("bcrypt");

const app = require("../app");
const { prisma } = require("../db");
const { createToken } = require("../helpers/tokens");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

let u1Token;

beforeAll(async () => {
    await commonBeforeAll();

    // Create a test user for authentication tests
    const hashedPassword = await bcrypt.hash("password1", 12);
    await prisma.user.create({
        data: {
            username: "u1",
            email: "user1@example.com",
            password: hashedPassword,
            pronouns: "they/them",
        },
    });

    u1Token = createToken({ username: "u1" });
});

beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /auth/token */

describe("POST /auth/token", function () {
    test("works with valid credentials", async function () {
        const resp = await request(app)
            .post("/auth/token")
            .send({
                username: "u1",
                password: "password1",
            });

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({
            token: expect.any(String),
        });
    });

    test("unauth with non-existent user", async function () {
        const resp = await request(app)
            .post("/auth/token")
            .send({
                username: "no-such-user",
                password: "password1",
            });

        expect(resp.statusCode).toBe(401);
    });

    test("unauth with wrong password", async function () {
        const resp = await request(app)
            .post("/auth/token")
            .send({
                username: "u1",
                password: "wrongpassword",
            });

        expect(resp.statusCode).toBe(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/auth/token")
            .send({
                username: "u1",
            });

        expect(resp.statusCode).toBe(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/auth/token")
            .send({
                username: 42,
                password: "not-a-string",
            });

        expect(resp.statusCode).toBe(400);
    });
});

/************************************** POST /auth/register */

describe("POST /auth/register", function () {
    test("works for anonymous user", async function () {
        const resp = await request(app)
            .post("/auth/register")
            .send({
                username: "newUser",
                email: "newuser@example.com",
                password: "newpassword",
                pronouns: "he/him",
            });

        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({
            token: expect.any(String),
        });
    });

    test("bad request with missing fields", async function () {
        const resp = await request(app)
            .post("/auth/register")
            .send({
                username: "incompleteUser",
            });

        expect(resp.statusCode).toBe(400);
    });

    test("bad request with invalid email format", async function () {
        const resp = await request(app)
            .post("/auth/register")
            .send({
                username: "newUser",
                email: "invalid-email",
                password: "newpassword",
                pronouns: "she/her",
            });

        expect(resp.statusCode).toBe(400);
    });
});
