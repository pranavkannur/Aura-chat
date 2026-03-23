const Message = require('../models/Message');
const { getReceiverSocketId, io } = require('../index');

exports.sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user._id;

  try {
    const message = await Message.create({
      senderId,
      receiverId,
      content
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', message);
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
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
    res.status(500).json({ message: 'Server error' });
  }
};
