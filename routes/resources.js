"use strict";

const express = require("express");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const { ensureAdmin } = require("../middleware/auth");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../expressError");

const prisma = new PrismaClient();
const router = express.Router();

/** GET /resources --> Get all resources, sorted alphabetically 
 * optionally sort by search input or tag selection
 * no auth required
*/
router.get("/", async (req, res, next) => {
    try {
        const { searchTerm, type } = req.query;

        const filters = {};
        if (searchTerm) {
            filters.name = { contains: searchTerm, mode: "insensitive" };
        }
        if (type) {
            filters.types = { some: { name: type } };
        }

        const resources = await prisma.resource.findMany({
            where: filters,
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                description: true,
                url: true,
                approved: true,
                userId: true,
                types: true
            }
        });
        return res.json({ resources });
    } catch (err) {
        return next(err);
    }
});

/** GET /resources/types
 * Get all available resource types
 */

router.get("/types", async function (req, res, next) {
    try {
        const types = await prisma.type.findMany({
            select: { name: true, resources: true },
        });

        return res.json({ types });
    } catch (err) {
        return next(err);
    }
});

/** GET /resources/[resource_id] 
 * gets a specific resource
 * 
 * no initial auth required
*/

router.get("/:resource_id", async (req, res, next) => {
    try {
        console.log(req.params);
        const resource_id = parseInt(req.params.resource_id, 10); // Convert to Int

        if (isNaN(resource_id)) {
            throw new BadRequestError("Invalid resource ID.");
        }

        const resource = await prisma.resource.findUnique({
            select: { name: true, description: true, url: true, types: true, user: true, approved: true },
            where: { id: resource_id },
        });
        return res.json({ resource });
    } catch (err) {
        return next(err);
    }
});

/** POST /resources
 * 
 * creates a resource */
router.post("/", async (req, res, next) => {
    try {
        const { name, description, url, types, userId, user } = req.body;

        if (!name || !types) {
            throw new BadRequestError("name and type are required.");
        }

        const resource = await prisma.resource.create({
            data: {
                name,
                description,
                url,
                approved: false,
                user: userId ? { connect: { id: userId } } : undefined,
                types: {
                    connect: types.map(t => ({ name: t }))
                }
            },
        });

        return res.status(201).json({ resource });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /resources/:resource_id --> Edit/update resource (admin only) */
router.patch("/:resource_id", ensureAdmin, async (req, res, next) => {
    try {
        const { resource_id } = req.params;
        const { name, description, url, approved, types } = req.body;

        let dataToUpdate = {};

        if (name !== undefined) dataToUpdate.name = name;
        if (description !== undefined) dataToUpdate.description = description;
        if (url !== undefined) dataToUpdate.url = url;
        if (approved !== undefined) dataToUpdate.approved = approved;

        if (types !== undefined) {
            dataToUpdate.types = {
                connect: types.map((t) => ({ name: t })),
                disconnect: await prisma.resource.findUnique({
                    where: { id: parseInt(resource_id) },
                    select: { types: true }
                }).then((resource) => {
                    const currentTypes = resource?.types.map(t => t.name) || [];
                    const typesToDisconnect = currentTypes.filter(t => !types.includes(t));
                    return typesToDisconnect.map(t => ({ name: t }));
                })
            };
        }

        const resource = await prisma.resource.update({
            where: { id: parseInt(resource_id) },
            data: dataToUpdate,
        });

        return res.json({ resource });
    } catch (err) {
        console.error("Error updating resource:", err);
        return next(err);
    }
});

/** DELETE /resources/:resource_id --> Delete resource (admin only) */
router.delete("/:resource_id", ensureAdmin, async (req, res, next) => {
    try {
        const { resource_id } = req.params;

        await prisma.resource.delete({
            where: { id: parseInt(resource_id) },
        });

        return res.json({ deleted: resource_id });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
