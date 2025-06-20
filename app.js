"use strict";

/** Express app for transconnect. */

const express = require("express");
const cors = require("cors");

const { NotFoundError } = require("./expressError");

const { authenticateJWT } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const resourcesRoutes = require("./routes/resources");
const usersRoutes = require("./routes/users");
const postsRoutes = require("./routes/posts");
const bathroomRoutes = require("./routes/bathrooms");
const commentsRoutes = require("./routes/comments");

const morgan = require("morgan");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);

app.use("/auth", authRoutes);
app.use("/resources", resourcesRoutes);
app.use("/users", usersRoutes);
app.use("/posts", postsRoutes);
app.use("/bathrooms", bathroomRoutes);
app.use("/comments", commentsRoutes);


/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
    return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
    if (process.env.NODE_ENV !== "test") console.error(err.stack);
    const status = err.status || 500;
    const message = err.message;

    return res.status(status).json({
        error: { message, status },
    });
});

module.exports = app;
