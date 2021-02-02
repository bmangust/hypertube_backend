"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoUser = void 0;
const mongodb_1 = __importDefault(require("mongodb"));
const config_1 = require("./config");
class MongoUser {
    constructor() {
        this.initConnection().catch(console.warn);
    }
    get connection() {
        return this._connection;
    }
    set connection(val) {
        this._connection = val;
    }
    initConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mongoClient = new mongodb_1.default.MongoClient(config_1.DSN, { useUnifiedTopology: true });
                this._connection = yield mongoClient.connect();
                console.log("Mongo connection succeded!");
            }
            catch (e) {
                console.log("Failed to connect to mongo: ", e);
                throw "Connection error!";
            }
        });
    }
}
exports.MongoUser = MongoUser;
// export const MongoManager = new MongoUser()
//# sourceMappingURL=mongo.js.map