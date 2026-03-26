const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const premiumController = require('../controllers/premiumController');

router.post('/create-order', auth, premiumController.createPremiumOrder);
router.get('/verify', premiumController.verifyPremiumOrder);
router.post('/webhook', premiumController.cashfreeWebhook);
router.get('/status', auth, premiumController.getPremiumStatus);

module.exports = router;