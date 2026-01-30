const express = require('express');
const {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeachersStats,
  updateTeacherStudentCount,
  teacherLogin,
  getTeacherStudents,
  getTeacherAttendance
} = require('../controllers/teacherController.js');
const {
  teacherCheckout,
  getTeacherTodayAttendance
} = require('../controllers/teacherCheckoutController.js');

const router = express.Router();

router.post('/login', teacherLogin);
router.post('/checkout', teacherCheckout);
router.get('/attendance/today/:teacherId', getTeacherTodayAttendance);
router.get('/', getTeachers);
router.get('/stats', getTeachersStats);
router.get('/:id', getTeacherById);
router.post('/', createTeacher);
router.put('/:id', updateTeacher);
router.put('/:id/update-student-count', updateTeacherStudentCount);
router.delete('/:id', deleteTeacher);
router.get('/:teacherId/students', getTeacherStudents);
router.get('/attendance', getTeacherAttendance);

module.exports = router;
