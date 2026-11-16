// Who can do what, and which department a user is limited to.
//   Registrar: all departments, full control.
//   HOD: own department only, full control inside it.
//   Faculty: read-only.
// NOTE: these checks keep the app's screens correct. The backend must enforce the
// same rules when it's connected, because anyone can call an API directly.

export const ROLE = {
  REGISTRAR: 'registrar',
  HOD: 'hod',
  FACULTY: 'faculty',
};

// DEMO: the HOD's department until login returns it.
// Change to 'bba' or 'math' to test another department.
const DEMO_HOD_DEPARTMENT_ID = 'cs';

export const getAccess = (params) => {
  const role = params?.role || ROLE.HOD;
  const departmentId = params?.departmentId || DEMO_HOD_DEPARTMENT_ID;

  if (role === ROLE.REGISTRAR) {
    return { role, departmentId: null, scoped: false, canEdit: true, canChooseDept: true };
  }

  if (role === ROLE.HOD) {
    return { role, departmentId, scoped: true, canEdit: true, canChooseDept: false };
  }

  // Faculty: view only, limited to their own department
  return { role, departmentId, scoped: true, canEdit: false, canChooseDept: false };
};

// True if the item belongs to the user's department, or the user sees everything.
export const inScope = (access, item) => !access.scoped || item.departmentId === access.departmentId;