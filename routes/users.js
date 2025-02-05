"use strict";

/** Routes for users. */

const express = require("express");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");
const { ensureCorrectUserOrAdmin, ensureAdmin, ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError, NotFoundError } = require("../expressError");
const { createToken } = require("../helpers/tokens");

const prisma = new PrismaClient();
const router = express.Router();
const BCRYPT_WORK_FACTOR = 12;

/** 🔹 Define validation schemas using Zod */
const userNewSchema = z.object({
    username: z.string().min(3),
    email: z.string().email().optional(),
    password: z.string().min(6),
    pronouns: z.string().optional(),
    role: z.enum(["USER", "ADMIN"]).default("USER"),
});

const userUpdateSchema = z.object({
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    pronouns: z.string().optional(),
    role: z.enum(["USER", "ADMIN"]).optional(),
});

/** POST / { user }  => { user, token }
 *
 * Adds a new user (admin-only).
 */
router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const parsedBody = userNewSchema.parse(req.body);
        const hashedPassword = await bcrypt.hash(parsedBody.password, BCRYPT_WORK_FACTOR);

        const user = await prisma.user.create({
            data: {
                username: parsedBody.username,
                email: parsedBody.email || null,
                password: hashedPassword,
                pronouns: parsedBody.pronouns || null,
                role: parsedBody.role,
            },
        });

        const token = createToken(user);
        return res.status(201).json({ user, token });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return next(new BadRequestError(err.errors.map(e => e.message)));
        }
        return next(err);
    }
});

/** 📄 GET / => { users: [ { username, email, pronouns, role }, ... ] }
 *
 * Returns list of all users (admin-only).
 */
router.get("/", ensureAdmin, async function (req, res, next) {
    try {
        const users = await prisma.user.findMany({
            select: { username: true, email: true, pronouns: true, role: true },
        });

        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});

/** 🆔 GET /[username] => { user }
 *
 * Returns user details.
 */
router.get("/:username", ensureLoggedIn, async function (req, res, next) {
    try {
        const user = await prisma.user.findUnique({
            where: { username: req.params.username },
            select: { username: true, email: true, pronouns: true, role: true },
        });

        if (!user) throw new NotFoundError("User not found");

        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[username] { user } => { user }
 *
 * Updates user details.
 */
router.patch("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const parsedBody = userUpdateSchema.parse(req.body);
        let updateData = { ...parsedBody };

        if (parsedBody.password) {
            updateData.password = await bcrypt.hash(parsedBody.password, BCRYPT_WORK_FACTOR);
        }

        const user = await prisma.user.update({
            where: { username: req.params.username },
            data: updateData,
            select: { username: true, email: true, pronouns: true, role: true },
        });

        return res.json({ user });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return next(new BadRequestError(err.errors.map(e => e.message)));
        }
        if (err.code === "P2025") {
            return next(new NotFoundError("User not found"));
        }
        return next(err);
    }
});

/** DELETE /[username]  =>  { deleted: username }
 *
 * Deletes a user.
 */
router.delete("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        await prisma.user.delete({
            where: { username: req.params.username },
        });

        return res.json({ deleted: req.params.username });
    } catch (err) {
        if (err.code === "P2025") {
            return next(new NotFoundError("User not found"));
        }
        return next(err);
    }
});

module.exports = router;
