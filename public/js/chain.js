async function addTx(tx, pk) {
    return await req({
        url: "/send/",
        method: "post",
        params: {
            status: 0,
            data: { tx, pk }
        }
    })
}

async function getUsers() {
    return await req({
        url: "/users/",
        method: "get"
    })
}