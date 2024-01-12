"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.SHA256 = void 0;
const crypto_1 = require("crypto");
function SHA256(data) {
    const hash = (0, crypto_1.createHash)('SHA256');
    hash.update(data).end();
    return hash.digest('hex');
}
exports.SHA256 = SHA256;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.delay = delay;
