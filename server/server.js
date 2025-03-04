const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const frontendUrl = process.env.FRONTEND_URL;
const port = process.env.PORT || 5001;

app.use(cors({ origin: frontendUrl, methods: ["GET", "POST"] })); // Allow frontend requests

const io = socketIo(server, {
  cors: {
    origin: frontendUrl,
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("offer", (offer) => {
    socket.broadcast.emit("offer", offer);
  });

  socket.on("answer", (answer) => {
    socket.broadcast.emit("answer", answer);
  });

  socket.on("ice-candidate", (candidate) => {
    socket.broadcast.emit("ice-candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

server.listen(port, () => {
  console.log(`Signaling server running on port ${port}`);
});
