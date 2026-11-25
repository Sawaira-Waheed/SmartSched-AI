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

// COURSES
export const saveCourse = async (record) => {
  const row = {
    code: record.code,
    name: record.name,
    credit_hours: record.creditHours,
    department_id: record.departmentId,
    classes_per_day: record.classesPerDay,
    duration_mins: record.durationMins,
    room_type: record.roomType,
  };
  if (record.id) {
    const { error } = await supabase.from('courses').update(row).eq('id', record.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('courses').insert({ id: `c${Date.now()}`, ...row });
    if (error) throw new Error(error.message);
  }
};

export const deleteCourse = async (id) => {
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// SECTIONS
export const saveSection = async (record) => {
  const row = {
    name: record.name,
    semester: record.semester,
    student_count: record.studentCount,
    department_id: record.departmentId,
  };
  if (record.id) {
    const { error } = await supabase.from('sections').update(row).eq('id', record.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('sections').insert({ id: `s${Date.now()}`, ...row });
    if (error) throw new Error(error.message);
  }
};

export const deleteSection = async (id) => {
  const { error } = await supabase.from('sections').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// ROOMS
export const saveRoom = async (record) => {
  const row = {
    name: record.name,
    type: record.type,
    capacity: record.capacity,
    department_id: record.departmentId,
  };
  if (record.id) {
    const { error } = await supabase.from('rooms').update(row).eq('id', record.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('rooms').insert({ id: `r${Date.now()}`, ...row });
    if (error) throw new Error(error.message);
  }
};

export const deleteRoom = async (id) => {
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// AVAILABILITY (only "Off" slots are stored; no row means Free)
export const fetchUnavailableSlots = async () =>
  unwrap(supabase.from('availability').select('faculty_id, day, start_hour'));

export const setSlotOff = async ({ facultyId, day, startHour, off }) => {
  if (off) {
    const { error } = await supabase
      .from('availability')
      .upsert({ faculty_id: facultyId, day, start_hour: startHour }, { onConflict: 'faculty_id,day,start_hour' });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('availability')
      .delete()
      .eq('faculty_id', facultyId)
      .eq('day', day)
      .eq('start_hour', startHour);
    if (error) throw new Error(error.message);
  }
};

// NOTIFICATIONS
export const fetchNotifications = async () =>
  unwrap(supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100));

export const fetchNotificationReads = async () => {
  const auth = await supabase.auth.getUser();
  const user = auth.data.user;
  if (!user) return [];
  return unwrap(supabase.from('notification_reads').select('notification_id').eq('user_id', user.id));
};

export const markNotificationsRead = async (ids) => {
  const auth = await supabase.auth.getUser();
  const user = auth.data.user;
  if (!user || ids.length === 0) return;
  const rows = ids.map((id) => ({ user_id: user.id, notification_id: id }));
  const { error } = await supabase
    .from('notification_reads')
    .upsert(rows, { onConflict: 'user_id,notification_id' });
  if (error) throw new Error(error.message);
};

// AUDIT
export const fetchAuditLogs = async () =>
  unwrap(supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200));