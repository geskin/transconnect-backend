"use strict";

/** Database setup for transconnect. */
const { PrismaClient } = require('@prisma/client');
const { getDatabaseUri } = require('./config');

let db;

if (process.env.NODE_ENV === "production") {
    db = new PrismaClient({
        datasources: {
            db: {
                url: getDatabaseUri(),
            },
        },
    });
} else {
    db = new PrismaClient();
}

db.$connect();

module.exports = db;
