"use strict";

const request = require("supertest");
const app = require("../app");

describe("GET /bathrooms", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get(`/bathrooms`);

        expect(resp.statusCode).toEqual(200);

        expect(resp.body).toHaveProperty("bathrooms");

        expect(Array.isArray(resp.body.bathrooms)).toBe(true);

        if (resp.body.bathrooms.length > 0) {
            expect(resp.body.bathrooms[0]).toHaveProperty("city");
            expect(resp.body.bathrooms[0]).toHaveProperty("accessible");
        }
    });

    test("filters bathrooms by accessibility", async function () {
        const resp = await request(app).get(`/bathrooms?accessibility=true`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toHaveProperty("bathrooms");

        if (resp.body.bathrooms.length > 0) {
            resp.body.bathrooms.forEach(bathroom => {
                expect(bathroom.accessible).toBe(true);
            });
        }
    });

    test("filters bathrooms by location", async function () {
        const location = "lat=40.776676&lng=-73.971321"; // example location coordinates
        const resp = await request(app).get(`/bathrooms?${location}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toHaveProperty("bathrooms");

        if (resp.body.bathrooms.length > 0) {
            expect(resp.body.bathrooms[0]).toHaveProperty("city");
        }
    });

});
