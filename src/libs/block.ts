import MerkleTree from "merkletreejs"
import { SHA256 } from "../utils"
import { Transaction } from "./transaction"

export interface Blk {
    data: Transaction[],
    timestamp: number
}

export class Block {
    public nonce: number = 0 // Math.floor(Math.random() * 999999)
    public merkleRoot: string

    constructor(
        public prevHash: string,
        public data: Transaction[],
        public index: number,
        public timestamp: number = new Date().getTime()
    ) {
        this.merkleRoot = this.getMerkleRoot()
    }

    getMerkleRoot() {
        let leaves = this.data.map(ts => ts.hash)
        let tree = new MerkleTree(leaves, SHA256)
        return tree.getRoot().toString("hex")
    }

    get header() {
        return {
            prevHash: this.prevHash,
            index: this.index,
            timestamp: this.timestamp,
            nonce: this.nonce,
            merkleRoot: this.merkleRoot,
        }
    }

    get hash() {
        return SHA256(JSON.stringify(this.header))
    }

    public toString(str: string = "") {
        return JSON.stringify({
            header: this.header,
            hash: this.hash,
            data: this.data
        }, undefined, str)
    }

    public toObj() {
        return {
            header: this.header,
            hash: this.hash,
            data: this.data
        }
    }
}
