const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.get('/', auth, reportController.getPremiumReport);
router.get('/download', auth, reportController.downloadPremiumReport);
router.get('/history', auth, reportController.getDownloadHistory);
router.delete('/history/:fileId', auth, reportController.deleteDownloadRecord);

router.post(
  '/upload-rendered-pdf',
  auth,
  express.raw({ type: 'application/pdf', limit: '20mb' }),
  reportController.uploadRenderedPdf
);

module.exports = router;