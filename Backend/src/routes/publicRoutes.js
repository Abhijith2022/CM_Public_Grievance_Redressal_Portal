const express = require('express');
const publicController = require('../controllers/publicController');
const dbMiddleware = require('../middleware/dbMiddleware');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { USER_ROLES } = require('../constants/keralaData');

const router = express.Router();

router.get('/public/overview', dbMiddleware, publicController.getOverview);
router.get('/departments', dbMiddleware, publicController.getDepartments);
router.get('/departments/:id', dbMiddleware, publicController.getDepartmentById);
router.post('/contact', dbMiddleware, publicController.submitContactEnquiry);
router.get(
  '/contact',
  dbMiddleware,
  authenticate,
  authorizeRoles(USER_ROLES.CMO_ADMIN),
  publicController.listContactEnquiries
);

module.exports = router;
