import minimist from "minimist";
import { Blockchain } from "./libs/bockchain";
import { User } from "./libs/user";
import experss from "express"
import bodyParser from "body-parser";
import path from "node:path";
import { Transaction } from "./libs/transaction";
import { Event } from "./libs/event";
import { Miner } from "./libs/miner";
import { IBlock } from "./libs/block";

let args = minimist(process.argv.slice(2))


let event = new Event()

let chain = new Blockchain(event)

let ailce = new User(chain)
let bob = new User(chain)

let miner = new Miner(event, chain, bob)

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

app.get("/blockchain/", async (req, res) => {
    res.send({
        status: 0,
        data: await chain.toObj()
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
        let tx = new Transaction(intx.from, intx.to, intx.amount, intx.fee)
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

/*

{
    status: ??
    data: {
        block: IBlock
    }
}

*/
app.post("/anonce_block/", async (req, res) => {
    let block: IBlock = req.body.data.block
    let r = await chain.verifyBlock(block)

    if (!r) return res.send({
        status: 1,
        data: "",
        error: "Block not valid!"
    })


})



app.post("/anonce_tx/", (req, res) => {

})


async function start() {
    await chain.init(miner.pow.bind(miner))
    await app.listen(port)
    console.log("listening on ")
}
start()
