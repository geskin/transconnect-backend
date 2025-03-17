const request = require("supertest");
const app = require("../app");
const db = require("../db");
const bcrypt = require("bcrypt");

beforeAll(async () => {
    await db.$connect();

    const hashedPassword = await bcrypt.hash("password1", 12);
    await db.user.create({
        data: {
            username: "user1",
            email: "user1@example.com",
            password: hashedPassword,
            pronouns: "they/them",
        },
    });

    const userCheck = await db.user.findUnique({
        where: { username: "user1" },
    });
    console.log("Created user:", userCheck);
});

afterAll(async () => {
    await db.user.deleteMany();
    await db.$disconnect();
});

describe("POST /auth/token", function () {
    test("works with valid credentials", async function () {
        const reqBody = { username: "user1", password: "password1" };
        console.log("Sending request:", reqBody);

        const resp = await request(app)
            .post("/auth/token")
            .send(reqBody);

        console.log("Response received:", resp.body);

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({
            token: expect.any(String),
        });
    });

    test("fails with invalid credentials", async function () {
        const resp = await request(app)
            .post("/auth/token")
            .send({ username: "user1", password: "wrongpassword" });

        expect(resp.statusCode).toBe(401);
        expect(resp.body.error.message).toBe("Invalid username/password");
    });

    test("fails with missing data", async function () {
        const resp = await request(app)
            .post("/auth/token")
            .send({ username: "user1" });

        expect(resp.statusCode).toBe(400);
    });
});
