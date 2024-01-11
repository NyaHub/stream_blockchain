import { createVerify } from "crypto"
import { Blk, Block } from "./block"
import { Transaction } from "./transaction"
import { IUser } from "./user"

const STORGE = "storage"
const me = "it's me"
const minerReward = 100

export class Blockchain {
    public chain: Block[] = []
    public users: { [index: string]: IUser } = {}
    private mempool: Transaction[] = []

    constructor(public diff: number = 2) {
        this.addTx(this.createGenesis(), "")
    }

    private createGenesis() {
        return new Transaction(STORGE, me, 0, "this is genesis block")
    }

    public getLastBlock() {
        return this.chain[this.chain.length - 1]
    }

    public pow(blk: Block) {
        console.log("Mining...")

        const d = new Array(this.diff + 1).join("0")

        while (true) {
            let hash = blk.hash
            if (hash.slice(0, this.diff) == d) {
                console.log(hash)
                console.log("Solve: ", blk.nonce)
                break
            }
            blk.nonce++
        }

        return blk
    }

    public addBlock(miner: string) {
        let phash = this.getLastBlock() ? this.getLastBlock().hash : ""
        let block = new Block(
            phash,
            this.mempool.slice()
        )

        block = this.pow(block)

        this.mempool = this.mempool.filter((tx) => {
            for (let i of block.data) {
                if (i.hash === tx.hash) return false
            }
            return false
        })

        for (let tx of block.data) {
            this.users[tx.from].lockedOut -= tx.amount
            this.users[tx.to].lockedIn -= tx.amount
            this.users[tx.to].balance += tx.amount
        }

        this.addTx(new Transaction(
            STORGE,
            miner,
            minerReward,
            "REWARD"
        ), "")

        this.chain.push(block)
    }

    public verifySign(data: any, sign: string, key: string) {
        const verify = createVerify('SHA256')
        verify.update(data.toString())
        return verify.verify(key, sign)
    }

    public addTx(tx: Transaction, key: string) {
        if (!this.users[tx.from]) {
            this.users[tx.from] = {
                addr: tx.from,
                balance: 0,
                lockedIn: 0,
                lockedOut: 0
            }
        }
        if (!this.users[tx.to]) {
            this.users[tx.to] = {
                addr: tx.to,
                balance: 0,
                lockedIn: 0,
                lockedOut: 0
            }
        }
        if (tx.from != STORGE && this.users[tx.from].balance < tx.amount) {
            throw Error("tx.amount  > from.balance")
        }

        if (tx.from != STORGE && this.verifySign(tx, tx.sign, key)) {
            throw Error("sing not vaild")
        }

        this.users[tx.from].balance -= tx.amount
        this.users[tx.from].lockedOut += tx.amount
        this.users[tx.to].lockedIn += tx.amount

        this.mempool.push(tx)
    }

    public getBalance(addr: string): number {
        if (!this.users[addr]) return 0
        return this.users[addr].balance
    }

    public toString(str: string = "") {
        let chain = []

        for (let blk of this.chain) {
            chain.push(blk.toObj())
        }

        return JSON.stringify(chain, undefined, str)
    }
    public toObj() {
        let chain = []

        for (let blk of this.chain) {
            chain.push(blk.toObj())
        }

        return chain
    }
}