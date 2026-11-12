const express = require('express');
const cmoController = require('../controllers/cmoController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { USER_ROLES } = require('../constants/keralaData');

const router = express.Router();

router.use(authenticate, authorizeRoles(USER_ROLES.CMO_ADMIN));

router.get('/stats', cmoController.getCmoStats);
router.get('/officers', cmoController.listDepartmentOfficers);
router.get('/grievances', cmoController.listAllGrievances);
router.patch('/grievances/:id/review', cmoController.reviewGrievance);
router.post('/grievances/:id/assign', cmoController.assignToDepartment);
router.patch('/grievances/:id/escalate', cmoController.escalateGrievance);
router.patch('/grievances/:id/status', cmoController.updateGrievanceStatus);

module.exports = router;
