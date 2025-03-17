const jwt = require("jsonwebtoken");

const { createToken } = require("../helpers/tokens");

const { SECRET_KEY } = require("../config");

describe("createToken", function () {

    test("works: not admin", function () {
        const token = createToken({ username: "test", role: "USER" });

        const payload = jwt.verify(token, SECRET_KEY);

        expect(payload).toEqual({
            iat: expect.any(Number),
            username: "test",
            role: "USER",
        });
    });

    test("works: admin", function () {
        const token = createToken({ username: "test", role: "ADMIN" });

        const payload = jwt.verify(token, SECRET_KEY);

        expect(payload).toEqual({
            iat: expect.any(Number),
            username: "test",
            role: "ADMIN",
        });
    });

    test("works: default role", function () {
        const token = createToken({ username: "test" });

        const payload = jwt.verify(token, SECRET_KEY);

        expect(payload).toEqual({
            iat: expect.any(Number),
            username: "test",
            role: "USER",
        });
    });

});
