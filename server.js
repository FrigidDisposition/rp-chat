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

  // === 🆕 ROOM SHARING ===
  let allRooms = new Set(Object.keys(chatLog)); // Load from existing chatLog

  // Send full room list to the client on connect
  socket.emit('room list', Array.from(allRooms));

  // When a client creates a new room
  socket.on('create room', (room) => {
    if (!allRooms.has(room)) {
      allRooms.add(room);
      chatLog[room] = [];
      saveChatLog();
      io.emit('new room', room); // Broadcast to all clients
    }
  });

  // === Send chat history for default room ===
  socket.emit('chat history', chatLog[currentRoom] || []);

  // When user joins a new room
  socket.on('join room', (room) => {
    socket.leave(currentRoom);
    currentRoom = room;
    socket.join(room);
    socket.emit('chat history', chatLog[room] || []);
  });

  // When a message is sent
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
