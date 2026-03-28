const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiController = require('../controllers/aiController');

router.post('/suggest-category', auth, aiController.suggestCategory);
router.get('/insights', auth, aiController.getInsights);

module.exports = router;