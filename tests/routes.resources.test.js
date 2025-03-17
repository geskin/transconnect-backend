const request = require("supertest");
const app = require("../app");
const { PrismaClient } = require("@prisma/client");
const { adminToken, userToken, commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require("../tests/_testCommon");

const prisma = new PrismaClient();

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("GET /resources", () => {
    test("works: gets all resources", async () => {
        const resp = await request(app).get("/resources");
        expect(resp.statusCode).toBe(200);
        expect(resp.body.resources).toBeInstanceOf(Array);
    });
});

describe("GET /resources/types", () => {
    test("works: gets all resource types", async () => {
        const resp = await request(app).get("/resources/types");
        expect(resp.statusCode).toBe(200);
        expect(resp.body.types).toBeInstanceOf(Array);
    });
});

describe("GET /resources/:resource_id", () => {
    test("works: gets a specific resource", async () => {
        const resp = await request(app).get("/resources/1");
        expect(resp.statusCode).toBe(200);
        expect(resp.body.resource).toHaveProperty("name");
    });

    test("fails: invalid resource id", async () => {
        const resp = await request(app).get("/resources/abc");
        expect(resp.statusCode).toBe(400);
    });
});

describe("POST /resources", () => {
    test("works: creates a new resource", async () => {
        const newResource = {
            name: "Test Resource",
            description: "A test description",
            url: "http://test.com",
            types: ["Support"],
            userId: 1
        };

        const resp = await request(app)
            .post("/resources")
            .send(newResource);
        expect(resp.statusCode).toBe(201);
        expect(resp.body.resource).toHaveProperty("id");
    });

    test("fails: missing required fields", async () => {
        const resp = await request(app)
            .post("/resources")
            .send({ description: "Missing name and type" });
        expect(resp.statusCode).toBe(400);
    });
});

describe("PATCH /resources/:resource_id", () => {
    test("works: updates a resource (admin only)", async () => {
        const resp = await request(app)
            .patch("/resources/1")
            .send({ name: "Updated Resource" })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body.resource.name).toBe("Updated Resource");
    });

    test("fails: unauthorized user", async () => {
        const resp = await request(app)
            .patch("/resources/1")
            .send({ name: "Updated Resource" })
            .set("authorization", `Bearer ${userToken}`);
        expect(resp.statusCode).toBe(403);
    });
});

describe("DELETE /resources/:resource_id", () => {
    test("works: deletes a resource (admin only)", async () => {
        const resp = await request(app)
            .delete("/resources/1")
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ deleted: "1" });
    });

    test("fails: unauthorized user", async () => {
        const resp = await request(app)
            .delete("/resources/1")
            .set("authorization", `Bearer ${userToken}`);
        expect(resp.statusCode).toBe(403);
    });
});