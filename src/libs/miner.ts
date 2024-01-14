import { Blockchain } from "./bockchain";
import { Event } from "./event";
import { User } from "./user";

const TIMEOUT = 5000

export class Miner {
    private mine: boolean = true

    constructor(private event: Event, private chain: Blockchain, private user: User) {
        event.on("toggleMiner", this.toggle.bind(this))
    }

    private toggle() {
        this.mine = !this.mine
    }

    public pow() {
        let blk = this.chain.createBlock()

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

        this.chain.addMinedBock(blk, this.user.addr)

        this.event.emit("anonceBlock", blk.hash)

        setTimeout(this.pow.bind(this), TIMEOUT)
    }
}