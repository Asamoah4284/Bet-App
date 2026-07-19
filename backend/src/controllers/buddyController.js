const User = require('../models/User');
const BuddyLink = require('../models/BuddyLink');

function buddySummary(user) {
  return {
    id: String(user._id),
    displayName: user.display_name,
    username: user.username || null,
    buddyCode: user.buddy_code,
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Search only people who explicitly allow discovery. Email and recovery data are never returned.
async function searchUsers(req, res, next) {
  try {
    const query = String(req.query.q || '').trim().slice(0, 40);
    if (query.length < 2) {
      return res.status(400).json({ error: 'Enter at least 2 characters to search' });
    }

    const matcher = new RegExp(escapeRegex(query), 'i');
    const users = await User.find({
      _id: { $ne: req.userId },
      search_discoverable: true,
      $or: [{ display_name: matcher }, { username: matcher }],
    })
      .select('_id display_name username bio buddy_code')
      .sort({ display_name: 1 })
      .limit(20);

    const userIds = users.map((user) => user._id);
    const links = await BuddyLink.find({
      $or: [
        { requester: req.userId, receiver: { $in: userIds } },
        { requester: { $in: userIds }, receiver: req.userId },
      ],
    });

    const relationships = new Map();
    for (const link of links) {
      const sentByMe = String(link.requester) === req.userId;
      const otherId = String(sentByMe ? link.receiver : link.requester);
      relationships.set(otherId, {
        linkId: String(link._id),
        relationship:
          link.status === 'accepted' ? 'buddy' : sentByMe ? 'outgoing' : 'incoming',
      });
    }

    res.json({
      results: users.map((user) => ({
        ...buddySummary(user),
        bio: user.bio || '',
        relationship: 'none',
        ...relationships.get(String(user._id)),
      })),
    });
  } catch (err) {
    next(err);
  }
}

// Send a buddy request using the other person's buddy code
async function sendRequest(req, res, next) {
  try {
    const { buddyCode } = req.body;

    if (!buddyCode) {
      return res.status(400).json({ error: 'Buddy code is required' });
    }

    const receiver = await User.findOne({ buddy_code: buddyCode.trim().toUpperCase() });

    if (!receiver) {
      return res.status(404).json({ error: 'No user found with that buddy code' });
    }
    if (String(receiver._id) === req.userId) {
      return res.status(400).json({ error: 'You cannot add yourself as a buddy' });
    }

    const existing = await BuddyLink.findOne({
      $or: [
        { requester: req.userId, receiver: receiver._id },
        { requester: receiver._id, receiver: req.userId },
      ],
    });

    if (existing) {
      const msg =
        existing.status === 'accepted' ? 'You are already buddies' : 'A request is already pending';
      return res.status(409).json({ error: msg });
    }

    await BuddyLink.create({ requester: req.userId, receiver: receiver._id });

    res.status(201).json({ message: `Buddy request sent to ${receiver.display_name}` });
  } catch (err) {
    next(err);
  }
}

// Accept a pending request received by the current user
async function acceptRequest(req, res, next) {
  try {
    const link = await BuddyLink.findOneAndUpdate(
      { _id: req.params.id, receiver: req.userId, status: 'pending' },
      { status: 'accepted' }
    );

    if (!link) {
      return res.status(404).json({ error: 'Buddy request not found' });
    }
    res.json({ message: 'Buddy request accepted' });
  } catch (err) {
    next(err);
  }
}

// List accepted buddies and pending requests (sent and received)
async function listBuddies(req, res, next) {
  try {
    const links = await BuddyLink.find({
      $or: [{ requester: req.userId }, { receiver: req.userId }],
    })
      .populate('requester')
      .populate('receiver');

    const buddies = [];
    const incomingRequests = [];
    const outgoingRequests = [];

    for (const link of links) {
      const iAmRequester = String(link.requester._id) === req.userId;
      const other = iAmRequester ? link.receiver : link.requester;
      const item = { linkId: String(link._id), ...buddySummary(other) };

      if (link.status === 'accepted') {
        buddies.push(item);
      } else if (iAmRequester) {
        outgoingRequests.push(item);
      } else {
        incomingRequests.push(item);
      }
    }

    res.json({ buddies, incomingRequests, outgoingRequests });
  } catch (err) {
    next(err);
  }
}

// Remove a buddy or cancel/decline a request
async function removeLink(req, res, next) {
  try {
    const result = await BuddyLink.deleteOne({
      _id: req.params.id,
      $or: [{ requester: req.userId }, { receiver: req.userId }],
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Buddy link not found' });
    }
    res.json({ message: 'Removed' });
  } catch (err) {
    next(err);
  }
}

async function isBuddyWith(userId, otherId) {
  const link = await BuddyLink.findOne({
    status: 'accepted',
    $or: [
      { requester: userId, receiver: otherId },
      { requester: otherId, receiver: userId },
    ],
  });
  return !!link;
}

module.exports = {
  searchUsers,
  sendRequest,
  acceptRequest,
  listBuddies,
  removeLink,
  isBuddyWith,
};
