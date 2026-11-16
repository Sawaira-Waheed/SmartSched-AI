import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import * as XLSX from 'xlsx';

const round1 = (n) => Math.round(n * 10) / 10;

// Turns the report into tables. Each table becomes a CSV block and an Excel sheet.
export const buildTables = (r) => [
  {
    name: 'Summary',
    headers: ['Metric', 'Value'],
    rows: [
      ['Teachers', r.kpis.teachers],
      ['Scheduled classes', r.kpis.classes],
      ['Average teacher load %', r.kpis.avgLoad],
      ['Overloaded teachers', r.kpis.overloaded],
      ['Average room utilization %', r.kpis.roomUtil],
      ['Clashes', r.kpis.clashes],
    ],
  },
  {
    name: 'Faculty workload',
    headers: ['Teacher', 'Department', 'Classes', 'Hours', 'Max hours', 'Load %', 'Status'],
    rows: r.faculty.map((f) => [f.name, f.department, f.classes, round1(f.hours), f.max, Math.round(f.percent), f.status]),
  },
  {
    name: 'Rooms',
    headers: ['Room', 'Type', 'Capacity', 'Department', 'Classes', 'Hours', 'Utilization %'],
    rows: r.rooms.map((x) => [x.name, x.type, x.capacity, x.department, x.classes, round1(x.hours), Math.round(x.percent)]),
  },
  {
    name: 'Departments',
    headers: ['Department', 'Faculty', 'Courses', 'Sections', 'Classes'],
    rows: r.departments.map((d) => [d.name, d.faculty, d.courses, d.sections, d.classes]),
  },
  {
    name: 'Clashes',
    headers: ['Type', 'Class A', 'Class A time and room', 'Class B', 'Class B time and room'],
    rows: r.clashRows.map((cl) => [
      cl.type,
      `${cl.a.course} · ${cl.a.section} · ${cl.a.teacher}`,
      `${cl.a.when} · ${cl.a.room}`,
      `${cl.b.course} · ${cl.b.section} · ${cl.b.teacher}`,
      `${cl.b.when} · ${cl.b.room}`,
    ]),
  },
  {
    name: 'Classes per day',
    headers: ['Day', 'Classes'],
    rows: r.perDay.map((d) => [d.day, d.classes]),
  },
];

const escCsv = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (tables) =>
  tables
    .map((t) => [`# ${t.name}`, t.headers.map(escCsv).join(','), ...t.rows.map((row) => row.map(escCsv).join(','))].join('\n'))
    .join('\n\n');

const fileUrl = (path) => (path.startsWith('file://') ? path : `file://${path}`);

const shareFile = (path, type) =>
  Share.open({ url: fileUrl(path), type, failOnCancel: false, title: 'Share report' });

const stamp = () => new Date().toISOString().slice(0, 10);

// format: 'csv' | 'xlsx'
export const exportReport = async (format, tables) => {
  const base = `SmartSched_Report_${stamp()}`;

  if (format === 'csv') {
    const path = `${RNFS.CachesDirectoryPath}/${base}.csv`;
    await RNFS.writeFile(path, toCsv(tables), 'utf8');
    return shareFile(path, 'text/csv');
  }

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();
    tables.forEach((t) => {
      const ws = XLSX.utils.aoa_to_sheet([t.headers, ...t.rows]);
      XLSX.utils.book_append_sheet(wb, ws, t.name.slice(0, 31));
    });
    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const path = `${RNFS.CachesDirectoryPath}/${base}.xlsx`;
    await RNFS.writeFile(path, base64, 'base64');
    return shareFile(path, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  throw new Error(`Unsupported export format: ${format}`);
};