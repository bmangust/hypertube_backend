"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = exports.createSuccessResponse = void 0;
function createSuccessResponse(data) {
    return {
        status: true,
        data: data
    };
}
exports.createSuccessResponse = createSuccessResponse;
function createErrorResponse(data) {
    return {
        status: false,
        data: data
    };
}
exports.createErrorResponse = createErrorResponse;
//# sourceMappingURL=utils.js.map