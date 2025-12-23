const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

// Team member endpoints
router.get('/members', teamController.getTeamMembers);
router.post('/members/invite', teamController.inviteTeamMember);
router.put('/members/:id', teamController.updateTeamMember);
router.delete('/members/:id', teamController.removeTeamMember);
router.get('/members/:id/performance', teamController.getMemberPerformance);
router.put('/members/:id/permissions', teamController.updateMemberPermissions);
router.put('/members/:id/role', teamController.updateMemberRole);

// Team roles endpoint
router.get('/roles', teamController.getRoles);

// Team analytics endpoint
router.get('/analytics', teamController.getTeamAnalytics);

// Basic team management endpoints
router.get('/', (req, res) => {
    res.json({ message: 'Team management endpoint - To be implemented' });
});

module.exports = router;