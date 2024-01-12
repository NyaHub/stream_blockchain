import { createVerify } from "crypto"
import { Blk, Block } from "./block"
import { Transaction } from "./transaction"
import { IUser } from "./user"
import { ec as EC } from "elliptic"
import { SHA256 } from "../utils"
import { Sequelize } from "sequelize"
import { initDB } from "./db"

let ec = new EC('secp256k1')

const STORGE = "storage"
const me = "it's me"
const minerReward = 100

export class Blockchain {
    public chain: Block[] = []
    public users: { [index: string]: IUser } = {}
    private mempool: Transaction[] = []
    private db: Sequelize

    constructor(public diff: number = 2) {
        this.db = initDB('sqlite:chain.sqlite')
        this.db.sync()

        this.db.models.Block.findOne({
            order: [['createdAt', 'DESC']]
        }).then((d) => {
            if (d != null) {
                let blk = new Block(
                    d.dataValues.prevHash,
                    [],
                    d.dataValues.index,
                    d.dataValues.timestamp
                )
            } else {
                this.addTx(this.createGenesis(), "")
            }
        })
    }

    private createGenesis() {
        return new Transaction(STORGE, me, 0, "this is genesis block")
    }

    public getLastBlock() {
        if (this.chain.length == 0) {
            return new Block(
                "",
                [],
                0,
            )
        }
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
            this.mempool.slice(),
            this.getLastBlock().index + 1
        )

        block = this.pow(block)

        this.db.models.Block.create({
            index: block.index,
            nonce: block.nonce,
            mekleRoot: block.mekleRoot,
            prevHash: block.prevHash,
            timestamp: block.timestamp,
        }).then(blk => {
            this.mempool = this.mempool.filter((tx) => {
                for (let i of block.data) {
                    if (i.hash === tx.hash) {
                        this.db.models.Transaction.create({
                            sign: tx.sign,
                            from: tx.from,
                            to: tx.to,
                            amount: tx.amount,
                            data: tx.data,
                            timestamp: tx.timestamp,
                            BlockId: blk.dataValues.id
                        })
                        return false
                    }
                }
                return false
            })
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

    public verifySign(data: any, sign: string, pub: string) {
        let key = ec.keyFromPublic(pub, 'hex')
        let hash = SHA256(JSON.stringify(data))
        return key.verify(hash, sign)
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

    public getBalance(addr: string): IUser {
        if (!this.users[addr]) return { balance: 0, lockedOut: 0, lockedIn: 0, addr }
        return this.users[addr]
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