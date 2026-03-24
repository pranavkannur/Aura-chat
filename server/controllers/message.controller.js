const Message = require('../models/Message');
const { getReceiverSocketId, io } = require('../socket');

exports.sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user._id;

  try {
    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver and content are required' });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      content
    });

    try {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId && io) {
        io.to(receiverSocketId).emit('newMessage', message);
      }
    } catch (socketErr) {
      console.error("Socket Emission Error:", socketErr);
      // We don't return 500 here because the message IS saved to DB
    }

    res.status(201).json(message);
  } catch (err) {
    console.error("SendMessage Error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  const { userId } = req.params;
  const senderId = req.user._id;

  try {
    const messages = await Message.find({
      $or: [
        { senderId, receiverId: userId },
        { senderId: userId, receiverId: senderId }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("GetMessages Error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
