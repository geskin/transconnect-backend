const request = require("supertest");
const app = require("../app");
const { prisma } = require("../db");
const { createToken } = require("../helpers/tokens");

let adminToken, userToken;
let testUser;

beforeAll(async () => {
    await prisma.user.deleteMany();

    const admin = await prisma.user.create({
        data: {
            username: "admin",
            email: "admin@test.com",
            password: "password123",
            role: "ADMIN"
        }
    });

    const user = await prisma.user.create({
        data: {
            username: "testuser",
            email: "testuser@test.com",
            password: "password123",
            role: "USER"
        }
    });

    adminToken = createToken(admin);
    userToken = createToken(user);
    testUser = user;
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe("POST /users", () => {
    test("Admin can create a new user", async () => {
        const res = await request(app)
            .post("/users")
            .send({
                username: "newuser",
                email: "newuser@test.com",
                password: "password123",
                role: "USER"
            })
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(201);
        expect(res.body.user).toHaveProperty("username", "newuser");
    });

    test("Non-admin cannot create a new user", async () => {
        const res = await request(app)
            .post("/users")
            .send({
                username: "unauthorized",
                email: "unauth@test.com",
                password: "password123",
                role: "USER"
            })
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
    });
});

describe("GET /users", () => {
    test("Admin can retrieve list of users", async () => {
        const res = await request(app)
            .get("/users")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.users.length).toBeGreaterThan(0);
    });

    test("Non-admin cannot retrieve list of users", async () => {
        const res = await request(app)
            .get("/users")
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
    });
});

describe("GET /users/:username", () => {
    test("User can retrieve their own details", async () => {
        const res = await request(app)
            .get(`/users/${testUser.username}`)
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.username).toBe(testUser.username);
    });

    test("Unauthorized user cannot retrieve another user's details", async () => {
        const res = await request(app)
            .get(`/users/admin`)
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
    });
});

describe("PATCH /users/:username", () => {
    test("User can update their own details", async () => {
        const res = await request(app)
            .patch(`/users/${testUser.username}`)
            .send({ bio: "Updated bio" })
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.bio).toBe("Updated bio");
    });

    test("Unauthorized user cannot update another user's details", async () => {
        const res = await request(app)
            .patch(`/users/admin`)
            .send({ bio: "Unauthorized update" })
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
    });
});

describe("DELETE /users/:username", () => {
    test("User can delete their own account", async () => {
        const res = await request(app)
            .delete(`/users/${testUser.username}`)
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.deleted).toBe(testUser.username);
    });

    test("Admin can delete any user", async () => {
        const newUser = await prisma.user.create({
            data: {
                username: "deleteMe",
                email: "deleteme@test.com",
                password: "password123",
                role: "USER"
            }
        });

        const res = await request(app)
            .delete(`/users/${newUser.username}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.deleted).toBe(newUser.username);
    });
});
