"use strict";

const express = require("express");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const { ensureAdmin } = require("../middleware/auth");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../expressError");

const prisma = new PrismaClient();
const router = express.Router();

const BATHROOM_API_BASE_URL = "https://www.refugerestrooms.org/api/v1/restrooms"; //by_location?page=1&per_page=50&offset=0&unisex=true

/** GET /resources → Get all resources, sorted alphabetically */
router.get("/", async (req, res, next) => {
    try {
        const resources = await prisma.resource.findMany({
            orderBy: { name: "asc" },
        });
        return res.json({ resources });
    } catch (err) {
        return next(err);
    }
});

/** GET /resources/search?nameLike=query&location=location&type=type
 * Search resources by name, location, and/or type.
 */
router.get("/search", async (req, res, next) => {
    try {
        const { nameLike, location, type } = req.query;

        // Validate that at least one search parameter is provided
        if (!nameLike && !location && !type) {
            throw new BadRequestError("At least one of the search parameters (nameLike, location, type) is required.");
        }

        const whereConditions = {};

        // Name search (case-insensitive partial match)
        if (nameLike) {
            whereConditions.name = { contains: nameLike, mode: "insensitive" };
        }

        // Location search
        if (location) {
            whereConditions.location = { contains: location, mode: "insensitive" };
        }

        // Type search (matching resource types)
        if (type) {
            if (type.toLowerCase() === "bathroom") {
                const response = await axios.get(BATHROOM_API_BASE_URL, {
                    params: { per_page: 50, unisex: true }, //add functionality for listing ADA accessible unisex bathrooms when queried
                });
                return res.json({ bathrooms: response.data });
            } else {
                whereConditions.type = { some: { name: type } };
            }
        }

        const resources = await prisma.resource.findMany({
            where: whereConditions,
        });

        return res.json({ resources });
    } catch (err) {
        return next(err);
    }
});


/** GET /resources/:location → Get resources by location */
// router.get("/:location", async (req, res, next) => {
//     try {
//         const { location } = req.params;

//         const resources = await prisma.resource.findMany({
//             where: {
//                 description: { contains: location, mode: "insensitive" },
//             },
//         });

//         return res.json({ resources });
//     } catch (err) {
//         return next(err);
//     }
// });

// /** GET /resources/:type → Get resources by type */
// router.get("/:type", async (req, res, next) => {
//     try {
//         const { type } = req.params;

//         // Bathrooms → Fetch from Refuge Restrooms API instead
//         if (type.toLowerCase() === "bathroom") {
//             const response = await axios.get(BATHROOM_API_BASE_URL, {
//                 params: { per_page: 50, unisex: true }, //add functionality for listing ADA accessible unisex bathrooms when queried
//             });
//             return res.json({ bathrooms: response.data });
//         }

//         const resources = await prisma.resource.findMany({
//             where: { type: { some: { name: type } } },
//         });

//         return res.json({ resources });
//     } catch (err) {
//         return next(err);
//     }
// });

/** Bathroom resources must be added via the Refuge Restrooms API */
router.post("/", async (req, res, next) => {
    try {
        const { name, description, url, userId, type } = req.body;

        if (!name || !userId || !type) {
            throw new BadRequestError("Name, userId, and type are required.");
        }

        if (type.includes("bathroom")) {
            throw new ForbiddenError("Please add bathrooms via the Refuge Restrooms API, not this page.");
        }

        const resource = await prisma.resource.create({
            data: {
                name,
                description,
                url,
                approved: false,
                userId,
                type: { connect: type.map((t) => ({ name: t })) },
            },
        });

        return res.status(201).json({ resource });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /resources/:resource_id → Edit resource (admin only) */
router.patch("/:resource_id", ensureAdmin, async (req, res, next) => {
    try {
        const { resource_id } = req.params;
        const { name, description, url, approved, type } = req.body;

        const resource = await prisma.resource.update({
            where: { id: parseInt(resource_id) },
            data: {
                name,
                description,
                url,
                approved,
                type: type ? { connect: type.map((t) => ({ name: t })) } : undefined,
            },
        });

        return res.json({ resource });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /resources/:resource_id → Delete resource (admin only) */
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
