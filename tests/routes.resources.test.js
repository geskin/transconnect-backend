const request = require("supertest");
const app = require("../app");
const db = require("../db");
const { createToken } = require("../helpers/tokens");

let admin, user, adminToken, userToken, resource;

beforeAll(async () => {
    await db.user.deleteMany();
    await db.resource.deleteMany();

    admin = await db.user.create({
        data: { username: "admin", email: "admin@testing.com", password: "hashed", role: "ADMIN" }
    });
    user = await db.user.create({
        data: { username: "user", email: "user@testing.com", password: "hashed", role: "USER" }
    });

    adminToken = createToken(admin);
    userToken = createToken(user);

    resource = await db.resource.create({
        data: {
            name: "Test Resource",
            description: "This is a test resource",
            url: "https://example.com",
            types: [{ "name": "Other" }],
            userId: admin.id
        }
    });
});

afterAll(async () => {
    await db.resource.deleteMany();
    await db.user.deleteMany();
    await db.$disconnect();
});

// GET /resources/:id
it("retrieves a single resource", async () => {
    const resp = await request(app).get(`/resources/${resource.id}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.resource).toHaveProperty("id", resource.id);
});

// POST /resources
it("creates a new resource", async () => {
    const newResource = {
        title: "New Resource",
        description: "A new test resource",
        url: "https://new.com",
        types: ["Health"],
        userId: user.id
    };

    const resp = await request(app)
        .post("/resources")
        .set("Authorization", `Bearer ${userToken}`)
        .send(newResource);

    expect(resp.statusCode).toBe(201);
    expect(resp.body.resource.title).toBe("New Resource");
});

// PATCH /resources/:id
it("updates a resource", async () => {
    const updatedData = { title: "Updated Resource" };

    const resp = await request(app)
        .patch(`/resources/${resource.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedData);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.resource.title).toBe("Updated Resource");
});

// DELETE /resources/:id
it("deletes a resource", async () => {
    const resp = await request(app)
        .delete(`/resources/${resource.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toBe(200);

    const checkResource = await prisma.resource.findUnique({ where: { id: resource.id } });
    expect(checkResource).toBeNull();
});