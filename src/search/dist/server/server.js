"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const handlers_1 = __importDefault(require("./handlers"));
const bodyParser = require('body-parser').json();
function startServer() {
    const port = '2222';
    const app = express_1.default();
    handlers_1.default(app);
    const http = require("http").createServer(app);
    app.use(bodyParser);
    http.listen(parseInt(port), () => {
        console.log(`listening on *:${port}`);
    });
}
exports.default = startServer;
//# sourceMappingURL=server.js.map