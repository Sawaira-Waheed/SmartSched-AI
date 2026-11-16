// SAMPLE DATA: replace with database values once the backend is connected.

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const DEPARTMENTS = [
  { id: 'cs', name: 'Computer Science' },
  { id: 'bba', name: 'Business Administration' },
  { id: 'math', name: 'Mathematics' },
];

export const FACULTY = [
  { id: 'f1', name: 'Dr. Ahmed', departmentId: 'cs', maxHoursPerWeek: 20, email: 'ahmed@uni.edu' },
  { id: 'f2', name: 'Ms. Sara', departmentId: 'cs', maxHoursPerWeek: 18, email: 'sara@uni.edu' },
  { id: 'f3', name: 'Mr. Usman', departmentId: 'math', maxHoursPerWeek: 16, email: 'usman@uni.edu' },
];

export const COURSES = [
  { id: 'c1', code: 'CS-201', name: 'Data Structures', creditHours: 3, departmentId: 'cs', classesPerDay: 1, durationMins: 60, roomType: 'Lecture' },
  { id: 'c2', code: 'CS-301', name: 'Database Systems', creditHours: 3, departmentId: 'cs', classesPerDay: 1, durationMins: 90, roomType: 'Lecture' },
  { id: 'c3', code: 'CS-310', name: 'Operating Systems Lab', creditHours: 1, departmentId: 'cs', classesPerDay: 1, durationMins: 120, roomType: 'Lab' },
  { id: 'c4', code: 'MTH-101', name: 'Calculus', creditHours: 3, departmentId: 'math', classesPerDay: 1, durationMins: 60, roomType: 'Lecture' },
];

export const SECTIONS = [
  { id: 's1', name: 'CS-2B', departmentId: 'cs', semester: 2, studentCount: 42 },
  { id: 's2', name: 'CS-3A', departmentId: 'cs', semester: 3, studentCount: 38 },
  { id: 's3', name: 'BBA-3A', departmentId: 'bba', semester: 3, studentCount: 45 },
  { id: 's4', name: 'MTH-1A', departmentId: 'math', semester: 1, studentCount: 36 },
];

export const ROOMS = [
  { id: 'r1', name: 'A-101', type: 'Lecture', capacity: 60, departmentId: 'cs' },
  { id: 'r2', name: 'B-204', type: 'Lecture', capacity: 40, departmentId: 'cs' },
  { id: 'r3', name: 'Lab 2', type: 'Lab', capacity: 30, departmentId: 'cs' },
  { id: 'r4', name: 'BBA-201', type: 'Lecture', capacity: 50, departmentId: 'bba' },
  { id: 'r5', name: 'M-110', type: 'Lecture', capacity: 35, departmentId: 'math' },
];

// One entry per scheduled class
export const TIMETABLE = [
  { id: 't1', courseId: 'c1', sectionId: 's1', facultyId: 'f2', roomId: 'r1', day: 'Mon', start: '09:00', durationMins: 60 },
  { id: 't2', courseId: 'c2', sectionId: 's2', facultyId: 'f1', roomId: 'r2', day: 'Mon', start: '10:00', durationMins: 90 },
  { id: 't3', courseId: 'c3', sectionId: 's2', facultyId: 'f1', roomId: 'r3', day: 'Tue', start: '11:00', durationMins: 120 },
  { id: 't4', courseId: 'c1', sectionId: 's1', facultyId: 'f2', roomId: 'r1', day: 'Wed', start: '14:00', durationMins: 60 },
];