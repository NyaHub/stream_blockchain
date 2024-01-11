import minimist from "minimist";
import { Blockchain } from "./libs/bockchain";
import { User } from "./libs/user";
import experss from "express"
import bodyParser from "body-parser";
import path from "node:path";
import { Transaction } from "./libs/transaction";

let args = minimist(process.argv.slice(2))


let chain = new Blockchain()

let ailce = new User(chain)
let bob = new User(chain)

chain.addBlock(bob.addr)

// console.log(`bob: ${bob.balance}, alice: ${ailce.balance}`)
chain.addBlock(bob.addr)

// console.log(`bob: ${bob.balance}, alice: ${ailce.balance}`)
bob.sendMoney(ailce.addr, 20)

chain.addBlock(bob.addr)

// for (let blk of chain.chain) {
//     console.log(blk.toString("\t"))
// }

// console.log(`bob: ${bob.balance}, alice: ${ailce.balance}`)

const app = experss()
app.use(bodyParser.json())
app.use(experss.static(path.join(process.cwd(), "public")))

const port = args.port || 8080

app.get("/blockchain/", (req, res) => {
    res.send(chain.toObj())
})

app.post("/send/", (req, res) => {
    let tx = <Transaction>req.body.tx // Transaction
    // req.body.key // public key
    // chain.addTx()
    console.log(tx)
})


app.listen(port, () => {
    console.log("listening on ")
})
