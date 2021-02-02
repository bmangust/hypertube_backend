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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const torrent_search_api_1 = __importDefault(require("torrent-search-api"));
const utils = __importStar(require("./utils"));
function addHandlers(app) {
    app.get('/find', (req, res) => {
        const category = req.query['category'].toString();
        const search = req.query['search'].toString();
        torrent_search_api_1.default.enablePublicProviders();
        torrent_search_api_1.default.search(search, category, 20)
            .then(torrents => {
            console.log(`Got ${torrents.length} torrents`);
            res.json(utils.createSuccessResponse(torrents.map(item => ({ title: item.title, magnet: item.magnet })))).status(200);
        })
            .catch(e => {
            console.log(`Error getting torrents: ${e}`);
            res.json(utils.createErrorResponse(e)).status(500);
        });
    });
}
exports.default = addHandlers;
//# sourceMappingURL=handlers.js.map