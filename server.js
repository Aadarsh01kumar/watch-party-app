const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("chat", (msg) => socket.broadcast.emit("chat", msg));
  socket.on("loadVideo", (id) => socket.broadcast.emit("loadVideo", id));
  socket.on("play", () => socket.broadcast.emit("play"));
  socket.on("pause", () => socket.broadcast.emit("pause"));
  socket.on("seek", (time) => socket.broadcast.emit("seek", time));
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
