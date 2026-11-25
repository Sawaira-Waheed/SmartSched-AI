import { findConflicts } from './conflicts';

// Every clash once, found from the timetable rows the user can see.
export const buildClashes = (entries) => {
  const seen = new Set();
  const out = [];
  entries.forEach((e) => {
    findConflicts(entries, e, e.id).forEach((cf) => {
      const other = entries.find((x) => x.id === cf.withId);
      if (!other) return;
      const key = `${[e.id, other.id].sort().join('|')}|${cf.type}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ key, type: cf.type, a: e, b: other });
    });
  });
  return out;
};