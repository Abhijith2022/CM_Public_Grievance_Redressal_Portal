const express = require('express');
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/optimize-complaint', aiController.optimizeComplaint);
router.post('/analyze-grievance', aiController.analyzeGrievance);
router.post('/grievances/:id/analyze', aiController.reanalyzeExistingGrievance);

module.exports = router;
