const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');
const db = require("../db");

const prisma = new PrismaClient();

async function commonBeforeAll() {
    await db.comment.deleteMany({});
    await db.post.deleteMany({});
    await db.resource.deleteMany({});
    await db.user.deleteMany({});

    const hashedPassword1 = await bcrypt.hash("password1", 12);
    const hashedPassword2 = await bcrypt.hash("password2", 12);
    const hashedPassword3 = await bcrypt.hash("password3", 12);

    // create sample users
    const user1 = await db.user.create({
        data: {
            username: "u1",
            // email: "user1@user.com",
            password: hashedPassword1,
            pronouns: "they/them",
            bio: "User 1 bio",
        },
    });

    const user2 = await db.user.create({
        data: {
            username: "u2",
            // email: "user2@user.com",
            password: hashedPassword2,
            pronouns: "she/her",
            bio: "User 2 bio",
        },
    });

    const user3 = await db.user.create({
        data: {
            username: "u3",
            // email: "user3@user.com",
            password: hashedPassword3,
            pronouns: "he/him",
            bio: "User 3 bio",
        },
    });

    // Create sample posts
    await db.post.create({
        data: {
            title: "Post 1",
            content: "This is the first post.",
            // userId: user1.id,
            user: user1,
        },
    });

    await db.post.create({
        data: {
            title: "Post 2",
            content: "This is the second post.",
            // userId: user2.id,
            user: user2,
        },
    });

    // Create sample resources
    await db.resource.create({
        data: {
            name: "Trans Support Group",
            description: "A group for transgender individuals to find support.",
            url: "https://trans-support.org",
            approved: true,
            userId: user3.id,
        },
    });
}

async function commonBeforeEach() {
    await db.$executeRaw`BEGIN`;
}

async function commonAfterEach() {
    await db.$executeRaw`ROLLBACK`;
}

async function commonAfterAll() {
    try {
        console.log("Disconnecting Prisma...");
        await db.$disconnect();
        console.log("Prisma disconnected.");
    } catch (err) {
        console.error("Error during Prisma disconnection:", err);
    }
}

const u1Token = jwt.sign({ username: "u1", role: "USER" }, SECRET_KEY);
const u2Token = jwt.sign({ username: "u2", role: "USER" }, SECRET_KEY);
const adminToken = jwt.sign({ username: "admin", role: "ADMIN" }, SECRET_KEY);

module.exports = {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u2Token,
    adminToken,
};
