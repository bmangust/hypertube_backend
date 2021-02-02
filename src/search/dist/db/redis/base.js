"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRedis = void 0;
const redis = __importStar(require("redis"));
class BaseRedis {
    constructor() {
        this.initConnection();
    }
    get client() {
        return this._client;
    }
    set client(val) {
        this._client = val;
    }
    get isConnected() {
        return (!!this.client && this.client.connected);
    }
    initConnection() {
        const host = (process.env.REDIS_HOST && process.env.REDIS_HOST.length > 0)
            ? process.env.REDIS_HOST : 'redis';
        const port = (process.env.REDIS_PORT && process.env.REDIS_PORT.length > 0)
            ? process.env.REDIS_PORT : '6379';
        const user = (process.env.REDIS_USER && process.env.REDIS_USER.length > 0)
            ? process.env.REDIS_USER : 'chat_user';
        const password = (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.length > 0)
            ? process.env.REDIS_PASSWORD : 'ffa9203c493aa99';
        const url = `redis://${user}:${password}@${host}:${port}`;
        console.log("Redis url: ", url);
        this.client = redis.createClient({
            url: url
        });
        console.log("Connected to redis: ", this.isConnected);
        this.client.on("error", function (error) {
            console.error("Create client error: ", error);
        });
    }
}
exports.BaseRedis = BaseRedis;
//# sourceMappingURL=base.js.map