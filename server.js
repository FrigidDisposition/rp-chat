const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  let currentRoom = 'lobby';
  socket.join(currentRoom);

  socket.on('join room', (room) => {
    socket.leave(currentRoom);
    currentRoom = room;
    socket.join(room);
  });

  socket.on('chat message', (msg) => {
    io.to(msg.room).emit('chat message', msg);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
