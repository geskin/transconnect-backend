"use strict";

const express = require("express");
const axios = require("axios");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../expressError");

const router = express.Router();

const BATHROOM_API_BASE_URL = "https://www.refugerestrooms.org/api/v1/restrooms";

const API_BASE_URI_FOR_DEV = `${BATHROOM_API_BASE_URL}/by_location?page=1&per_page=50&offset=0&unisex=true&lat=40.776676&lng=-73.971321`

/** GET /bathrooms --> Get all public, unisex bathrooms
 * Optionally sort by location and/or accessibility
 * No auth required
 */
router.get("/", async (req, res, next) => {
    try {
        let { location, accessibility } = req.query;

        const isAccessible = accessibility === "true"; // convert to boolean since will read any non-empty string as truthy

        if (!location) { //if location is undefined provide default NYC coordinates
            location = "lat=40.776676&lng=-73.971321";
        }

        let apiUrl = `${BATHROOM_API_BASE_URL}/by_location?page=1&per_page=50&offset=0&unisex=true&${location}`;

        if (isAccessible) {
            apiUrl = `${BATHROOM_API_BASE_URL}/by_location?page=1&per_page=50&offset=0&ada=true&unisex=true&${location}`;
        }

        const response = await axios.get(apiUrl);

        const bathrooms = response.data;

        return res.json({ bathrooms });
    } catch (err) {
        console.error("Error fetching bathrooms:", err);
        return next(err);
    }
});

module.exports = router;