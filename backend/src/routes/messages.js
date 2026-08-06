const express = require('express');
const { listThread, sendMessage } = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/with/:userId', listThread);
router.post('/', sendMessage);

module.exports = router;
