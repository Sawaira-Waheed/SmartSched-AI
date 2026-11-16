// Single source of truth for the side drawer.
// roles: which logins can see each item. Edit here to show or hide modules.
export const ROLES = {
  REGISTRAR: 'registrar',
  HOD: 'hod',
  FACULTY: 'faculty',
};

const { REGISTRAR, HOD, FACULTY } = ROLES;
const EVERYONE = [REGISTRAR, HOD, FACULTY];
const ADMIN = [REGISTRAR, HOD];

// key must match a screen name registered in App.js (lowercase)
export const MENU = [
  { key: 'dashboard', label: 'Dashboard', glyph: '◉', roles: EVERYONE },
  { key: 'timetable', label: 'Timetable', glyph: '▦', roles: EVERYONE },
  { key: 'faculty', label: 'Faculty', glyph: '◎', roles: ADMIN },
  { key: 'availability', label: 'Availability', glyph: '◷', roles: EVERYONE },
  { key: 'courses', label: 'Courses', glyph: '▤', roles: ADMIN },
  { key: 'sections', label: 'Sections', glyph: '▥', roles: ADMIN },
  { key: 'rooms', label: 'Rooms', glyph: '⌂', roles: ADMIN },
  { key: 'aischeduling', label: 'AI Scheduling', glyph: '✦', roles: ADMIN },
  { key: 'conflicts', label: 'Conflicts', glyph: '!', roles: ADMIN },
  { key: 'notifications', label: 'Notifications', glyph: '◔', roles: EVERYONE },
  { key: 'reports', label: 'Reports', glyph: '▲', roles: [REGISTRAR, HOD] },
  { key: 'audit', label: 'Audit Logs', glyph: '≡', roles: ADMIN },
  { key: 'profile', label: 'Profile', glyph: '○', roles: EVERYONE },
  { key: 'settings', label: 'Settings', glyph: '◍', roles: EVERYONE },
];