/**
 * Socket.io chat handlers — real-time messaging between therapist and client
 */
const chatSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join a room (room = therapistId_clientId)
    socket.on('join_room', ({ roomId }) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });

    // Send message
    socket.on('send_message', ({ roomId, message, senderId, senderType }) => {
      // Emit to all in room except sender
      socket.to(roomId).emit('receive_message', {
        message,
        senderId,
        senderType, // 'therapist' | 'client'
        timestamp: new Date(),
        read: false,
      });
    });

    // Typing indicator
    socket.on('typing', ({ roomId, senderType }) => {
      socket.to(roomId).emit('user_typing', { senderType });
    });

    socket.on('stop_typing', ({ roomId }) => {
      socket.to(roomId).emit('user_stop_typing');
    });

    // Read receipt
    socket.on('mark_read', ({ roomId, senderId }) => {
      socket.to(roomId).emit('message_read', { senderId });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = chatSocket;
