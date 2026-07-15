const User = require('../models/User');
const BuddyLink = require('../models/BuddyLink');

function buddySummary(user) {
  return { id: String(user._id), displayName: user.display_name, buddyCode: user.buddy_code };
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

module.exports = { sendRequest, acceptRequest, listBuddies, removeLink, isBuddyWith };
