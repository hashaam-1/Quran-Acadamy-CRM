const express = require('express');
const {
  getTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getTeamStats,
  resendCredentials,
  teamMemberLogin
} = require('../controllers/teamMemberController.js');

const router = express.Router();

router.post('/login', teamMemberLogin);
router.get('/', getTeamMembers);
router.get('/stats', getTeamStats);
router.get('/:id', getTeamMemberById);
router.post('/', createTeamMember);
router.post('/:id/resend-credentials', resendCredentials);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);

module.exports = router;
