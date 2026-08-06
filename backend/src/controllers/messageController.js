const Message = require('../models/Message');
const User = require('../models/User');
const { isBuddyWith } = require('./buddyController');

const MAX_BODY = 1000;

function serializeMessage(message, currentUserId) {
  return {
    id: String(message._id),
    senderId: String(message.sender),
    receiverId: String(message.receiver),
    body: message.body,
    createdAt: message.created_at,
    readAt: message.read_at,
    mine: String(message.sender) === String(currentUserId),
  };
}

// GET /api/messages/with/:userId — thread with an accepted buddy
async function listThread(req, res, next) {
  try {
    const otherId = req.params.userId;
    if (!(await isBuddyWith(req.userId, otherId))) {
      return res.status(403).json({ error: 'You are not buddies with this user' });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const query = {
      $or: [
        { sender: req.userId, receiver: otherId },
        { sender: otherId, receiver: req.userId },
      ],
    };

    if (req.query.before) {
      const before = new Date(req.query.before);
      if (!Number.isNaN(before.getTime())) {
        query.created_at = { $lt: before };
      }
    }

    const rows = await Message.find(query).sort({ created_at: -1 }).limit(limit);
    const chronological = rows.reverse();

    // Mark inbound unread as read when opening the thread
    await Message.updateMany(
      {
        sender: otherId,
        receiver: req.userId,
        read_at: null,
      },
      { read_at: new Date() }
    );

    res.json({
      messages: chronological.map((message) => serializeMessage(message, req.userId)),
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/messages — send a message to an accepted buddy
async function sendMessage(req, res, next) {
  try {
    const toUserId = String(req.body.toUserId || '').trim();
    const body = String(req.body.body || '').trim();

    if (!toUserId) {
      return res.status(400).json({ error: 'Recipient is required' });
    }
    if (!body) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    if (body.length > MAX_BODY) {
      return res.status(400).json({ error: `Message must be ${MAX_BODY} characters or fewer` });
    }
    if (toUserId === String(req.userId)) {
      return res.status(400).json({ error: 'You cannot message yourself' });
    }
    if (!(await isBuddyWith(req.userId, toUserId))) {
      return res.status(403).json({ error: 'You are not buddies with this user' });
    }

    const message = await Message.create({
      sender: req.userId,
      receiver: toUserId,
      body,
    });

    const author = await User.findById(req.userId).select('display_name');
    const preview = body.length > 80 ? `${body.slice(0, 79)}…` : body;
    const { notifyUser } = require('./notificationController');
    notifyUser(toUserId, {
      title: author?.display_name || 'Buddy message',
      body: preview,
      data: {
        type: 'buddy_message',
        screen: 'BuddyChat',
        userId: String(req.userId),
        displayName: author?.display_name || 'Buddy',
      },
      channelId: 'social',
      requireBuddyEvents: true,
    });

    res.status(201).json({ message: serializeMessage(message, req.userId) });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listThread,
  sendMessage,
};
