const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const premiumController = require('../controllers/premiumController');

router.post('/create-order', auth, premiumController.createPremiumOrder);
router.get('/status', auth, premiumController.getPremiumStatus);
router.get('/leaderboard', auth, premiumController.getLeaderboard);
router.get('/check-order/:orderId', auth, premiumController.checkPremiumOrderStatus);
router.post('/cancel-order/:orderId', auth, premiumController.cancelPremiumOrder);

router.get('/verify', premiumController.verifyPremiumOrder);
router.post('/webhook', premiumController.cashfreeWebhook);

module.exports = router;