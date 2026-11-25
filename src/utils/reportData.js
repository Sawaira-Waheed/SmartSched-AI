import { DAYS } from '../data/sampleData';
import { buildClashes } from './clashes';

// A teaching week: 5 days x 9 hours (08:00 to 17:00)
export const WEEK_HOURS = DAYS.length * 9;

const minutesFor = (list) => list.reduce((sum, t) => sum + t.durationMins, 0);

// data: { faculty, rooms, departments, courses, sections, timetable } loaded from Supabase
export const buildReport = (access, data) => {
  const { faculty, rooms, departments, courses, sections, timetable } = data;

  const inDept = (deptId) => !access.scoped || deptId === access.departmentId;
  const find = (list, id) => list.find((x) => x.id === id);
  const sectionDept = (sectionId) => find(sections, sectionId)?.departmentId;

  const scopedFaculty = faculty.filter((f) => inDept(f.departmentId));
  const scopedRooms = rooms.filter((r) => inDept(r.departmentId));
  const scopedDepts = departments.filter((d) => inDept(d.id));
  const scopedEntries = timetable.filter((t) => inDept(sectionDept(t.sectionId)));

  const facultyRows = scopedFaculty.map((f) => {
    const mine = timetable.filter((t) => t.facultyId === f.id);
    const hours = minutesFor(mine) / 60;
    const percent = Math.min((hours / f.maxHoursPerWeek) * 100, 100);
    const status =
      hours > f.maxHoursPerWeek ? 'Overloaded' : hours / f.maxHoursPerWeek > 0.85 ? 'Near limit' : 'Comfortable';
    return {
      id: f.id,
      name: f.name,
      department: find(departments, f.departmentId)?.name || 'Unassigned',
      classes: mine.length,
      hours,
      max: f.maxHoursPerWeek,
      percent,
      status,
    };
  });

  const roomRows = scopedRooms.map((r) => {
    const mine = timetable.filter((t) => t.roomId === r.id);
    const hours = minutesFor(mine) / 60;
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      capacity: r.capacity,
      department: find(departments, r.departmentId)?.name || 'Unassigned',
      classes: mine.length,
      hours,
      percent: Math.min((hours / WEEK_HOURS) * 100, 100),
    };
  });

  const deptRows = scopedDepts.map((d) => ({
    id: d.id,
    name: d.name,
    faculty: faculty.filter((f) => f.departmentId === d.id).length,
    courses: courses.filter((co) => co.departmentId === d.id).length,
    sections: sections.filter((sec) => sec.departmentId === d.id).length,
    classes: timetable.filter((t) => sectionDept(t.sectionId) === d.id).length,
  }));

  // Only clashes that involve this user's department
  const clashPairs = buildClashes(timetable).filter(
    (cl) => inDept(sectionDept(cl.a.sectionId)) || inDept(sectionDept(cl.b.sectionId)),
  );
  const clashCounts = { teacher: 0, section: 0, room: 0 };
  clashPairs.forEach((cl) => {
    clashCounts[cl.type] += 1;
  });

  const describe = (e) => ({
    course: find(courses, e.courseId)?.name || '',
    section: find(sections, e.sectionId)?.name || '',
    room: find(rooms, e.roomId)?.name || '',
    teacher: find(faculty, e.facultyId)?.name || '',
    when: `${e.day} ${e.start}`,
  });
  const clashRows = clashPairs.map((cl) => ({ type: cl.type, a: describe(cl.a), b: describe(cl.b) }));

  const perDay = DAYS.map((day) => ({ day, classes: scopedEntries.filter((t) => t.day === day).length }));

  const avg = (list, key) => (list.length ? list.reduce((sum, x) => sum + x[key], 0) / list.length : 0);

  return {
    scopeName: access.scoped ? find(departments, access.departmentId)?.name || 'Your department' : 'All departments',
    kpis: {
      teachers: facultyRows.length,
      classes: scopedEntries.length,
      avgLoad: Math.round(avg(facultyRows, 'percent')),
      overloaded: facultyRows.filter((f) => f.status === 'Overloaded').length,
      roomUtil: Math.round(avg(roomRows, 'percent')),
      clashes: clashPairs.length,
    },
    faculty: facultyRows,
    rooms: roomRows,
    departments: deptRows,
    clashRows,
    clashCounts,
    perDay,
  };
};