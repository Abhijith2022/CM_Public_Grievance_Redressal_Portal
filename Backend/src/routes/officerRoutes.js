const express = require('express');
const officerController = require('../controllers/officerController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { USER_ROLES } = require('../constants/keralaData');

const router = express.Router();

router.use(authenticate, authorizeRoles(USER_ROLES.DEPARTMENT_OFFICER));

router.get('/stats', officerController.getOfficerStats);
router.get('/grievances', officerController.listDepartmentGrievances);
router.patch('/grievances/:id/progress', officerController.updateInvestigationProgress);
router.post(
  '/grievances/:id/action-report',
  upload.array('files', 3),
  officerController.submitActionReport
);

module.exports = router;
