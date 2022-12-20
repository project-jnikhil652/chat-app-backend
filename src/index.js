const express = require("express");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(express.static("./public"));
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.sendFile("./public/index.html");
});

let activeSockets = [];
io.on("connection", (socket) => {
    const existingSocket = activeSockets.find(
        (existingSocket) => existingSocket === socket.id
    );

    if (!existingSocket) {
        activeSockets.push(socket.id);

        socket.emit("update-user-list", {
            users: activeSockets.filter(
                (existingSocket) => existingSocket !== socket.id
            ),
        });

        socket.broadcast.emit("update-user-list", {
            users: [socket.id],
        });
    }

    socket.on("call-user", (data) => {
        socket.to(data.to).emit("call-made", {
            offer: data.offer,
            socket: socket.id,
        });
    });

    socket.on("make-answer", (data) => {
        socket.to(data.to).emit("answer-made", {
            socket: socket.id,
            answer: data.answer,
        });
    });

    socket.on("reject-call", (data) => {
        socket.to(data.from).emit("call-rejected", {
            socket: socket.id,
        });
    });

    socket.on("disconnect", () => {
        activeSockets = activeSockets.filter(
            (existingSocket) => existingSocket !== socket.id
        );
        socket.broadcast.emit("remove-user", {
            socketId: socket.id,
        });
    });
});
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));