const express = require('express');
const { sendRequest, acceptRequest, listBuddies, removeLink } = require('../controllers/buddyController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', listBuddies);
router.post('/request', sendRequest);
router.post('/:id/accept', acceptRequest);
router.delete('/:id', removeLink);

module.exports = router;
