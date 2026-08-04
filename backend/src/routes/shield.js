const express = require('express');
const { listTargets } = require('../controllers/shieldController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/targets', listTargets);

module.exports = router;
