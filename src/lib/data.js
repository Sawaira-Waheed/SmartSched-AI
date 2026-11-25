import { supabase } from './supabase';

// Shapes database rows into the names the screens already use.
const toFaculty = (r) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  departmentId: r.department_id,
  maxHoursPerWeek: r.max_hours_per_week,
});

const toCourse = (r) => ({
  id: r.id,
  code: r.code,
  name: r.name,
  creditHours: r.credit_hours,
  departmentId: r.department_id,
  classesPerDay: r.classes_per_day,
  durationMins: r.duration_mins,
  roomType: r.room_type,
});

const toSection = (r) => ({
  id: r.id,
  name: r.name,
  semester: r.semester,
  studentCount: r.student_count,
  departmentId: r.department_id,
});

const toRoom = (r) => ({
  id: r.id,
  name: r.name,
  type: r.type,
  capacity: r.capacity,
  departmentId: r.department_id,
});

const toEntry = (r) => ({
  id: r.id,
  courseId: r.course_id,
  sectionId: r.section_id,
  facultyId: r.faculty_id,
  roomId: r.room_id,
  day: r.day,
  start: r.start_time,
  durationMins: r.duration_mins,
});

const unwrap = async (query) => {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
};

// READS: the database already limits each user to their own rows (see RLS rules)
export const fetchDepartments = async () =>
  unwrap(supabase.from('departments').select('id, name').order('name'));

export const fetchFaculty = async () =>
  (await unwrap(supabase.from('faculty').select('*').order('name'))).map(toFaculty);

export const fetchCourses = async () =>
  (await unwrap(supabase.from('courses').select('*').order('code'))).map(toCourse);

export const fetchSections = async () =>
  (await unwrap(supabase.from('sections').select('*').order('name'))).map(toSection);

export const fetchRooms = async () =>
  (await unwrap(supabase.from('rooms').select('*').order('name'))).map(toRoom);

export const fetchTimetable = async () =>
  (await unwrap(supabase.from('timetable').select('*'))).map(toEntry);

// WRITES: the database rejects anything outside the user's role and department
export const saveFaculty = async (record) => {
  const row = {
    name: record.name,
    email: record.email,
    department_id: record.departmentId,
    max_hours_per_week: record.maxHoursPerWeek,
  };
  if (record.id) {
    const { error } = await supabase.from('faculty').update(row).eq('id', record.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('faculty').insert({ id: `f${Date.now()}`, ...row });
    if (error) throw new Error(error.message);
  }
};

export const deleteFaculty = async (id) => {
  const { error } = await supabase.from('faculty').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const saveTimetableEntry = async (record) => {
  const { error } = await supabase.from('timetable').insert({
    id: `t${Date.now()}`,
    course_id: record.courseId,
    section_id: record.sectionId,
    faculty_id: record.facultyId,
    room_id: record.roomId,
    day: record.day,
    start_time: record.start,
    duration_mins: record.durationMins,
  });
  if (error) throw new Error(error.message);
};

export const deleteTimetableEntry = async (id) => {
  const { error } = await supabase.from('timetable').delete().eq('id', id);
  if (error) throw new Error(error.message);
};