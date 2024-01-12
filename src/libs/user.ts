import { createSign, generateKeyPairSync } from "crypto"
import { Blockchain } from "./bockchain"
import { Transaction } from "./transaction"
import { ec as EC } from "elliptic"
import { SHA256 } from "../utils"

export interface IUser {
    addr: string,
    balance: number,
    lockedIn: number,
    lockedOut: number
}

interface IKeyPair {
    public: string,
    private: string
}

export class User {
    public keypair: EC.KeyPair
    public addr: string

    constructor(public chain: Blockchain) {
        let ec = new EC('secp256k1');

        this.keypair = ec.genKeyPair()

        let pkh = this.keypair.getPublic("array")

        this.addr = this.generateAddress(pkh)
    }

    get balance() {
        return this.chain.getBalance(this.addr)
    }

    generateAddress(pk: number[]) {

        let tmpb = pk.slice()
        let a = tmpb.slice(0, tmpb.length / 2)
        let b = tmpb.slice(tmpb.length / 2, tmpb.length)
        tmpb = a.map((v, i) => v ^ b[i])

        a = tmpb.slice(0, tmpb.length / 2)
        b = tmpb.slice(tmpb.length / 2, tmpb.length)
        tmpb = a.map((v, i) => v ^ b[i])

        return tmpb.map((v, i) => v.toString(16)).join("")
    }

    sign(data: any) {
        let hash = SHA256(JSON.stringify(data))
        let sign = this.keypair.sign(hash)
        return sign.toDER("hex")
    }

    sendMoney(to: string, amount: number) {
        if (amount > this.balance.balance) {
            throw Error("amount > balnce")
        }
        let tx = new Transaction(this.addr, to, amount)
        tx.sign = this.sign(tx)

        let r = this.chain.addTx(tx, this.keypair.getPublic("hex"))
    }
}