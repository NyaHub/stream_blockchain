"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
const merkletreejs_1 = __importDefault(require("merkletreejs"));
const utils_1 = require("../utils");
class Block {
    constructor(prevHash, data, index, timestamp = new Date().getTime()) {
        this.prevHash = prevHash;
        this.data = data;
        this.index = index;
        this.timestamp = timestamp;
        this.nonce = 0; // Math.floor(Math.random() * 999999)
        this.mekleRoot = this.getMerkleRoot();
    }
    getMerkleRoot() {
        let leaves = this.data.map(ts => ts.hash);
        let tree = new merkletreejs_1.default(leaves, utils_1.SHA256);
        return tree.getRoot().toString("hex");
    }
    get header() {
        return {
            prevHash: this.prevHash,
            index: this.index,
            timestamp: this.timestamp,
            nonce: this.nonce,
            merkleRoot: this.mekleRoot,
        };
    }
    get hash() {
        return (0, utils_1.SHA256)(JSON.stringify(this.header));
    }
    toString(str = "") {
        return JSON.stringify({
            header: this.header,
            hash: this.hash,
            data: this.data
        }, undefined, str);
    }
    toObj() {
        return {
            header: this.header,
            hash: this.hash,
            data: this.data
        };
    }
}
exports.Block = Block;
