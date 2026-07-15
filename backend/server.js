require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { connectDatabase } = require('./src/db/database');
const authRoutes = require('./src/routes/auth');
const buddyRoutes = require('./src/routes/buddies');
const checkinRoutes = require('./src/routes/checkins');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/buddies', buddyRoutes);
app.use('/api/checkins', checkinRoutes);

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
