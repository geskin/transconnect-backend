const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

const prisma = new PrismaClient();

async function commonBeforeAll() {
    // Clear all tables
    await prisma.comment.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.resource.deleteMany({});
    await prisma.user.deleteMany({});

    // Create sample users
    const hashedPassword1 = await bcrypt.hash("password1", 12);
    const hashedPassword2 = await bcrypt.hash("password2", 12);
    const hashedPassword3 = await bcrypt.hash("password3", 12);

    const user1 = await prisma.user.create({
        data: {
            username: "u1",
            email: "user1@user.com",
            password: hashedPassword1,
            pronouns: "they/them",
            bio: "User 1 bio",
        },
    });

    const user2 = await prisma.user.create({
        data: {
            username: "u2",
            email: "user2@user.com",
            password: hashedPassword2,
            pronouns: "she/her",
            bio: "User 2 bio",
        },
    });

    const user3 = await prisma.user.create({
        data: {
            username: "u3",
            email: "user3@user.com",
            password: hashedPassword3,
            pronouns: "he/him",
            bio: "User 3 bio",
        },
    });

    // Create sample posts
    await prisma.post.create({
        data: {
            title: "Post 1",
            content: "This is the first post.",
            userId: user1.id,
        },
    });

    await prisma.post.create({
        data: {
            title: "Post 2",
            content: "This is the second post.",
            userId: user2.id,
        },
    });

    // Create sample resources
    await prisma.resource.create({
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
    await prisma.$executeRaw`BEGIN`;
}

async function commonAfterEach() {
    await prisma.$executeRaw`ROLLBACK`;
}

async function commonAfterAll() {
    await prisma.$disconnect();
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
