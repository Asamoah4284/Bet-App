const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

function generateBuddyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createToken(userId) {
  return jwt.sign({ userId: String(userId) }, JWT_SECRET, { expiresIn: '30d' });
}

function publicUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    displayName: user.display_name,
    buddyCode: user.buddy_code,
  };
}

async function signup(req, res, next) {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password and display name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    // Retry in the unlikely event of a buddy code collision
    let user = null;
    for (let attempt = 0; attempt < 5 && !user; attempt++) {
      try {
        user = await User.create({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          display_name: displayName,
          buddy_code: generateBuddyCode(),
        });
      } catch (err) {
        if (err.code !== 11000) throw err;
        // If the duplicate is the email (raced with another signup), report it
        if (err.keyPattern && err.keyPattern.email) {
          return res.status(409).json({ error: 'An account with this email already exists' });
        }
      }
    }

    if (!user) {
      return res.status(500).json({ error: 'Could not create account, please try again' });
    }

    res.status(201).json({ token: createToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ token: createToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, me };
