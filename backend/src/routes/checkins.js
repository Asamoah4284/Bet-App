const express = require('express');
const { createCheckin, myCheckins, buddyCheckins } = require('../controllers/checkinController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', myCheckins);
router.post('/', createCheckin);
router.get('/buddy/:userId', buddyCheckins);

module.exports = router;
