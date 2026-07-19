const express = require('express');
const {
  searchUsers,
  sendRequest,
  acceptRequest,
  listBuddies,
  removeLink,
} = require('../controllers/buddyController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', listBuddies);
router.get('/search', searchUsers);
router.post('/request', sendRequest);
router.post('/:id/accept', acceptRequest);
router.delete('/:id', removeLink);

module.exports = router;
