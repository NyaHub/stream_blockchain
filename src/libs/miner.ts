import { Blockchain } from "./bockchain";
import { Event } from "./event";
import { User } from "./user";

const TIMEOUT = 5000

export class Miner {
    private mine: boolean = true

    constructor(private event: Event, private chain: Blockchain, private user: User) {
        event.on("moned", this.onMined.bind(this))
    }

    private onMined() {
        this.mine = false
    }

    public pow() {
        let blk = this.chain.createBlock()
        this.mine = true

        console.log("Mining...")

        const d = new Array(this.chain.diff + 1).join("0")

        while (this.mine) {
            let hash = blk.hash
            if (hash.slice(0, this.chain.diff) == d) {
                console.log(hash)
                console.log("Solve: ", blk.nonce)
                break
            }
            blk.nonce++
        }

        this.chain.addBlock(blk, this.user.addr)

        setTimeout(this.pow, TIMEOUT)
    }
}