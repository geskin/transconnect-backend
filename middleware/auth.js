"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
    try {
        const authHeader = req.headers && req.headers.authorization;
        if (authHeader) {
            const token = authHeader.replace(/^[Bb]earer /, "").trim();
            res.locals.user = jwt.verify(token, SECRET_KEY);
        }
        return next();
    } catch (err) {
        return next();
    }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
    try {
        if (!res.locals.user) throw new UnauthorizedError();
        req.user = res.locals.user;
        return next();
    } catch (err) {
        return next(err);
    }
}


/** Middleware to use when they be logged in as an admin user.
 *
 *  If not, raises Unauthorized.
 */

function ensureAdmin(req, res, next) {
    try {
        const user = res.locals.user;
        if (!user) throw new UnauthorizedError();

        if (user.role !== 'ADMIN') {
            throw new UnauthorizedError();
        }
        return next();
    } catch (err) {
        return next(err);
    }
}

/** Middleware to ensure user is correct */

function ensureCorrectUser(req, res, next) {
    try {
        const user = res.locals.user;
        if (!user) throw new UnauthorizedError();
        const { username, userId } = req.params;
        if (user.username !== username || user.id !== userId) {
            throw new UnauthorizedError();
        }
        return next();
    } catch (err) {
        return next(err);
    }
}

/** Middleware to ensure user is correct user or admin.
 *
 *  Works when username or userId is provided as a route param.
 *  If not authorized, raises Unauthorized.
 */

function ensureCorrectUserOrAdmin(req, res, next) {
    try {
        const user = res.locals.user;
        const paramUsername = req.params.username;
        const bodyUsername = req.body.username;

        // console.log("User:", user);
        // console.log("Param Username:", paramUsername);
        // console.log("Body Username:", bodyUsername);

        if (!user) throw new UnauthorizedError();

        if (user.role !== "ADMIN" && user.username !== paramUsername && user.username !== bodyUsername) {
            throw new UnauthorizedError();
        }

        return next();
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    authenticateJWT,
    ensureLoggedIn,
    ensureAdmin,
    ensureCorrectUser,
    ensureCorrectUserOrAdmin,
};
