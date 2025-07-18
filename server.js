const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

let hostId = null;
let videoId = null;
let currentTime = 0;
let isPlaying = false;

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  if (!hostId) {
    hostId = socket.id;
    socket.emit("setHost");
  }

  socket.on("join", () => {
    if (socket.id === hostId) socket.emit("setHost");
  });

  socket.on("loadVideo", (id) => {
    videoId = id;
    currentTime = 0;
    isPlaying = false;
    io.emit("loadVideo", videoId);
  });

  socket.on("play", (time) => {
    currentTime = time;
    isPlaying = true;
    io.emit("play", time);
  });

  socket.on("pause", (time) => {
    currentTime = time;
    isPlaying = false;
    io.emit("pause", time);
  });

  socket.on("requestSync", () => {
    socket.emit("sync", {
      videoId,
      time: currentTime,
      isPlaying,
    });
  });

  socket.on("chat", (msg) => {
    socket.broadcast.emit("chat", msg);
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port 3000");
});
