// Hard constraints. These rules decide whether a timetable is valid.
// AI suggestions are never used here.

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const overlaps = (a, b) => {
  if (a.day !== b.day) return false;
  const aStart = toMinutes(a.start);
  const bStart = toMinutes(b.start);
  return aStart < bStart + b.durationMins && bStart < aStart + a.durationMins;
};

// Returns every clash between a candidate class and the existing timetable.
// Pass ignoreId when editing a class, so it isn't compared with itself.
export const findConflicts = (entries, candidate, ignoreId = null) => {
  const conflicts = [];

  entries.forEach((entry) => {
    if (entry.id === ignoreId || !overlaps(entry, candidate)) return;

    if (entry.facultyId === candidate.facultyId) {
      conflicts.push({ type: 'teacher', withId: entry.id });
    }
    if (entry.sectionId === candidate.sectionId) {
      conflicts.push({ type: 'section', withId: entry.id });
    }
    if (entry.roomId === candidate.roomId) {
      conflicts.push({ type: 'room', withId: entry.id });
    }
  });

  return conflicts;
};

// Checks that a room suits the course type and has enough seats.
export const checkRoomFit = (room, course, section) => {
  const problems = [];
  if (room.type !== course.roomType) {
    problems.push(`${course.roomType} course needs a ${course.roomType} room`);
  }
  if (room.capacity < section.studentCount) {
    problems.push(`Room holds ${room.capacity}, section has ${section.studentCount} students`);
  }
  return problems;
};