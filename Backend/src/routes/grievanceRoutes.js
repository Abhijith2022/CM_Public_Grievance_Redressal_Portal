const express = require('express');
const grievanceController = require('../controllers/grievanceController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { USER_ROLES } = require('../constants/keralaData');

const router = express.Router();

router.get('/track/:referenceId', grievanceController.trackByReferenceId);

router.get(
  '/my',
  authenticate,
  authorizeRoles(USER_ROLES.CITIZEN),
  grievanceController.getMyGrievances
);

router.post(
  '/',
  authenticate,
  authorizeRoles(USER_ROLES.CITIZEN),
  upload.array('files', 3),
  grievanceController.submitGrievance
);

router.post(
  '/:id/feedback',
  authenticate,
  authorizeRoles(USER_ROLES.CITIZEN),
  grievanceController.submitFeedback
);

router.post(
  '/:id/reopen',
  authenticate,
  authorizeRoles(USER_ROLES.CITIZEN),
  grievanceController.reopenGrievance
);

router.get('/:id', authenticate, grievanceController.getGrievanceById);

module.exports = router;
