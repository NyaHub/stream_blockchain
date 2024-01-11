import { sha256 } from "../utils";

export class Transaction {
    public sign: string;
    constructor(
        public from: string,
        public to: string,
        public amount: number,
        public data: string = ""
    ) {
        this.sign = ""
    }

    get hash() {
        return sha256(JSON.stringify({
            from: this.from,
            to: this.to,
            amount: this.amount,
            data: this.data,
        }))
    }
    toString() {
        return this.hash
    }
}