const express = require('express');
const http = require('http');
const fs = require('fs');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const CHAT_LOG_FILE = 'chatlog.json';
app.use(express.static('public'));

let chatLog = {};

// Load chat history from file at startup
try {
  const data = fs.readFileSync(CHAT_LOG_FILE);
  chatLog = JSON.parse(data);
} catch (err) {
  console.log("No existing chat log found. Starting fresh.");
}

// Save to file helper
function saveChatLog() {
  fs.writeFileSync(CHAT_LOG_FILE, JSON.stringify(chatLog, null, 2));
}

io.on('connection', (socket) => {
  let currentRoom = 'lobby';
  socket.join(currentRoom);

  // Send message history for the room
  socket.emit('chat history', chatLog[currentRoom] || []);

  socket.on('join room', (room) => {
    socket.leave(currentRoom);
    currentRoom = room;
    socket.join(room);
    socket.emit('chat history', chatLog[room] || []);
  });

  socket.on('chat message', (msg) => {
    if (!chatLog[msg.room]) chatLog[msg.room] = [];
    chatLog[msg.room].push(msg);
    saveChatLog();

    io.to(msg.room).emit('chat message', msg);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
