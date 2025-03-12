"use strict";

const express = require("express");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const { ensureAdmin } = require("../middleware/auth");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../expressError");

const prisma = new PrismaClient();
const router = express.Router();

const BATHROOM_API_BASE_URL = "https://www.refugerestrooms.org/api/v1/restrooms"; //by_location?page=1&per_page=50&offset=0&unisex=true

/** GET /resources → Get all resources, sorted alphabetically 
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

/** POST /resources
 * 
 * creates a resource
 * 
 * Bathroom resources must be added via the Refuge Restrooms API */
router.post("/", async (req, res, next) => {
    try {
        const { name, description, url, types, userId, user } = req.body;

        if (!name || !types) {
            throw new BadRequestError("name and type are required.");
        }

        //throw pop up alert that includes link to Refuge API
        if (types.includes("bathroom")) {
            throw new ForbiddenError("Please add bathrooms via the Refuge Restrooms API, not this page.");
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
            // Disconnect types that are unchecked (not present in the updated list)
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
