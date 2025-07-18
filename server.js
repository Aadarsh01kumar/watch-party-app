const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let hostId = null;
let currentVideoId = null;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  if (!hostId) {
    hostId = socket.id;
    socket.emit('setHost');
  }

  if (currentVideoId) {
    socket.emit('setVideo', currentVideoId);
  }

  socket.on('videoSelected', (videoId) => {
    currentVideoId = videoId;
    io.emit('setVideo', videoId);
  });

  socket.on('play', () => socket.broadcast.emit('play'));
  socket.on('pause', () => socket.broadcast.emit('pause'));
  socket.on('seek', (time) => socket.broadcast.emit('seek', time));
  socket.on('chatMessage', (msg) => socket.broadcast.emit('chatMessage', msg));

  socket.on('disconnect', () => {
    if (socket.id === hostId) hostId = null;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
