const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/;
const RESET_CODE_TTL_MS = 15 * 60 * 1000;

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
    username: user.username || null,
    displayName: user.display_name,
    bio: user.bio || '',
    leaderboardOptIn: Boolean(user.leaderboard_opt_in),
    searchDiscoverable: Boolean(user.search_discoverable),
    buddyCode: user.buddy_code,
    hasPassword: Boolean(user.password_hash),
  };
}

async function createUserWithBuddyCode(fields) {
  // Retry in the unlikely event of a buddy code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await User.create({ ...fields, buddy_code: generateBuddyCode() });
    } catch (err) {
      if (err.code !== 11000 || (err.keyPattern && !err.keyPattern.buddy_code)) {
        throw err;
      }
    }
  }
  return null;
}

async function signup(req, res, next) {
  try {
    const { email, password, displayName, username } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password and display name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    let normalizedUsername = null;
    if (username) {
      normalizedUsername = String(username).trim().toLowerCase();
      if (!USERNAME_PATTERN.test(normalizedUsername)) {
        return res.status(400).json({
          error: 'Username must be 3-20 characters using letters, numbers, dots or underscores',
        });
      }
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    if (normalizedUsername) {
      const usernameTaken = await User.findOne({ username: normalizedUsername });
      if (usernameTaken) {
        return res.status(409).json({ error: 'This username is already taken' });
      }
    }

    let user;
    try {
      user = await createUserWithBuddyCode({
        email: email.toLowerCase(),
        username: normalizedUsername || undefined,
        password_hash: bcrypt.hashSync(password, 10),
        display_name: displayName,
      });
    } catch (err) {
      if (err.code === 11000) {
        if (err.keyPattern && err.keyPattern.email) {
          return res.status(409).json({ error: 'An account with this email already exists' });
        }
        if (err.keyPattern && err.keyPattern.username) {
          return res.status(409).json({ error: 'This username is already taken' });
        }
      }
      throw err;
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
    // `identifier` may be an email or a username. `email` kept for older clients.
    const identifier = req.body.identifier || req.body.email;
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email or username, and password are required' });
    }

    const value = String(identifier).trim().toLowerCase();
    const user = value.includes('@')
      ? await User.findOne({ email: value })
      : await User.findOne({ username: value });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.password_hash) {
      return res.status(401).json({
        error: 'This account uses Google sign-in. Use "Continue with Google" instead.',
      });
    }
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ token: createToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function googleAuth(req, res, next) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token is required' });
    }

    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }
    const info = await response.json();

    // When GOOGLE_CLIENT_IDS is set (comma-separated), only accept tokens minted
    // for those OAuth clients.
    const allowedClients = (process.env.GOOGLE_CLIENT_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (allowedClients.length > 0 && !allowedClients.includes(info.aud)) {
      return res.status(401).json({ error: 'Google token was issued for another app' });
    }

    if (!info.sub || !info.email || info.email_verified !== 'true') {
      return res.status(401).json({ error: 'Google account email is not verified' });
    }

    let user = await User.findOne({ google_id: info.sub });

    if (!user) {
      // Link to an existing email/password account with the same address.
      user = await User.findOne({ email: info.email.toLowerCase() });
      if (user) {
        user.google_id = info.sub;
        await user.save();
      }
    }

    if (!user) {
      user = await createUserWithBuddyCode({
        email: info.email.toLowerCase(),
        google_id: info.sub,
        display_name: info.name || info.email.split('@')[0],
      });
      if (!user) {
        return res.status(500).json({ error: 'Could not create account, please try again' });
      }
    }

    res.json({ token: createToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });

    // Always answer the same way so the endpoint can't be used to probe
    // which emails have accounts.
    const genericResponse = {
      message: 'If an account exists for that email, a reset code has been issued.',
    };

    if (!user || !user.password_hash) {
      return res.json(genericResponse);
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    user.reset_code_hash = bcrypt.hashSync(code, 10);
    user.reset_code_expires = new Date(Date.now() + RESET_CODE_TTL_MS);
    await user.save();

    // No email provider is configured yet, so the code is logged on the server.
    // Swap this for an email service (Resend, SendGrid, SES...) when available.
    console.log(`[password-reset] code for ${user.email}: ${code} (valid 15 minutes)`);

    res.json(genericResponse);
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    const expired =
      !user || !user.reset_code_hash || !user.reset_code_expires ||
      user.reset_code_expires.getTime() < Date.now();

    if (expired || !bcrypt.compareSync(String(code), user.reset_code_hash)) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    user.password_hash = bcrypt.hashSync(newPassword, 10);
    user.reset_code_hash = null;
    user.reset_code_expires = null;
    await user.save();

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

module.exports = { signup, login, googleAuth, forgotPassword, resetPassword, me };
