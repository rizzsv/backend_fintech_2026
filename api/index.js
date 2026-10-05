"use strict";
/**
 * Vercel Serverless Function Entrypoint
 *
 * Exports the Express app for Vercel to handle as a serverless function.
 * This file is only used in Vercel production deployment.
 *
 * Local development still uses src/server.ts with server.listen().
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../src/app"));
// Export the Express app as the default Vercel handler
exports.default = app_1.default;
//# sourceMappingURL=index.js.map