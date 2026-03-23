const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user._id;

  try {
    const message = await Message.create({
      senderId,
      receiverId,
      content
    });
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
