const express = require('express');
const {
  getPrefs,
  updatePrefs,
  registerDevice,
  unregisterDevice,
  scheduleUrgeFollowup,
} = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/prefs', getPrefs);
router.put('/prefs', updatePrefs);
router.post('/devices', registerDevice);
router.delete('/devices', unregisterDevice);
router.post('/urge-followup', scheduleUrgeFollowup);

module.exports = router;
