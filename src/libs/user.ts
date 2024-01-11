import { createSign, generateKeyPairSync } from "crypto"
import { Blockchain } from "./bockchain"
import { Transaction } from "./transaction"

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
    public keypair: IKeyPair
    public addr: string

    constructor(public chain: Blockchain) {
        let keypair = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        })

        this.keypair = {
            public: keypair.publicKey.toString(),
            private: keypair.privateKey.toString()
        }

        this.addr = this.generateAddress()
    }

    get balance() {
        return this.chain.getBalance(this.addr)
    }

    private generateAddress() {
        let tmp = this.keypair.public.split("\n")
        tmp.pop()
        tmp.shift()

        let tmpb = Buffer.from(tmp.join(""), "base64")
        let a = tmpb.slice(0, tmpb.length / 2)
        let b = tmpb.slice(tmpb.length / 2, tmpb.length)
        tmpb = Buffer.from(a.map((v, i) => v ^ b[i]))

        for (let i = 0; i < 2; i++) {
            a = tmpb.slice(0, tmpb.length / 2)
            b = tmpb.slice(tmpb.length / 2, tmpb.length)
            tmpb = Buffer.from(a.map((v, i) => v ^ b[i]))
        }

        return tmpb.toString("hex")
    }

    sing(data: any) {
        let sing = createSign("SHA256")
        sing.update(data.toString())
        return sing.sign(this.keypair.private).toString("hex")
    }

    sendMoney(to: string, amount: number) {
        if (amount > this.balance) {
            throw Error("amount > balnce")
        }
        let tx = new Transaction(this.addr, to, amount)
        tx.sign = this.sing(tx)

        this.chain.addTx(tx, this.keypair.public)
    }
}