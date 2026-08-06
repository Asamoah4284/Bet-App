require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { connectDatabase } = require('./src/db/database');
const authRoutes = require('./src/routes/auth');
const buddyRoutes = require('./src/routes/buddies');
const checkinRoutes = require('./src/routes/checkins');
const messageRoutes = require('./src/routes/messages');
const profileRoutes = require('./src/routes/profile');
const shieldRoutes = require('./src/routes/shield');
const notificationRoutes = require('./src/routes/notifications');
const subscriptionRoutes = require('./src/routes/subscription');
const { startNotificationCron } = require('./src/services/notificationCron');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/buddy/:buddyCode', async (req, res, next) => {
  try {
    const User = require('./src/models/User');
    const user = await User.findOne({ buddy_code: req.params.buddyCode.toUpperCase() });
    if (!user) return res.status(404).send('Buddy profile not found');
    const safeName = String(user.display_name).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
    const code = user.buddy_code;
    res.send(`<!doctype html><html><head><meta name="viewport" content="width=device-width">
      <title>Add ${safeName} on Quibet</title><style>
      body{font-family:system-ui;background:#F5F7FA;color:#2B2D42;display:grid;place-items:center;
      min-height:100vh;margin:0}.card{background:white;border-radius:24px;padding:32px;max-width:360px;
      box-shadow:0 12px 40px #2B2D4214;text-align:center}a{display:block;background:#1E3A5F;color:white;
      padding:14px;border-radius:14px;text-decoration:none;font-weight:700;margin-top:20px}
      .code{letter-spacing:4px;font-size:26px;font-weight:800;color:#1E3A5F}</style></head>
      <body><main class="card"><h1>${safeName}</h1><p>wants to connect as an accountability buddy on Quibet.</p>
      <p class="code">${code}</p><a href="quibet://buddy/${code}">Open in Quibet</a>
      <p>If the app does not open, enter the code above in the Buddies tab.</p></main></body></html>`);
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/buddies', buddyRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/shield', shieldRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscription', subscriptionRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

connectDatabase()
  .then(async () => {
    const { ensureSeeded } = require('./src/controllers/shieldController');
    await ensureSeeded();
    startNotificationCron();
    // Bind all interfaces so Expo Go on a physical phone can reach this PC over LAN.
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Quibet backend running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    console.error('Is MongoDB running? Set MONGODB_URI if you use a remote database (e.g. Atlas).');
    process.exit(1);
  });
