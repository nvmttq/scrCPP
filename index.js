const express = require('express')
const app = express();
const server = require('http').createServer(app)
const io = require('socket.io')(server)


const path = require('path');
const rooms = {}

app.use(express.static("public"))
app.get("/", (req, res) => {
    const roomId = "java";
    res.redirect("/room/" + roomId)
})
app.get("/room/:roomid", (req, res) => {
    if(rooms[req.params.roomid]?.length >= 2) {
        res.send("<h1>ASLDJASLDJASLKD</h1>")
    }
    else {
        res.sendFile(path.resolve("./views/index.html"))
    }
})

io.on("connection", socket => {
    socket.on("new-user", ({roomId,peerId}) => {
        if(rooms[roomId]) {
            socket.emit("another-user", rooms[roomId][0]);
            rooms[roomId].push(peerId)
        }
        else {
            rooms[roomId] = [peerId]
        }
    })
})
server.listen(3000, () => {console.log("Server * 3000")})