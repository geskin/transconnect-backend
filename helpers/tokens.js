const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** return signed JWT from user data. */

function createToken(user) {
    console.assert(user.role !== 'ADMIN',
        "createToken passed user without admin role property");

    let payload = {
        username: user.username,
        role: user.role || 'USER', //|| user,
    };

    return jwt.sign(payload, SECRET_KEY);
}

module.exports = { createToken };
