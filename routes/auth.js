"use strict";

const express = require("express");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");
const { createToken } = require("../helpers/tokens");
const { BadRequestError, UnauthorizedError } = require("../expressError");

const prisma = new PrismaClient();
const router = new express.Router();
const BCRYPT_WORK_FACTOR = 12;

/** 🔹 Define validation schemas using Zod */
const userRegisterSchema = z.object({
    email: z.string().email().optional(), // email is nullable in schema
    username: z.string().min(3),
    password: z.string().min(6), // Password must be at least 6 chars
    pronouns: z.string().optional(),
});

const userAuthSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
});

/** POST /auth/token: { username, password } => { token } */
router.post("/token", async function (req, res, next) {
    try {
        const parsedBody = userAuthSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { username: parsedBody.username },
        });

        if (!user) {
            throw new UnauthorizedError("Invalid username/password");
        }

        const isValid = await bcrypt.compare(parsedBody.password, user.password);
        if (!isValid) {
            throw new UnauthorizedError("Invalid username/password");
        }

        const token = createToken(user);
        return res.json({ token });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return next(new BadRequestError(err.errors.map(e => e.message)));
        }
        return next(err);
    }
});

/** POST /auth/register: { username, password, email, pronouns } => { token } */
router.post("/register", async function (req, res, next) {
    try {
        const parsedBody = userRegisterSchema.parse(req.body);

        const hashedPassword = await bcrypt.hash(parsedBody.password, BCRYPT_WORK_FACTOR);

        const newUser = await prisma.user.create({
            data: {
                username: parsedBody.username,
                email: parsedBody.email || null,
                password: hashedPassword,
                pronouns: parsedBody.pronouns || null,
                role: "USER",
            },
        });

        const token = createToken(newUser);
        return res.status(201).json({ token });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return next(new BadRequestError(err.errors.map(e => e.message)));
        }
        return next(err);
    }
});

module.exports = router;
