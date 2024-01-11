import MerkleTree from "merkletreejs"
import { sha256 } from "../utils"
import { Transaction } from "./transaction"

export interface Blk {
    data: Transaction[],
    timestamp: number
}

export class Block {
    public nonce: number = 0 // Math.floor(Math.random() * 999999)
    public mekleRoot: string

    constructor(
        public prevHash: string,
        public data: Transaction[],
        public timestamp: number = new Date().getTime()
    ) {
        this.mekleRoot = this.getMerkleRoot()
    }

    getMerkleRoot() {
        let leaves = this.data.map(ts => ts.hash)
        let tree = new MerkleTree(leaves, sha256)
        return tree.getRoot().toString("hex")
    }

    get header() {
        return {
            prevHash: this.prevHash,
            timestamp: this.timestamp,
            nonce: this.nonce,
            merkleRoot: this.mekleRoot
        }
    }

    get hash() {
        return sha256(JSON.stringify(this.header))
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
