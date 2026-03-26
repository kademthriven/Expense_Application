const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

router.post('/', auth, transactionController.add);
router.get('/', auth, transactionController.getAll);
router.get('/summary', auth, transactionController.summary);
router.get('/export', auth, transactionController.exportExcel);
router.put('/:id', auth, transactionController.update);
router.delete('/:id', auth, transactionController.remove);

module.exports = router;