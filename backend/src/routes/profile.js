const express = require('express');
const {
  updateProfile,
  syncRecoveryStats,
  sharedProfile,
  leaderboard,
} = require('../controllers/profileController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Public, intentionally limited to fields needed for a buddy invitation preview.
router.get('/share/:buddyCode', sharedProfile);

router.use(requireAuth);
router.put('/me', updateProfile);
router.post('/sync-stats', syncRecoveryStats);
router.get('/leaderboard', leaderboard);

module.exports = router;
