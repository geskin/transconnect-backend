"use strict";

/** Routes for posts. */

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");
const { ensureCorrectUserOrAdmin, ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError, NotFoundError } = require("../expressError");

const prisma = new PrismaClient();
const router = express.Router();

/** Define validation schemas using Zod */
const postSchema = z.object({
    title: z.string().min(1, "Post title cannot be empty"),
    content: z.string().min(1, "Post content cannot be empty"),
    tags: z.array(z.string()).optional(),
});

const commentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty"),
});

/** GET /posts?tag=optionalTag
 *  Get all posts or filter by a specific tag.
 */
router.get("/", async function (req, res, next) {
    try {
        const { tag } = req.query;

        const whereConditions = tag ? { tags: { some: { name: tag } } } : {};

        const posts = await prisma.post.findMany({
            where: whereConditions,
            select: { title: true, content: true, user: true, createdAt: true, comments: true, tags: true }
        });

        return res.json({ posts });
    } catch (err) {
        return next(err);
    }
});

/** GET /posts/tags
 * Get all available post tags
 */

router.get("/tags", async function (req, res, next) {
    try {
        const tags = await prisma.tag.findMany({
            select: { name: true, posts: true },
        });

        return res.json({ tags });
    } catch (err) {
        return next(err);
    }
});


/** POST /posts
 *
 * Creates a new post.
 * Authorization required: Logged in user.
 */
router.post("/", ensureLoggedIn, async function (req, res, next) {
    try {
        const { title, content, tags, userId } = req.body;

        const post = await prisma.post.create({
            data: {
                title,
                content,
                tags: {
                    connect: tags.map(t => ({ tag: t }))
                },
                user: userId ? { connect: { id: userId } } : undefined
            },
        });

        return res.status(201).json({ post });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return next(new BadRequestError(err.errors.map(e => e.message)));
        }
        return next(err);
    }
});

/** GET /posts/:post_id 
 * 
 * Gets a specific post (and its associated comments?)
 * authorization required: logged in
*/

router.get("/:post_id", ensureLoggedIn, async function (req, res, next) {
    try {
        const post = await prisma.post.findUnique({
            where: { id: Number(req.params.post_id) }
        });
        console.debug(post);
        return res.json({ post });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return next(new BadRequestError(err.errors.map(e => e.message)));
        }
        if (err.code === "P2025") {
            return next(new NotFoundError("Post not found"));
        }
        return next(err);
    }
});

/** PATCH /posts/:post_id → /users/:username/posts/:post_id
 *
 * Updates a specific post.
 * Authorization required: Correct user or admin.
 */
router.patch("/:post_id", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const parsedBody = postSchema.partial().parse(req.body);

        const post = await prisma.post.update({
            where: { id: Number(req.params.post_id) },
            data: parsedBody,
        });

        return res.json({ post });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return next(new BadRequestError(err.errors.map(e => e.message)));
        }
        if (err.code === "P2025") {
            return next(new NotFoundError("Post not found"));
        }
        return next(err);
    }
});

/** DELETE /posts/:post_id → /users/:username/posts/:post_id
 *
 * Deletes a specific post.
 * Authorization required: Correct user or admin.
 */
router.delete("/:post_id", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        await prisma.post.delete({
            where: { id: Number(req.params.post_id) },
        });

        return res.json({ deleted: req.params.post_id });
    } catch (err) {
        if (err.code === "P2025") {
            return next(new NotFoundError("Post not found"));
        }
        return next(err);
    }
});

/** Routes for comments */

/** GET /posts/:post_id/comments
 *
 * Gets all comments for a specific post.
 */
router.get("/:post_id/comments", async function (req, res, next) {
    try {
        const comments = await prisma.comment.findMany({
            where: { postId: Number(req.params.post_id) },
            include: { author: { select: { username: true } } },
        });

        return res.json({ comments });
    } catch (err) {
        return next(err);
    }
});

/** POST /posts/:post_id/comments
 *
 * Adds a new comment to a post.
 * Authorization required: Logged in user.
 */
router.post("/:post_id/comments", ensureLoggedIn, async function (req, res, next) {
    try {
        const parsedBody = commentSchema.parse(req.body);

        const comment = await prisma.comment.create({
            data: {
                content: parsedBody.content,
                postId: Number(req.params.post_id),
                author: req.body.user,
            },
        });

        return res.status(201).json({ comment });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return next(new BadRequestError(err.errors.map(e => e.message)));
        }
        return next(err);
    }
});

/** PATCH /posts/:post_id/comments/:comment_id
 *
 * Updates a specific comment.
 * Authorization required: Correct user or admin.
 */
router.patch("/:post_id/comments/:comment_id", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const parsedBody = commentSchema.partial().parse(req.body);

        const comment = await prisma.comment.update({
            where: { id: Number(req.params.comment_id) },
            data: parsedBody,
        });

        return res.json({ comment });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return next(new BadRequestError(err.errors.map(e => e.message)));
        }
        if (err.code === "P2025") {
            return next(new NotFoundError("Comment not found"));
        }
        return next(err);
    }
});

/** DELETE /posts/:post_id/comments/:comment_id
 *
 * Deletes a specific comment.
 * Authorization required: Correct user or admin.
 */
router.delete("/:post_id/comments/:comment_id", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        await prisma.comment.delete({
            where: { id: Number(req.params.comment_id) },
        });

        return res.json({ deleted: req.params.comment_id });
    } catch (err) {
        if (err.code === "P2025") {
            return next(new NotFoundError("Comment not found"));
        }
        return next(err);
    }
});

module.exports = router;

