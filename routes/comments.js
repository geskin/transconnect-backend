"use strict";

/** Routes for comments. */

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");
const { ensureCorrectUserOrAdmin, ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError, NotFoundError } = require("../expressError");

const prisma = new PrismaClient();
const router = express.Router();

const commentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty"),
});

/** GET /comments/:post_id 
 * 
 * Get all comments for a particular post
 * 
 * Auth required: logged in
*/

router.get("/:post_id", ensureLoggedIn, async function (req, res, next) {
    try {
        console.debug(`Post ID: ${req.params}`);

        const comments = await prisma.comment.findMany({
            where: { postId: Number(req.params.post_id) },
            select: {
                id: true,
                content: true,
                createdAt: true,
                postId: true,
                author: {
                    select: { username: true }
                }
            }
        });

        return res.json({ comments });
    } catch (err) {
        return next(err);
    }
});

/** GET /comments/:post_id/:comment_id
 * 
 * Gets one specific comment from a post
 * 
 * Authorization required: logged in user
 */

router.get("/:post_id/:comment_id", ensureLoggedIn, async function (req, res, next) {
    try {
        // Ensure the post exists
        const post = await prisma.post.findUnique({
            where: { id: Number(req.params.post_id) }
        });

        if (!post) {
            return next(new NotFoundError("Post not found"));
        }

        // Fetch the comment
        const comment = await prisma.comment.findUnique({
            where: { id: Number(req.params.comment_id) }
        });

        if (!comment) {
            return next(new NotFoundError("Comment not found"));
        }

        if (comment.postId !== post.id) {
            return next(new BadRequestError("Comment does not belong to the specified post"));
        }

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


/** POST /comments/:post_id/
 *
 * Adds a new comment to a post.
 * Authorization required: Logged in user.
 */
router.post("/:post_id", ensureLoggedIn, async function (req, res, next) {
    try {
        const { content, authorId } = req.body;

        // Check if the post exists by its post_id before creating a comment
        const post = await prisma.post.findUnique({
            where: { id: Number(req.params.post_id) }
        });

        if (!post) {
            return next(new NotFoundError('Post not found'));
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                postId: Number(req.params.post_id),
                authorId,
            },
        });

        //write a select query for grabbing the new comment with author username to display on frontend

        return res.status(201).json({ comment });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return next(new BadRequestError(err.errors.map(e => e.message)));
        }
        return next(err);
    }
});

/** PATCH /comments/:post_id/:comment_id
 *
 * Updates a specific comment.
 * Authorization required: Correct user or admin.
 */
router.patch("/:post_id/:comment_id", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const { comment, username } = req.body;
        // console.log("Extracted post:", comment, "User username:", username);

        const updatedComment = await prisma.comment.update({
            where: { id: Number(req.params.comment_id) },
            data: {
                content: comment
            },
        });

        // console.log("updated comment in backend", updatedComment);

        return res.json({ updatedComment });
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

/** DELETE /comments/:post_id/:comment_id
 *
 * Deletes a specific comment.
 * Authorization required: Correct user or admin.
 */
router.delete("/:post_id/:comment_id", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const { post_id, comment_id } = req.params;

        const comment = await prisma.comment.findFirst({
            where: {
                id: Number(comment_id),
                postId: Number(post_id),
            },
        });

        if (!comment) {
            return next(new NotFoundError("Comment not found or does not belong to the specified post"));
        }

        await prisma.comment.delete({
            where: { id: Number(comment_id) },
        });

        return res.json({ deleted: comment_id });
    } catch (err) {
        if (err.code === "P2025") {
            return next(new NotFoundError("Comment not found"));
        }
        return next(err);
    }
});

module.exports = router;