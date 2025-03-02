import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Store connected users (userId → socketId)
const users = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("register", (userId) => {
    users.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ID: ${socket.id}`);
  });

  socket.on("offer", (payload) => {
    const receiverSocketId = users.get(payload.to);
    if (receiverSocketId) {
      console.log("Sending offer from:", payload.from, "to:", payload.to);
      io.to(receiverSocketId).emit("offer", payload);
    } else {
      console.log("User not found:", payload.to);
    }
  });

  socket.on("answer", (payload) => {
    const receiverSocketId = users.get(payload.to);
    if (receiverSocketId) {
      console.log("Sending answer from:", payload.from, "to:", payload.to);
      io.to(receiverSocketId).emit("answer", payload);
    } else {
      console.log("User not found:", payload.to);
    }
  });

  socket.on("ice-candidate", (payload) => {
    const receiverSocketId = users.get(payload.to);
    if (receiverSocketId) {
      console.log("Sending ICE candidate from:", payload.from, "to:", payload.to);
      io.to(receiverSocketId).emit("ice-candidate", payload);
    } else {
      console.log("User not found:", payload.to);
    }
  });

  socket.on("start-sharing", ({ userId }) => {
    console.log("User started sharing:", userId);
    socket.broadcast.emit("new-user", userId);
  });

  socket.on("stop-sharing", ({ userId }) => {
    console.log("User stopped sharing:", userId);
    socket.broadcast.emit("user-disconnected", userId);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    users.forEach((socketId, userId) => {
      if (socketId === socket.id) {
        users.delete(userId);
      }
    });
  });
});

server.listen(5000, () => console.log("Server is running on port 5000"));
