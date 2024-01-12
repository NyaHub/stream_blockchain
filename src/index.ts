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

function miner() {
    chain.addBlock(bob.addr)
    setTimeout(miner, 5000)
}

// for (let blk of chain.chain) {
//     console.log(blk.toString("\t"))
// }

console.log(`bob: ${bob.balance.balance}, alice: ${ailce.balance.balance}`)

interface IData {
    status: number, // 0 - ok, 1 - any error
    error?: any,
    data: any
}

const app = experss()
app.use(bodyParser.json())
app.use(experss.static(path.join(process.cwd(), "public")))

const port = args.port || 8080

app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json")
    next()
})

app.get("/blockchain/", (req, res) => {
    res.send({
        status: 0,
        data: chain.toObj()
    })
})

app.get("/users/", (req, res) => {
    res.send({
        status: 0,
        data: chain.users
    })
})

app.post("/getmoney/", (req, res) => {
    let data: IData = req.body
    if (!data.data.addres) {
        res.sendStatus(404)
        res.send({
            status: 1,
            error: "Not sent addres!"
        })
    }

    bob.sendMoney(data.data.addres, 10)

    res.send({
        status: 0,
        data: chain.getBalance(data.data.addres)
    })
})

app.post("/send/", (req, res) => {
    let data: IData = req.body
    console.log(data.data.tx)

    try {
        let intx = data.data.tx
        let tx = new Transaction(intx.from, intx.to, intx.amount)
        tx.sign = intx.sign
        chain.addTx(tx, data.data.pk)
        res.send({
            status: 0,
            data: ""
        })
    } catch (e) {
        let msg: string = ""
        if (typeof e === "string") {
            msg = e.toUpperCase() // works, `e` narrowed to string
        } else if (e instanceof Error) {
            msg = e.message // works, `e` narrowed to Error
        }
        res.send({
            status: 1,
            data: msg
        })
    }
})

app.post("/balance/", (req, res) => {
    let data: IData = req.body
    if (!data.data.addres) {
        res.sendStatus(404)
        res.send({
            status: 1,
            error: "Not sent addres!"
        })
    }

    res.send({
        status: 0,
        data: chain.getBalance(data.data.addres)
    })
})


app.listen(port, () => {
    console.log("listening on ")
    miner()
})
