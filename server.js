const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static('public'));

app.get('/movie', (req, res) => {
  res.sendFile(__dirname + '/movie.mp4');
});

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('load video', (videoId) => {
    socket.broadcast.emit('load video', videoId);
  });

  socket.on('video control', (data) => {
    socket.broadcast.emit('video control', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server running...');
});
