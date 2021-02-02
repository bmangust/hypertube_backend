import express from 'express'
import addHandlers from "./handlers"
import cors from 'cors'
const bodyParser = require('body-parser').json()

export default function startServer() {
    const port = '2222'

    const app = express()

    addHandlers(app)

    const http = require("http").createServer(app)

    app.use(bodyParser)
    app.use(cors())

    http.listen(parseInt(port), () => {
        console.log(`listening on *:${port}`)
    });
}