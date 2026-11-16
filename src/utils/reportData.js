import { DAYS, DEPARTMENTS, FACULTY, COURSES, SECTIONS, ROOMS, TIMETABLE } from '../data/sampleData';
import { findConflicts } from './conflicts';

// A teaching week: 5 days x 9 hours (08:00 to 17:00)
export const WEEK_HOURS = DAYS.length * 9;

const deptName = (id) => DEPARTMENTS.find((d) => d.id === id)?.name || 'Unassigned';
const sectionDept = (sectionId) => SECTIONS.find((sec) => sec.id === sectionId)?.departmentId;
const minutesFor = (list) => list.reduce((sum, t) => sum + t.durationMins, 0);

const describe = (e) => ({
  course: COURSES.find((co) => co.id === e.courseId)?.name || '',
  section: SECTIONS.find((sec) => sec.id === e.sectionId)?.name || '',
  room: ROOMS.find((r) => r.id === e.roomId)?.name || '',
  teacher: FACULTY.find((f) => f.id === e.facultyId)?.name || '',
  when: `${e.day} ${e.start}`,
});

// Each clash appears once, even though it is found from both classes
const findClashPairs = () => {
  const seen = new Set();
  const out = [];
  TIMETABLE.forEach((e) => {
    findConflicts(TIMETABLE, e, e.id).forEach((cf) => {
      const other = TIMETABLE.find((x) => x.id === cf.withId);
      if (!other) return;
      const key = `${[e.id, other.id].sort().join('|')}|${cf.type}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ type: cf.type, a: e, b: other });
    });
  });
  return out;
};

// Registrar sees every department. HOD sees only their own department.
export const buildReport = (access = { scoped: false }) => {
  const inDept = (deptId) => !access.scoped || deptId === access.departmentId;

  const scopedFaculty = FACULTY.filter((f) => inDept(f.departmentId));
  const scopedRooms = ROOMS.filter((r) => inDept(r.departmentId));
  const scopedDepts = DEPARTMENTS.filter((d) => inDept(d.id));
  const scopedEntries = TIMETABLE.filter((t) => inDept(sectionDept(t.sectionId)));

  const faculty = scopedFaculty.map((f) => {
    const mine = TIMETABLE.filter((t) => t.facultyId === f.id);
    const hours = minutesFor(mine) / 60;
    const percent = Math.min((hours / f.maxHoursPerWeek) * 100, 100);
    const status =
      hours > f.maxHoursPerWeek ? 'Overloaded' : hours / f.maxHoursPerWeek > 0.85 ? 'Near limit' : 'Comfortable';
    return {
      id: f.id,
      name: f.name,
      department: deptName(f.departmentId),
      classes: mine.length,
      hours,
      max: f.maxHoursPerWeek,
      percent,
      status,
    };
  });

  const rooms = scopedRooms.map((r) => {
    const mine = TIMETABLE.filter((t) => t.roomId === r.id);
    const hours = minutesFor(mine) / 60;
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      capacity: r.capacity,
      department: deptName(r.departmentId),
      classes: mine.length,
      hours,
      percent: Math.min((hours / WEEK_HOURS) * 100, 100),
    };
  });

  const departments = scopedDepts.map((d) => ({
    id: d.id,
    name: d.name,
    faculty: FACULTY.filter((f) => f.departmentId === d.id).length,
    courses: COURSES.filter((co) => co.departmentId === d.id).length,
    sections: SECTIONS.filter((sec) => sec.departmentId === d.id).length,
    classes: TIMETABLE.filter((t) => sectionDept(t.sectionId) === d.id).length,
  }));

  // A clash is shown when either of its classes belongs to the user's department
  const clashPairs = findClashPairs().filter(
    (cl) => inDept(sectionDept(cl.a.sectionId)) || inDept(sectionDept(cl.b.sectionId)),
  );
  const clashCounts = { teacher: 0, section: 0, room: 0 };
  clashPairs.forEach((cl) => {
    clashCounts[cl.type] += 1;
  });
  const clashRows = clashPairs.map((cl) => ({ type: cl.type, a: describe(cl.a), b: describe(cl.b) }));

  const perDay = DAYS.map((day) => ({ day, classes: scopedEntries.filter((t) => t.day === day).length }));

  // Earlier weeks are sample history until clash logs are stored in the database.
  // A department sees a smaller share of the history than the whole institution.
  const scale = access.scoped ? 0.5 : 1;
  const h = (v) => Math.round(v * scale);
  const trend = [
    { label: 'Wk 1', teacher: h(4), section: h(3), room: h(2) },
    { label: 'Wk 2', teacher: h(3), section: h(2), room: h(2) },
    { label: 'Wk 3', teacher: h(2), section: h(2), room: h(1) },
    { label: 'Now', ...clashCounts },
  ];

  const avgLoad = faculty.length ? faculty.reduce((sum, f) => sum + f.percent, 0) / faculty.length : 0;
  const roomUtil = rooms.length ? rooms.reduce((sum, r) => sum + r.percent, 0) / rooms.length : 0;

  return {
    scopeName: access.scoped ? deptName(access.departmentId) : 'All departments',
    kpis: {
      teachers: faculty.length,
      classes: scopedEntries.length,
      avgLoad: Math.round(avgLoad),
      overloaded: faculty.filter((f) => f.status === 'Overloaded').length,
      roomUtil: Math.round(roomUtil),
      clashes: clashPairs.length,
    },
    faculty,
    rooms,
    departments,
    clashRows,
    clashCounts,
    perDay,
    trend,
  };
};