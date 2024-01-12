class User {

    addr = ""
    keypair = {}
    balance = {
        balance: 0,
        lockedIn: 0,
        lockedOut: 0
    }

    constructor() {
        this.keypair = ec.genKeyPair()

        let pkh = this.keypair.getPublic("array")

        this.addr = this.generateAddress(pkh)

        req({
            url: "/balance/",
            method: "post",
            params: {
                status: 0,
                data: { addres: this.addr }
            }
        }).then((d) => {
            d = JSON.parse(d)
            this.balance = d.data
            console.log(this.balance)
        }).catch(console.log)

        // this.sendMoney = this.sendMoney.bind(this)
        // this.sign = this.sign.bind(this)
    }

    async generateKeys() {
        return await crypto.subtle.generateKey(
            {
                name: "RSA-PSS",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["sign", "verify"])
    }

    generateAddress(pk) {

        let tmpb = pk.slice()
        let a = tmpb.slice(0, tmpb.length / 2)
        let b = tmpb.slice(tmpb.length / 2, tmpb.length)
        tmpb = a.map((v, i) => v ^ b[i])

        a = tmpb.slice(0, tmpb.length / 2)
        b = tmpb.slice(tmpb.length / 2, tmpb.length)
        tmpb = a.map((v, i) => v ^ b[i])

        return tmpb.map((v, i) => v.toString(16)).join("")
    }

    async sign(data) {
        let hash = await SHA256(JSON.stringify(data))
        let sign = this.keypair.sign(hash)
        return sign.toDER("hex")
    }

    async sendMoney(to, amount) {
        if (amount > this.balance) {
            throw Error("amount > balnce")
        }
        let tx = new Transaction(this.addr, to, amount)
        tx.sign = await this.sign(tx)

        let r = await addTx(tx, this.keypair.getPublic("hex"))
        console.log(r)
    }
}



let store = PetiteVue.reactive({
    user: new User(),
    users: [],
})

PetiteVue.createApp({
    store,
    mounted(e) {
        this.getUsers()
    },
    getUsers() {
        getUsers().then((d) => {
            store.users = JSON.parse(d).data
        }).catch(console.log)
        setTimeout(this.getUsers, 5000)
    },
    sendTx(e) {
        store.user.sendMoney(e.target[0].value, parseFloat(e.target[1].value))
    },
    getMoney() {
        req({
            url: "/getmoney/",
            method: "post",
            params: {
                status: 0,
                data: { addres: store.user.addr }
            }
        }).then(d => {
            store.user.balance = JSON.parse(d).data
        }).catch(console.log)
    }
}).mount()