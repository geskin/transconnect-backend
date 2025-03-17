const request = require("supertest");
const app = require("../app");
const db = require("../db");
const { createToken } = require("../helpers/tokens");

let adminToken, userToken;
let testUser;

beforeAll(async () => {
    // Clear out database before test
    await db.user.deleteMany();

    // Create test users
    const admin = await db.user.create({
        data: {
            username: "admin",
            email: "admin@test.com",
            password: "password123",
            role: "ADMIN"
        }
    });

    testUser = await db.user.create({
        data: {
            username: "testuser",
            email: "testuser@test.com",
            password: "password123",
            role: "USER"
        }
    });

    // Generate tokens
    adminToken = createToken(admin);
    userToken = createToken(testUser);
});

afterAll(async () => {
    await db.user.deleteMany();
    await db.$disconnect();
});

describe("GET /users/:username", () => {
    test("User can retrieve their own details", async () => {
        const res = await request(app)
            .get(`/users/${testUser.username}`)
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.username).toBe(testUser.username);
    });

    test("Anon user cannot retrieve another user's details", async () => {
        const res = await request(app)
            .get(`/users/admin`)
            .set("Authorization", `Bearer `);

        expect(res.statusCode).toBe(401);
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

        expect(res.statusCode).toBe(401);
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
        const newUser = await db.user.create({
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
