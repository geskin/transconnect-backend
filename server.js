"use strict";

const app = require("./app");
const { PORT } = require("./config");

app.listen(PORT, "0.0.0.0", function () {
    console.log(`Server running on port ${PORT}`);
});

