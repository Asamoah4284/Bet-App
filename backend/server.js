require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { connectDatabase } = require('./src/db/database');
const authRoutes = require('./src/routes/auth');
const buddyRoutes = require('./src/routes/buddies');
const checkinRoutes = require('./src/routes/checkins');
const profileRoutes = require('./src/routes/profile');

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
      <title>Add ${safeName} on Betapp</title><style>
      body{font-family:system-ui;background:#F5F7FB;color:#1A1F36;display:grid;place-items:center;
      min-height:100vh;margin:0}.card{background:white;border-radius:24px;padding:32px;max-width:360px;
      box-shadow:0 12px 40px #1B215022;text-align:center}a{display:block;background:#2F3A8F;color:white;
      padding:14px;border-radius:14px;text-decoration:none;font-weight:700;margin-top:20px}
      .code{letter-spacing:4px;font-size:26px;font-weight:800;color:#2F3A8F}</style></head>
      <body><main class="card"><h1>${safeName}</h1><p>wants to connect as an accountability buddy on Betapp.</p>
      <p class="code">${code}</p><a href="betapp://buddy/${code}">Open in Betapp</a>
      <p>If the app does not open, enter the code above in the Buddies tab.</p></main></body></html>`);
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/buddies', buddyRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/profile', profileRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Betapp backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    console.error('Is MongoDB running? Set MONGODB_URI if you use a remote database (e.g. Atlas).');
    process.exit(1);
  });
