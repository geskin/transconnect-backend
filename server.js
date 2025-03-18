"use strict";

const app = require("./app");
const { PORT } = require("./config");

app.listen(PORT, function () {
    const host = process.env.HOST || "localhost";
    console.log(`Started on http://${host}:${PORT}`);
});
