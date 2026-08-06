const express = require('express');
const {
  getSubscription,
  startTrial,
  activate,
  initializePayment,
  confirmPayment,
  moolreWebhook,
} = require('../controllers/subscriptionController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Public webhook (Moolre callback). Unlock is verified on confirm-payment.
router.post('/webhook/moolre', moolreWebhook);

router.use(requireAuth);
router.get('/', getSubscription);
router.post('/start-trial', startTrial);
router.post('/activate', activate);
router.post('/initialize-payment', initializePayment);
router.post('/confirm-payment', confirmPayment);

module.exports = router;
