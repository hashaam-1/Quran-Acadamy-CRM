const express = require('express');
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsStats,
  getStudentsByTeacher,
  resendStudentCredentials,
  studentLogin
} = require('../controllers/studentController.js');

const {
  studentCheckout,
  getStudentTodayAttendance,
  autoCheckoutStudents
} = require('../controllers/studentCheckoutController.js');

const router = express.Router();

router.post('/login', studentLogin);
router.get('/', getStudents);
router.get('/stats', getStudentsStats);
router.get('/teacher/:teacherId', getStudentsByTeacher);
router.get('/:id', getStudentById);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.post('/:id/resend-credentials', resendStudentCredentials);

// Student checkout routes
router.post('/checkout', studentCheckout);
router.get('/:studentId/today-attendance', getStudentTodayAttendance);
router.post('/auto-checkout', autoCheckoutStudents);

module.exports = router;
