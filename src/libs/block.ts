import MerkleTree from "merkletreejs"
import { SHA256 } from "../utils"
import { ITransaction, Transaction } from "./transaction"

export interface Blk {
    data: Transaction[],
    timestamp: number
}

export interface IBlock {
    index: number
    nonce: number
    // merkleRoot: string
    // hash: string
    prevHash: string
    timestamp: number,
    data?: ITransaction[]
}

export class Block {
    public nonce: number = Math.floor(Math.random() * 999999)
    private _merkleRoot: string

    constructor(
        private _prevHash: string,
        private _data: Transaction[],
        private _index: number,
        private _timestamp: number = new Date().getTime()
    ) {
        this._merkleRoot = this.getMerkleRoot()
    }

    static create(blk: IBlock) {
        let txs: Transaction[] = []

        if (!blk.data) throw Error("Block not contains txs")

        for (let tx of blk.data) {
            txs.push(Transaction.create(tx))
        }

        let ret = new Block(
            blk.prevHash,
            txs,
            blk.index,
            blk.timestamp
        )

        ret.nonce = blk.nonce
        return ret
    }

    get prevHash() {
        return this._prevHash
    }
    get data() {
        return this._data
    }
    get index() {
        return this._index
    }
    get timestamp() {
        return this._timestamp
    }
    get merkleRoot() {
        return this._merkleRoot
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
