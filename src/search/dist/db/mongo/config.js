"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersCollection = exports.usersDb = exports.DSN = void 0;
const MONGO_USER = process.env.MONGO_USER || "admin";
const MONGO_PASSWD = process.env.MONGO_PASSWORD || "passwd";
const MONGO_ADDR = process.env.MONGO_ADDRESS || "localhost:27017";
exports.DSN = `mongodb://${MONGO_USER}:${MONGO_PASSWD}@${MONGO_ADDR}/`;
exports.usersDb = `hypertube`;
exports.usersCollection = `search`;
console.log(exports.DSN);
//# sourceMappingURL=config.js.map