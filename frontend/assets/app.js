const API_BASE =
  window.location.protocol.startsWith("http") && window.location.hostname
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://127.0.0.1:8000";

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => Array.from(document.querySelectorAll(selector));

const getToken = () => localStorage.getItem("sas_token");
const getRole = () => localStorage.getItem("sas_role");
const getUserId = () => localStorage.getItem("sas_user_id");
const getStudentId = () => localStorage.getItem("sas_student_id");

const isOfflineDemo = () => localStorage.getItem("sas_offline") === "1";
const setOfflineDemo = (enabled) => localStorage.setItem("sas_offline", enabled ? "1" : "0");
const setDemoProfile = (profile) => localStorage.setItem("sas_demo_profile", JSON.stringify(profile));
const getDemoProfile = () => {
  const cached = localStorage.getItem("sas_demo_profile");
  return cached ? JSON.parse(cached) : null;
};

const DEMO_SUBJECTS_KEY = "sas_demo_subjects";
const DEMO_CLASSES_KEY = "sas_demo_classes";
const defaultDemoClasses = [
  { id: "CLS-1", name: "BSc CS - A" },
  { id: "CLS-2", name: "BSc CS - B" },
  { id: "CLS-3", name: "IT - A" },
  { id: "CLS-4", name: "IT - B" },
];
const demoSubjectTemplates = {
  "Year 1": [
    "Programming Fundamentals",
    "Applied Mathematics",
    "Digital Electronics",
    "Communication Skills",
  ],
  "Year 2": [
    "Data Structures",
    "Database Management Systems",
    "Operating Systems",
    "Computer Networks",
  ],
  "Year 3": [
    "Software Engineering",
    "Web Technologies",
    "Machine Learning Basics",
    "Cloud Computing",
  ],
};
const defaultDemoSubjects = (() => {
  const subjects = [];
  let serial = 1;
  defaultDemoClasses.forEach((classItem, classIndex) => {
    Object.entries(demoSubjectTemplates).forEach(([year, names], yearIndex) => {
      names.forEach((name, nameIndex) => {
        subjects.push({
          id: `SUB-${serial++}`,
          name,
          code: `D${classIndex + 1}${yearIndex + 1}${nameIndex + 1}`.slice(0, 20),
          class_name: classItem.name,
          year,
        });
      });
    });
  });
  return subjects;
})();

const DEMO_USERS_KEY = "sas_demo_users";

const defaultDemoUsers = [
  {
    user_id: "SMJ-24001",
    email: "sonam@smjoshi.edu",
    password: "Sonam@123",
    name: "Sonam Shirke",
    student_class: "CSE-A",
    year: "3rd",
    department: "Computer Science",
    semester: "Semester 6",
    phone: "+91 98765 12301",
    guardian: "Mr. Shirke - 98765 11001",
    prn: "SMJ-24001",
    birth_date: "2005-04-18",
    address: "Hadapsar, Pune",
    role: "student",
  },
  {
    user_id: "SMJ-24002",
    email: "shraddha@smjoshi.edu",
    password: "Shraddha@123",
    name: "Shraddha",
    student_class: "CSE-B",
    year: "2nd",
    department: "Computer Science",
    semester: "Semester 4",
    phone: "+91 98765 12302",
    guardian: "Mrs. More - 98765 11002",
    prn: "SMJ-24002",
    birth_date: "2006-01-07",
    address: "Manjri, Pune",
    role: "student",
  },
  {
    user_id: "SMJ-24003",
    email: "kajal@smjoshi.edu",
    password: "Kajal@123",
    name: "Kajal Kamthe",
    student_class: "IT-A",
    year: "3rd",
    department: "Information Technology",
    semester: "Semester 6",
    phone: "+91 98765 12303",
    guardian: "Mr. Kamthe - 98765 11003",
    prn: "SMJ-24003",
    birth_date: "2005-09-22",
    address: "Hadapsar, Pune",
    role: "student",
  },
  {
    user_id: "SMJ-T-101",
    email: "pratima@smjoshi.edu",
    password: "Pratima@123",
    name: "Pratima Mam",
    subject: "DBMS",
    class_name: "BSc CS - A",
    phone: "+91 98220 11001",
    department: "Computer Science",
    role: "teacher",
  },
  {
    user_id: "SMJ-T-102",
    email: "nayan@smjoshi.edu",
    password: "Nayan@123",
    name: "Nayan Mam",
    subject: "Operating Systems",
    class_name: "BSc CS - B",
    phone: "+91 98220 11002",
    department: "Computer Science",
    role: "teacher",
  },
  {
    user_id: "SMJ-T-103",
    email: "ganesh@smjoshi.edu",
    password: "Ganesh@123",
    name: "Ganesh Sir",
    subject: "Data Structures",
    class_name: "IT - A",
    phone: "+91 98220 11003",
    department: "Information Technology",
    role: "teacher",
  },
  {
    user_id: "SMJ-A-01",
    email: "yadav@smjoshi.edu",
    password: "Yadav@123",
    name: "Yadav Madam",
    phone: "+91 98220 11999",
    department: "Administration",
    role: "admin",
  },
  {
    user_id: "SMJ-T-LEGACY",
    email: "teacher@smartattendance.edu",
    password: "Teacher@123",
    name: "Neha Teacher",
    subject: "Data Structures",
    class_name: "BSc CS - A",
    phone: "+91 98220 10001",
    department: "Computer Science",
    role: "teacher",
  },
  {
    user_id: "SMJ-S-LEGACY",
    email: "student@smartattendance.edu",
    password: "Student@123",
    name: "Riya Student",
    student_class: "BSc CS - A",
    year: "Year 2",
    department: "Computer Science",
    semester: "Semester 4",
    phone: "+91 98765 10001",
    guardian: "Parent - 98765 10002",
    prn: "PRN2026-001",
    birth_date: "2004-08-12",
    address: "Sector 21, New Delhi",
    role: "student",
  },
];

const ensureLegacyDemoUsers = (users) => {
  const required = defaultDemoUsers.filter((user) =>
    ["teacher@smartattendance.edu", "student@smartattendance.edu"].includes(
      user.email.toLowerCase()
    )
  );
  const existingEmails = new Set(users.map((user) => String(user.email || "").toLowerCase()));
  const missing = required.filter((user) => !existingEmails.has(user.email.toLowerCase()));
  if (!missing.length) return users;
  return [...users, ...missing];
};

const getDemoUsers = () => {
  const cached = localStorage.getItem(DEMO_USERS_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const merged = ensureLegacyDemoUsers(parsed);
      if (merged.length !== parsed.length) {
        saveDemoUsers(merged);
      }
      return merged;
    } catch (error) {
      // ignore and rebuild from defaults
    }
  }
  const seeded = ensureLegacyDemoUsers([...defaultDemoUsers]);
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(seeded));
  return seeded;
};

const saveDemoUsers = (users) => localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));

const getDemoSubjects = () => {
  const cached = localStorage.getItem(DEMO_SUBJECTS_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const hydrated = parsed.map((subject, index) => ({
        id: subject.id || `SUB-${index + 1}`,
        name: subject.name,
        code: subject.code,
        class_name: subject.class_name || "BSc CS - A",
        year: subject.year || "Year 1",
      }));
      const existingKeys = new Set(
        hydrated.map((item) => `${item.name}|${item.class_name}|${item.year}`)
      );
      const missing = defaultDemoSubjects.filter(
        (item) => !existingKeys.has(`${item.name}|${item.class_name}|${item.year}`)
      );
      if (missing.length) {
        const merged = [...hydrated, ...missing];
        localStorage.setItem(DEMO_SUBJECTS_KEY, JSON.stringify(merged));
        return merged;
      }
      return hydrated;
    } catch (error) {
      // ignore and rebuild from defaults
    }
  }
  localStorage.setItem(DEMO_SUBJECTS_KEY, JSON.stringify(defaultDemoSubjects));
  return [...defaultDemoSubjects];
};

const saveDemoSubjects = (subjects) =>
  localStorage.setItem(DEMO_SUBJECTS_KEY, JSON.stringify(subjects));

const getDemoClasses = () => {
  const cached = localStorage.getItem(DEMO_CLASSES_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      // ignore and rebuild from defaults
    }
  }
  localStorage.setItem(DEMO_CLASSES_KEY, JSON.stringify(defaultDemoClasses));
  return [...defaultDemoClasses];
};

const saveDemoClasses = (classes) =>
  localStorage.setItem(DEMO_CLASSES_KEY, JSON.stringify(classes));

const ensureDemoAttendance = () => {
  const cached = localStorage.getItem("sas_demo_attendance");
  if (cached) return JSON.parse(cached);
  const demoSubjects = getDemoSubjects();
  const subjectNames = demoSubjects.length
    ? demoSubjects.map((subject) => subject.name)
    : ["General"];
  const today = new Date();
  const demo = [];
  for (let i = 0; i < 10; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    demo.push({
      subject: subjectNames[i % subjectNames.length],
      date: date.toISOString(),
      status: i % 4 === 0 ? "Absent" : "Present",
      student_name: "You",
    });
  }
  localStorage.setItem("sas_demo_attendance", JSON.stringify(demo));
  return demo;
};

const getLocalCheckins = () => JSON.parse(localStorage.getItem("sas_local_checkins") || "[]");
const saveLocalCheckins = (items) => localStorage.setItem("sas_local_checkins", JSON.stringify(items));

const getLocalLeaves = () => JSON.parse(localStorage.getItem("sas_local_leaves") || "[]");
const saveLocalLeaves = (items) => localStorage.setItem("sas_local_leaves", JSON.stringify(items));

const renderTeacherLeaveRequests = () => {
  const leaveContainer = qs("#teacher-leave-requests");
  if (!leaveContainer) return;
  const leaves = getLocalLeaves();
  if (!leaves.length) {
    leaveContainer.innerHTML = '<p class="muted">No leave requests yet.</p>';
    return;
  }
  leaveContainer.innerHTML = leaves
    .slice(0, 12)
    .map(
      (item) => `
      <div class="list-item">
        <div>
          <strong>${item.student_name || "Student"} (${item.student_id || "--"})</strong>
          <p class="muted">${item.reason}</p>
          <p class="muted">${item.from} to ${item.to}</p>
        </div>
        <span class="status-pill ${item.status === "Approved" ? "" : "warning"}">${item.status || "Pending"}</span>
      </div>
    `
    )
    .join("");
};

const authFetch = async (path, options = {}) => {
  const token = getToken();
  const headers = options.headers || {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 401 && token) {
    clearSession();
    if (!window.location.pathname.endsWith("login.html")) {
      window.location.href = "login.html";
    }
  }
  return response;
};

const formatDate = (value) => new Date(value).toLocaleDateString();
const normalizeYear = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (["year 1", "1st", "first", "fy", "fybsc"].includes(raw)) return "Year 1";
  if (["year 2", "2nd", "second", "sy", "sybsc"].includes(raw)) return "Year 2";
  if (["year 3", "3rd", "third", "ty", "tybsc"].includes(raw)) return "Year 3";
  return value;
};

const ensureAuth = (role) => {
  const token = getToken();
  const currentRole = getRole();
  if (!token) {
    window.location.href = "login.html";
    return false;
  }
  if (!currentRole) {
    clearSession();
    window.location.href = "login.html";
    return false;
  }
  if (role && currentRole !== role) {
    window.location.href = `${currentRole}.html`;
    return false;
  }
  return true;
};

const renderChart = (ctx, labels, data, label) => {
  if (!ctx || typeof Chart === "undefined") return null;
  return new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          borderColor: "#0aa34f",
          backgroundColor: "rgba(10, 163, 79, 0.24)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
};

const renderBarChart = (ctx, labels, data, label) => {
  if (!ctx || typeof Chart === "undefined") return null;
  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          backgroundColor: "rgba(10, 163, 79, 0.62)",
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } },
    },
  });
};

const loadStats = async () => {
  if (isOfflineDemo()) {
    const users = getDemoUsers();
    const subjects = getDemoSubjects();
    const attendance = [...ensureDemoAttendance(), ...getLocalCheckins()];
    const present = attendance.filter((item) => item.status === "Present").length;
    const rate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
    const totalStudents = users.filter((user) => user.role === "student").length;
    const totalTeachers = users.filter((user) => user.role === "teacher").length;
    return {
      attendance_rate: rate,
      low_attendance_count: rate < 75 ? 1 : 0,
      total_students: totalStudents,
      total_teachers: totalTeachers,
      total_subjects: subjects.length,
    };
  }
  try {
    const res = await authFetch("/dashboard/stats");
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
};

const loadAttendance = async () => {
  if (isOfflineDemo()) {
    return [...getLocalCheckins(), ...ensureDemoAttendance()];
  }
  try {
    const res = await authFetch("/attendance/view");
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
};

const loadSubjects = async () => {
  if (isOfflineDemo()) {
    return getDemoSubjects();
  }
  try {
    const res = await authFetch("/subjects");
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
};

const filterSubjectsByClassYear = (subjects, className, year) => {
  return (subjects || []).filter((item) => {
    const classOk = !className || !item.class_name || item.class_name === className;
    const yearOk = !year || !item.year || item.year === year;
    return classOk && yearOk;
  });
};

const loadClasses = async () => {
  if (isOfflineDemo()) {
    return getDemoClasses();
  }
  try {
    const res = await authFetch("/classes");
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
};

const loadStudents = async () => {
  if (isOfflineDemo()) {
    return getDemoUsers()
      .filter((user) => user.role === "student")
      .map((student) => ({
        id: student.user_id,
        user_id: student.user_id,
        name: student.name,
        email: student.email,
        student_class: student.student_class,
        year: student.year,
        prn: student.prn,
        birth_date: student.birth_date,
        address: student.address,
      }));
  }
  try {
    const res = await authFetch("/students");
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
};

const loadTeachers = async () => {
  if (isOfflineDemo()) {
    return getDemoUsers()
      .filter((user) => user.role === "teacher")
      .map((teacher) => ({
        id: teacher.user_id,
        user_id: teacher.user_id,
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject,
        class_name: teacher.class_name || "",
      }));
  }
  try {
    const res = await authFetch("/teachers");
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
};

const loadStudentProfile = async () => {
  if (isOfflineDemo()) {
    const profile = getDemoProfile();
    if (profile) return profile;
    return {
      name: "Demo Student",
      email: "student@smjoshi.edu",
      student_class: "CSE-A",
      year: "3rd",
      department: "Computer Science",
      semester: "Semester 6",
      phone: "+91 98765 12000",
      guardian: "Parent - 98765 11999",
      prn: getStudentId() || "SMJ-24000",
      birth_date: "2005-08-14",
      address: "Hostel Block C",
    };
  }
  let res;
  try {
    res = await authFetch("/students/me");
  } catch (error) {
    return { error: "Unable to load profile" };
  }
  if (!res.ok) {
    let detail = "Unable to load profile";
    try {
      const payload = await res.json();
      detail = payload.detail || detail;
    } catch (error) {
      // ignore
    }
    return { error: detail };
  }
  return res.json();
};

const announce = (message, type = "success") => {
  const toast = qs(".toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  toast.classList.toggle("error", type === "error");
  setTimeout(() => toast.classList.remove("show"), 2600);
};

const clearSession = () => {
  localStorage.removeItem("sas_token");
  localStorage.removeItem("sas_role");
  localStorage.removeItem("sas_user_id");
  localStorage.removeItem("sas_student_id");
  localStorage.removeItem("sas_demo_profile");
  setOfflineDemo(false);
};

const bindLogout = (selector = "#logout-btn") => {
  const logoutBtn = qs(selector);
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", () => {
    clearSession();
    window.location.href = "index.html";
  });
};

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = qs("#login-form");
  if (loginForm) {
    const switchButtons = qsa(".switch-btn");
    const emailLogin = qs("#email-login");
    const idLogin = qs("#id-login");
    const roleSelect = qs("#role");
    const emailInput = qs("#email");
    const passwordInput = qs("#password");
    const studentIdInput = qs("#student-id");
    const studentPasscodeInput = qs("#student-passcode");
    const primaryAdminEmail = "yadav@smjoshi.edu";

    const setLoginMode = (mode) => {
      loginForm.dataset.mode = mode;
      switchButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.mode === mode));
      const isId = mode === "id";
      emailLogin.style.display = isId ? "none" : "block";
      idLogin.style.display = isId ? "block" : "none";
      roleSelect.value = isId ? "student" : roleSelect.value;
      roleSelect.disabled = isId;
      emailInput.required = !isId;
      passwordInput.required = !isId;
      studentIdInput.required = isId;
      studentPasscodeInput.required = isId;
    };

    switchButtons.forEach((btn) =>
      btn.addEventListener("click", () => setLoginMode(btn.dataset.mode))
    );
    setLoginMode("email");

    if (emailInput && roleSelect) {
      emailInput.addEventListener("input", () => {
        if (emailInput.value.trim().toLowerCase() === primaryAdminEmail) {
          roleSelect.value = "admin";
        }
      });
    }

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const mode = loginForm.dataset.mode || "email";
      const role = qs("#role").value;
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      const studentId = studentIdInput.value.trim();
      const studentPasscode = studentPasscodeInput.value.trim();

      if (mode === "id") {
        let res = null;
        try {
          res = await fetch(`${API_BASE}/login-id`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ student_id: studentId, passcode: studentPasscode }),
          });
        } catch (error) {
          res = null;
        }

        if (res && res.ok) {
          const data = await res.json();
          localStorage.setItem("sas_token", data.access_token);
          localStorage.setItem("sas_role", data.role || "student");
          localStorage.setItem("sas_user_id", data.user_id || studentId);
          localStorage.setItem("sas_student_id", studentId);
          setOfflineDemo(false);
          window.location.href = "student.html";
          return;
        }

        if (!studentId || !studentPasscode) {
          announce("Student ID and passcode are required", "error");
          return;
        }
        let detail = "Invalid student ID or passcode";
        if (res) {
          try {
            const payload = await res.json();
            detail = payload.detail || detail;
          } catch (error) {
            // Ignore non-JSON errors
          }
        } else {
          detail = "Backend not reachable. Start server on port 8000.";
        }
        announce(detail, "error");
        return;
      }

      let res;
      try {
        res = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      } catch (error) {
        res = null;
      }

      if (!res || !res.ok) {
        let detail = "Invalid login details";
        if (res) {
          try {
            const payload = await res.json();
            detail = payload.detail || detail;
          } catch (error) {
            // Ignore non-JSON errors
          }
        } else {
          detail = "Backend not reachable. Start server on port 8000.";
        }
        announce(detail, "error");
        return;
      }

      const data = await res.json();
      localStorage.setItem("sas_token", data.access_token);
      localStorage.setItem("sas_role", data.role);
      localStorage.setItem("sas_user_id", data.user_id);
      localStorage.setItem("sas_student_id", data.user_id);
      localStorage.removeItem("sas_demo_profile");
      setOfflineDemo(false);

      if (data.role !== role) {
        announce(`You are logged in as ${data.role}`, "error");
      }
      window.location.href = `${data.role}.html`;
    });
  }

  const studentBoard = qs("#student-board");
  if (studentBoard && ensureAuth("student")) {
    bindLogout();

    Promise.all([loadStats(), loadAttendance(), loadSubjects(), loadStudentProfile()]).then(
      ([stats, attendance, subjects, profile]) => {
      if (!stats) return;
      qs("#attendance-rate").textContent = `${stats.attendance_rate}%`;
      qs("#low-attendance").textContent = stats.low_attendance_count ? "Action Required" : "Great Standing";

      const lastSeven = attendance.slice(0, 7).reverse();
      const labels = lastSeven.map((item) => formatDate(item.date));
      const data = lastSeven.map((item) => (item.status === "Present" ? 1 : 0));
      renderChart(qs("#attendanceChart"), labels, data, "Weekly Presence");

      const sorted = [...attendance].sort((a, b) => new Date(b.date) - new Date(a.date));
      let streak = 0;
      for (const item of sorted) {
        if (item.status === "Present") streak += 1;
        else break;
      }
      qs("#attendance-streak").textContent = `${streak} days`;
      qs("#attendance-goal").textContent = stats.attendance_rate >= 75 ? "Goal Achieved" : "75% Target";

      const subjectMap = {};
      attendance.forEach((item) => {
        if (!subjectMap[item.subject]) subjectMap[item.subject] = { total: 0, present: 0 };
        subjectMap[item.subject].total += 1;
        if (item.status === "Present") subjectMap[item.subject].present += 1;
      });
      const subjectLabels = Object.keys(subjectMap);
      const subjectRates = subjectLabels.map((key) =>
        subjectMap[key].total ? Math.round((subjectMap[key].present / subjectMap[key].total) * 100) : 0
      );
      if (qs("#subjectChart")) {
        renderBarChart(qs("#subjectChart"), subjectLabels, subjectRates, "Attendance %");
      }

      const subjectList = qs("#subject-list");
      subjectList.innerHTML = attendance
        .slice(0, 6)
        .map(
          (item) => `
          <div class="glass-card">
            <h4>${item.subject}</h4>
            <p class="muted">${formatDate(item.date)}</p>
            <span class="badge ${item.status === "Present" ? "success" : "warning"}">${item.status}</span>
          </div>
        `
        )
        .join("");

      const profileClass = profile && !profile.error ? profile.student_class : "";
      const profileYear = profile && !profile.error ? normalizeYear(profile.year || "") : "";
      const scopedSubjects = filterSubjectsByClassYear(subjects, profileClass, profileYear);
      const subjectOptions = (scopedSubjects.length ? scopedSubjects : subjects);

      const subjectSelect = qs("#resource-subjects");
      subjectSelect.innerHTML = subjectOptions
        .map((subject) => `<option value="${subject.name}">${subject.name}</option>`)
        .join("");

      const selfSubjectSelect = qs("#self-subject");
      if (selfSubjectSelect) {
        selfSubjectSelect.innerHTML = subjectOptions
          .map((subject) => `<option value="${subject.name}">${subject.name}</option>`)
          .join("");
      }

      const profileCard = qs("#student-profile");
      if (profileCard && profile && profile.error) {
        profileCard.innerHTML = `<p class="muted">${profile.error}. Please restart backend and login again.</p>`;
      } else if (profileCard && profile) {
        const greeting = qs("#student-greeting");
        const meta = qs("#student-meta");
        if (greeting) {
          greeting.textContent = profile.name || "Student";
        }
        if (meta) {
          meta.textContent = `ID: ${profile.prn || getStudentId() || "--"} | Class: ${profile.student_class || "--"}`;
        }
        profileCard.innerHTML = `
          <div class="grid">
            <div>
              <strong>Name</strong>
              <p class="muted">${profile.name}</p>
            </div>
            <div>
              <strong>Email</strong>
              <p class="muted">${profile.email}</p>
            </div>
            <div>
              <strong>Class</strong>
              <p class="muted">${profile.student_class}</p>
            </div>
            <div>
              <strong>Year</strong>
              <p class="muted">${profile.year}</p>
            </div>
            <div>
              <strong>Department</strong>
              <p class="muted">${profile.department || "Not set"}</p>
            </div>
            <div>
              <strong>Semester</strong>
              <p class="muted">${profile.semester || "Not set"}</p>
            </div>
            <div>
              <strong>Phone</strong>
              <p class="muted">${profile.phone || "Not set"}</p>
            </div>
            <div>
              <strong>Guardian Contact</strong>
              <p class="muted">${profile.guardian || "Not set"}</p>
            </div>
            <div>
              <strong>PRN</strong>
              <p class="muted">${profile.prn}</p>
            </div>
            <div>
              <strong>Birth Date</strong>
              <p class="muted">${profile.birth_date || "Not set"}</p>
            </div>
            <div>
              <strong>Address</strong>
              <p class="muted">${profile.address || "Not set"}</p>
            </div>
          </div>
        `;
      }

      const recentCheckins = qs("#recent-checkins");
      if (recentCheckins) {
        recentCheckins.innerHTML = attendance
          .slice(0, 5)
          .map(
            (item) => `
            <div class="list-item">
              <div>
                <strong>${item.subject}</strong>
                <p class="muted">${formatDate(item.date)}</p>
              </div>
              <span class="status-pill ${item.status === "Present" ? "" : "warning"}">${item.status}</span>
            </div>
          `
          )
          .join("");
      }

      const schedule = qs("#today-schedule");
      if (schedule) {
        const items = [
          { title: "DBMS Lab", time: "09:30 - 11:00", room: "Lab 2" },
          { title: "AI Foundations", time: "11:30 - 12:30", room: "Room 204" },
          { title: "Data Structures", time: "14:00 - 15:30", room: "Room 108" },
          { title: "Mentor Check-in", time: "16:00 - 16:30", room: "Counseling Cell" },
        ];
        schedule.innerHTML = items
          .map(
            (item) => `
            <div class="glass-card">
              <h3>${item.title}</h3>
              <p class="muted">${item.time}</p>
              <span class="badge success">${item.room}</span>
            </div>
          `
          )
          .join("");
      }

      const leaveStatus = qs("#leave-status");
      if (leaveStatus) {
        const leaves = getLocalLeaves();
        leaveStatus.innerHTML = (leaves.length
          ? leaves
          : [
              { reason: "Medical", from: "2026-03-10", to: "2026-03-12", status: "Approved" },
            ]
        )
          .map(
            (item) => `
            <div class="list-item">
              <div>
                <strong>${item.reason}</strong>
                <p class="muted">${item.from} to ${item.to}</p>
              </div>
              <span class="status-pill ${item.status === "Approved" ? "" : "warning"}">${item.status}</span>
            </div>
          `
          )
          .join("");
      }
    });

    const selfIdInput = qs("#self-student-id");
    if (selfIdInput) {
      selfIdInput.value = getStudentId() || getUserId() || "";
    }
    const selfLocation = qs("#self-location");
    if (selfLocation) {
      selfLocation.value = "Main Campus";
    }

    const selfForm = qs("#self-attendance-form");
    if (selfForm) {
      selfForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const studentId = qs("#self-student-id").value.trim();
        const subject = qs("#self-subject").value;
        const sessionCode = qs("#self-session").value.trim();
        const location = qs("#self-location").value.trim();
        const deviceId = qs("#self-device").value.trim();
        const statusBox = qs("#self-attendance-status");

        if (!studentId || !sessionCode) {
          if (statusBox) statusBox.textContent = "Student ID and session code are required.";
          announce("Missing student ID or session code", "error");
          return;
        }

        let savedOffline = false;
        if (!isOfflineDemo()) {
          try {
            const res = await authFetch("/attendance/self", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ student_id: studentId, subject, session_code: sessionCode, location, device_id: deviceId }),
            });
            if (!res.ok) throw new Error("Self check-in failed");
          } catch (error) {
            savedOffline = true;
          }
        } else {
          savedOffline = true;
        }

        if (savedOffline) {
          const checkins = getLocalCheckins();
          checkins.unshift({
            subject,
            date: new Date().toISOString(),
            status: "Present",
            student_name: "You",
          });
          saveLocalCheckins(checkins.slice(0, 12));
          if (statusBox) {
            statusBox.textContent = "Saved locally. Sync when backend is available.";
          }
          announce("Attendance saved locally");
        } else {
          if (statusBox) statusBox.textContent = "Attendance marked successfully.";
          announce("Attendance marked");
        }

        const recent = qs("#recent-checkins");
        if (recent) {
          const items = getLocalCheckins();
          if (items.length) {
            recent.innerHTML = items
              .slice(0, 5)
              .map(
                (item) => `
                <div class="list-item">
                  <div>
                    <strong>${item.subject}</strong>
                    <p class="muted">${formatDate(item.date)}</p>
                  </div>
                  <span class="status-pill">${item.status}</span>
                </div>
              `
              )
              .join("");
          }
        }
      });
    }

    const leaveForm = qs("#leave-form");
    if (leaveForm) {
      leaveForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const reason = qs("#leave-reason").value.trim() || "Leave";
        const from = qs("#leave-from").value;
        const to = qs("#leave-to").value;
        const type = qs("#leave-type").value;
        const profile = getDemoProfile() || {};
        const studentId = getStudentId() || getUserId() || profile.prn || "--";
        const studentName = profile.name || "Student";
        const leaves = getLocalLeaves();
        leaves.unshift({
          reason: `${reason} (${type})`,
          from,
          to,
          status: "Pending",
          student_id: studentId,
          student_name: studentName,
          submitted_at: new Date().toISOString(),
        });
        saveLocalLeaves(leaves.slice(0, 8));
        announce("Leave request submitted");
        event.target.reset();
        const leaveStatus = qs("#leave-status");
        if (leaveStatus) {
          leaveStatus.innerHTML = leaves
            .slice(0, 5)
            .map(
              (item) => `
              <div class="list-item">
                <div>
                  <strong>${item.reason}</strong>
                  <p class="muted">${item.from} to ${item.to}</p>
                </div>
                <span class="status-pill warning">${item.status}</span>
              </div>
            `
            )
            .join("");
        }
        renderTeacherLeaveRequests();
      });
    }
  }

  const teacherBoard = qs("#teacher-board");
  if (teacherBoard && ensureAuth("teacher")) {
    bindLogout();
    const teacherProfile = getDemoProfile();
    const teacherGreeting = qs("#teacher-greeting");
    const teacherMeta = qs("#teacher-meta");
    if (teacherGreeting) {
      teacherGreeting.textContent = teacherProfile?.name || "Teacher";
    }
    if (teacherMeta) {
      teacherMeta.textContent = `Subject: ${teacherProfile?.subject || "General"} | Class: ${teacherProfile?.class_name || "--"}`;
    }

    const today = new Date().toISOString().split("T")[0];
    const dateInput = qs("#attendance-date");
    if (dateInput) {
      dateInput.value = today;
    }
    Promise.all([loadStats(), loadStudents(), loadSubjects(), loadClasses(), loadAttendance(), loadTeachers()]).then(
      ([stats, students, subjects, classes, attendance, teachers]) => {
      if (stats) {
        qs("#teacher-total-students").textContent = stats.total_students;
        qs("#teacher-attendance-rate").textContent = `${stats.attendance_rate}%`;
      }

      const subjectSelect = qs("#teacher-subject");
      const teacherYearSelect = qs("#teacher-year");

      const teacherClassSelect = qs("#teacher-class");
      const classOptions = (classes || []).map((item) => item.name);
      if (teacherClassSelect) {
        if (classOptions.length) {
          teacherClassSelect.innerHTML = classOptions
            .map((name) => `<option value="${name}">${name}</option>`)
            .join("");
          const currentTeacher =
            teachers?.find((item) => String(item.user_id) === String(getUserId())) || teacherProfile || null;
          const preferredClass = currentTeacher?.class_name || classOptions[0];
          if (classOptions.includes(preferredClass)) {
            teacherClassSelect.value = preferredClass;
          }
          if (teacherMeta) {
            teacherMeta.textContent = `Subject: ${currentTeacher?.subject || teacherProfile?.subject || "General"} | Class: ${preferredClass || "--"}`;
          }
        } else {
          teacherClassSelect.innerHTML = '<option value="">No classes available</option>';
        }
      }

      const list = qs("#student-checkboxes");
      const studentDetailsTable = qs("#teacher-student-details");
      const normalizeClassKey = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const classMatches = (studentClass, selectedClass) => {
        if (!selectedClass) return true;
        if (studentClass === selectedClass) return true;
        return normalizeClassKey(studentClass) === normalizeClassKey(selectedClass);
      };
      const getFilteredStudents = () => {
        const selectedClass = qs("#teacher-class")?.value || "";
        const selectedYear = normalizeYear(qs("#teacher-year")?.value || "");
        const strict = selectedClass
          ? students.filter(
              (student) =>
                classMatches(student.student_class, selectedClass) &&
                (!selectedYear || normalizeYear(student.year || "") === selectedYear)
            )
          : students;
        if (strict.length) return { items: strict, mode: "strict" };
        if (selectedClass) {
          const classOnly = students.filter((student) => classMatches(student.student_class, selectedClass));
          if (classOnly.length) return { items: classOnly, mode: "class-only" };
        }
        if (students.length) return { items: students, mode: "all" };
        return { items: [], mode: "empty" };
      };
      const renderTeacherSubjects = () => {
        const selectedClass = qs("#teacher-class")?.value || "";
        const selectedYear = normalizeYear(qs("#teacher-year")?.value || "");
        const scopedSubjects = filterSubjectsByClassYear(subjects, selectedClass, selectedYear);
        const finalSubjects = scopedSubjects.length ? scopedSubjects : subjects;
        if (!subjectSelect) return;
        if (!finalSubjects.length) {
          subjectSelect.innerHTML = '<option value="">No subjects available</option>';
          return;
        }
        subjectSelect.innerHTML = finalSubjects
          .map((subject) => `<option value="${subject.name}">${subject.name}</option>`)
          .join("");
      };

      const renderStudentCheckboxes = () => {
        const { items, mode } = getFilteredStudents();
        if (!items.length) {
          list.innerHTML = '<div class="glass-card"><span class="muted">No students available.</span></div>';
          return;
        }
        const warning =
          mode === "strict"
            ? ""
            : '<div class="glass-card"><span class="muted">No exact class/year match. Showing broader student list so attendance can still be marked.</span></div>';
        list.innerHTML = `${warning}${items
          .map(
            (student) => `
          <label class="glass-card">
            <input type="checkbox" value="${student.id}" checked />
            <strong>${student.name}</strong>
            <span class="muted">${student.student_class}</span>
          </label>
        `
          )
          .join("")}`;
      };

      const renderStudentDetails = () => {
        if (!studentDetailsTable) return;
        const { items, mode } = getFilteredStudents();
        if (!items.length) {
          studentDetailsTable.innerHTML = `
            <tr>
              <td colspan="5" class="muted">No students found for selected class/year.</td>
            </tr>
          `;
          return;
        }
        const warningRow =
          mode === "strict"
            ? ""
            : `
            <tr>
              <td colspan="5" class="muted">No exact class/year match. Showing broader student list.</td>
            </tr>
          `;
        studentDetailsTable.innerHTML = `${warningRow}${items
          .map(
            (student) => `
            <tr>
              <td>${student.name || "--"}</td>
              <td>${student.prn || student.user_id || student.id || "--"}</td>
              <td>${student.email || "--"}</td>
              <td>${student.student_class || "--"}</td>
              <td>${student.year || "--"}</td>
            </tr>
          `
          )
          .join("")}`;
      };

      renderStudentCheckboxes();
      renderStudentDetails();
      renderTeacherSubjects();
      if (teacherClassSelect) {
        teacherClassSelect.addEventListener("change", () => {
          renderStudentCheckboxes();
          renderStudentDetails();
          renderTeacherSubjects();
        });
      }
      if (teacherYearSelect) {
        teacherYearSelect.addEventListener("change", () => {
          renderStudentCheckboxes();
          renderStudentDetails();
          renderTeacherSubjects();
        });
      }

      const table = qs("#teacher-attendance");
      if (table) {
        table.innerHTML = attendance
        .slice(0, 6)
        .map(
          (item) => `
          <tr>
            <td>${item.student_name}</td>
            <td>${item.subject}</td>
            <td>${formatDate(item.date)}</td>
            <td><span class="badge ${item.status === "Present" ? "success" : "warning"}">${
            item.status
          }</span></td>
          </tr>
        `
        )
        .join("");
      }
      const attendanceSearch = qs("#attendance-search");
      if (attendanceSearch && table) {
        attendanceSearch.addEventListener("input", () => {
          const term = attendanceSearch.value.toLowerCase();
          Array.from(table.querySelectorAll("tr")).forEach((row) => {
            row.style.display = row.textContent.toLowerCase().includes(term) ? "" : "none";
          });
        });
      }

      renderTeacherLeaveRequests();
    }
    );

    qs("#attendance-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const subject = qs("#teacher-subject").value;
      const date = qs("#attendance-date").value;
      if (!subject) {
        announce("Please select a subject first", "error");
        return;
      }
      const selected = qsa("#student-checkboxes input:checked").map((input) => parseInt(input.value, 10));
      const absent = qsa("#student-checkboxes input:not(:checked)").map((input) => parseInt(input.value, 10));

      const items = [
        ...selected.map((id) => ({ student_id: id, subject, date, status: "Present" })),
        ...absent.map((id) => ({ student_id: id, subject, date, status: "Absent" })),
      ];
      if (!items.length) {
        announce("No students found for selected class/year", "error");
        return;
      }

      let res;
      try {
        res = await authFetch("/attendance/mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
      } catch (error) {
        announce("Backend is not reachable", "error");
        return;
      }

      if (res.ok) {
        announce("Attendance saved");
      } else {
        announce("Unable to save attendance", "error");
      }
    });

    qs("#generate-qr").addEventListener("click", async () => {
      const subject = qs("#teacher-subject").value;
      const studentClass = qs("#teacher-class").value;
      const date = qs("#attendance-date").value;
      if (!subject || !studentClass) {
        announce("Select subject and class before generating QR", "error");
        return;
      }
      let res;
      try {
        res = await authFetch(
          `/attendance/qr?subject=${encodeURIComponent(subject)}&student_class=${encodeURIComponent(
            studentClass
          )}&date_value=${date}`
        );
      } catch (error) {
        announce("Backend is not reachable", "error");
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      const qrTarget = qs("#qr-container");
      qrTarget.innerHTML = "";
      new QRCode(qrTarget, {
        text: JSON.stringify(data.payload),
        width: 150,
        height: 150,
        colorDark: "#0aa34f",
        colorLight: "#ffffff",
      });
    });

    qs("#export-attendance").addEventListener("click", async () => {
      let res;
      try {
        res = await authFetch("/attendance/export");
      } catch (error) {
        announce("Backend is not reachable", "error");
        return;
      }
      if (!res.ok) {
        announce("Export failed", "error");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "attendance_export.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  const adminBoard = qs("#admin-board");
  if (adminBoard && ensureAuth()) {
    bindLogout();
    const activeRole = getRole();
    if (!["admin", "teacher"].includes(activeRole)) {
      window.location.href = "login.html";
      return;
    }
    const teacherLimitedAccess = activeRole === "teacher";
    const adminProfile = getDemoProfile();
    const adminGreeting = qs("#admin-greeting");
    const adminMeta = qs("#admin-meta");
    const tabs = qsa(".admin-tab-btn");
    const panels = qsa(".admin-tab-panel");

    const setActiveTab = (tabName) => {
      tabs.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabName));
      panels.forEach((panel) => panel.classList.toggle("active", panel.id === `admin-tab-${tabName}`));
    };

    tabs.forEach((btn) => btn.addEventListener("click", () => setActiveTab(btn.dataset.tab)));
    setActiveTab("overview");

    if (adminGreeting) {
      adminGreeting.textContent = adminProfile?.name || (teacherLimitedAccess ? "Teacher" : "Admin");
    }
    if (adminMeta) {
      adminMeta.textContent = teacherLimitedAccess ? "Access: Student Management" : "Access: Full Control";
    }

    let adminStudents = [];
    let adminTeachers = [];
    let adminSubjects = [];
    let adminClasses = [];
    let adminAttendance = [];

    const getManagedUsers = () => [
      ...adminStudents.map((student) => ({
        user_id: student.user_id,
        name: student.name,
        email: student.email,
        role: "student",
        student_class: student.student_class || "--",
        year: student.year || "--",
        prn: student.prn || "--",
        birth_date: student.birth_date || "",
        address: student.address || "",
        subject: "",
      })),
      ...adminTeachers.map((teacher) => ({
        user_id: teacher.user_id,
        name: teacher.name,
        email: teacher.email,
        role: "teacher",
        class_name: teacher.class_name || "",
        student_class: "",
        year: "",
        prn: "",
        birth_date: "",
        address: "",
        subject: teacher.subject || "--",
      })),
    ];

    const calculateLowAttendance = () => {
      const grouped = {};
      adminAttendance.forEach((item) => {
        const sid = String(item.student_id);
        if (!grouped[sid]) grouped[sid] = { total: 0, present: 0 };
        grouped[sid].total += 1;
        if (item.status === "Present") grouped[sid].present += 1;
      });
      return adminStudents.filter((student) => {
        const rec = grouped[String(student.id)];
        if (!rec || !rec.total) return false;
        const rate = (rec.present / rec.total) * 100;
        return rate < 75;
      }).length;
    };

    const populateUserFilters = () => {
      const classFilter = qs("#user-class-filter");
      const yearFilter = qs("#user-year-filter");
      if (!classFilter || !yearFilter) return;
      const classes = [...new Set(adminClasses.map((item) => item.name).filter(Boolean))].sort();
      const years = [...new Set(adminStudents.map((item) => item.year).filter(Boolean))].sort();
      classFilter.innerHTML = ['<option value="all">All Classes</option>', ...classes.map((item) => `<option value="${item}">${item}</option>`)].join("");
      yearFilter.innerHTML = ['<option value="all">All Years</option>', ...years.map((item) => `<option value="${item}">${item}</option>`)].join("");
    };

    const populateSubjectFilters = () => {
      const subjectClassFilter = qs("#subject-class-filter");
      const subjectYearFilter = qs("#subject-year-filter");
      if (!subjectClassFilter || !subjectYearFilter) return;
      const classOptions = adminClasses
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => item.name);
      const currentClass = subjectClassFilter.value;
      const currentYear = subjectYearFilter.value;
      subjectClassFilter.innerHTML = [
        '<option value="all">All Classes</option>',
        ...classOptions.map((name) => `<option value="${name}">${name}</option>`),
      ].join("");
      if (currentClass && (currentClass === "all" || classOptions.includes(currentClass))) {
        subjectClassFilter.value = currentClass;
      }
      if (currentYear) {
        subjectYearFilter.value = currentYear;
      }
    };

    const populateClassSelectors = () => {
      const options = adminClasses
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => item.name);
      const selectors = [
        { id: "#new-class", label: "Select Class (for students)" },
        { id: "#edit-class", label: "Select Class (for students)" },
        { id: "#new-teacher-class", label: "Assigned Class (for teachers)" },
        { id: "#edit-teacher-class", label: "Assigned Class (for teachers)" },
        { id: "#subject-class", label: "Select Class" },
      ];

      selectors.forEach(({ id, label }) => {
        const select = qs(id);
        if (!select) return;
        const current = select.value;
        select.innerHTML = [
          `<option value="">${label}</option>`,
          ...options.map((name) => `<option value="${name}">${name}</option>`),
        ].join("");
        if (current && options.includes(current)) {
          select.value = current;
        }
      });
    };

    const renderUsers = () => {
      const usersTable = qs("#admin-users");
      if (!usersTable) return;
      const term = (qs("#user-search")?.value || "").toLowerCase().trim();
      const roleFilter = qs("#user-role-filter")?.value || "all";
      const classFilter = qs("#user-class-filter")?.value || "all";
      const yearFilter = qs("#user-year-filter")?.value || "all";

      const rows = getManagedUsers()
        .filter((user) => {
          if (roleFilter !== "all" && user.role !== roleFilter) return false;
          if (user.role === "student" && classFilter !== "all" && user.student_class !== classFilter) return false;
          if (user.role === "student" && yearFilter !== "all" && user.year !== yearFilter) return false;
          if (!term) return true;
          return [user.name, user.email, user.prn, user.subject].join(" ").toLowerCase().includes(term);
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      usersTable.innerHTML = rows
        .map(
          (user) => `
          <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge ${user.role === "student" ? "success" : "warning"}">${user.role}</span></td>
            <td>${user.role === "student" ? `${user.student_class} / ${user.year}` : user.class_name || "--"}</td>
            <td>${user.role === "student" ? user.prn : user.subject}</td>
            <td>
              ${
                teacherLimitedAccess && user.role !== "student"
                  ? '<span class="helper">Restricted</span>'
                  : `<button class="action-btn primary edit-user" data-user-id="${user.user_id}" data-role="${user.role}">Edit</button>
                     <button class="action-btn danger delete-user" data-user-id="${user.user_id}" data-role="${user.role}">Delete</button>`
              }
            </td>
          </tr>
        `
        )
        .join("");

      const usersCount = qs("#admin-users-count");
      if (usersCount) usersCount.textContent = rows.length;
    };

    const renderSubjects = () => {
      const tbody = qs("#admin-subjects");
      if (!tbody) return;
      const term = (qs("#subject-search")?.value || "").toLowerCase().trim();
      const classFilter = qs("#subject-class-filter")?.value || "all";
      const yearFilter = qs("#subject-year-filter")?.value || "all";
      const rows = adminSubjects
        .filter(
          (subject) =>
            (classFilter === "all" || (subject.class_name || "") === classFilter) &&
            (yearFilter === "all" || (subject.year || "") === yearFilter) &&
            (!term ||
            `${subject.name} ${subject.code} ${subject.class_name || ""} ${subject.year || ""}`
              .toLowerCase()
              .includes(term))
        )
        .sort((a, b) => a.name.localeCompare(b.name));

      tbody.innerHTML = rows
        .map(
          (subject) => `
            <tr>
              <td>${subject.name}</td>
              <td>${subject.code}</td>
              <td>${subject.class_name || "--"}</td>
              <td>${subject.year || "--"}</td>
              <td>
                ${
                  teacherLimitedAccess
                    ? '<span class="helper">Restricted</span>'
                    : `<button class="action-btn primary edit-subject" data-subject-id="${subject.id}">Edit</button>
                       <button class="action-btn danger delete-subject" data-subject-id="${subject.id}">Delete</button>`
                }
              </td>
            </tr>
          `
        )
        .join("");
    };

    const renderClasses = () => {
      const tbody = qs("#admin-classes");
      if (!tbody) return;
      const term = (qs("#class-search")?.value || "").toLowerCase().trim();
      const rows = adminClasses
        .filter((item) => !term || item.name.toLowerCase().includes(term))
        .sort((a, b) => a.name.localeCompare(b.name));
      tbody.innerHTML = rows
        .map(
          (item) => `
            <tr>
              <td>${item.name}</td>
              <td>
                ${
                  teacherLimitedAccess
                    ? '<span class="helper">Restricted</span>'
                    : `<button class="action-btn primary edit-class" data-class-id="${item.id}">Edit</button>
                       <button class="action-btn danger delete-class" data-class-id="${item.id}">Delete</button>`
                }
              </td>
            </tr>
          `
        )
        .join("");
    };

    const resetSubjectForm = () => {
      const subjectForm = qs("#subject-form");
      const subjectEditId = qs("#subject-edit-id");
      const subjectSubmit = qs("#subject-submit");
      if (subjectForm) subjectForm.reset();
      if (subjectEditId) subjectEditId.value = "";
      if (subjectSubmit) subjectSubmit.textContent = "Add Subject";
    };

    const refreshAdminData = async () => {
      try {
        const [stats, students, teachers, subjects, classes, attendance] = await Promise.all([
          loadStats(),
          loadStudents(),
          loadTeachers(),
          loadSubjects(),
          loadClasses(),
          loadAttendance(),
        ]);
        adminStudents = students || [];
        adminTeachers = teachers || [];
        adminSubjects = subjects || [];
        adminClasses = classes || [];
        adminAttendance = attendance || [];

        qs("#admin-total-students").textContent = stats?.total_students ?? adminStudents.length;
        qs("#admin-total-teachers").textContent = stats?.total_teachers ?? adminTeachers.length;
        qs("#admin-total-subjects").textContent = stats?.total_subjects ?? adminSubjects.length;
        qs("#admin-total-classes").textContent = adminClasses.length;
        qs("#admin-attendance-rate").textContent = `${Math.round(stats?.attendance_rate || 0)}%`;
        qs("#admin-low-attendance").textContent = calculateLowAttendance();

        populateUserFilters();
        populateClassSelectors();
        populateSubjectFilters();
        renderUsers();
        renderSubjects();
        renderClasses();
      } catch (error) {
        announce("Unable to load admin data", "error");
      }
    };

    const userForm = qs("#user-form");
    const userSubmit = qs("#user-submit");
    const cancelEdit = qs("#cancel-edit");
    const roleSelect = qs("#new-role");
    const passwordInput = qs("#new-password");
    const newStudentSection = qs("#new-student-section");
    const newTeacherSection = qs("#new-teacher-section");
    const newAdminSection = qs("#new-admin-section");
    const editUserModal = qs("#edit-user-modal");
    const editUserForm = qs("#edit-user-form");
    const editUserClose = qs("#edit-user-close");
    const editUserCancel = qs("#edit-user-cancel");
    const editUserBackdrop = qs("#edit-user-backdrop");
    const editRoleSelect = qs("#edit-role");

    if (teacherLimitedAccess && roleSelect) {
      roleSelect.value = "student";
      roleSelect.disabled = true;
    }

    const setFieldsDisabled = (selectors, disabled) => {
      selectors.forEach((selector) => {
        const field = qs(selector);
        if (field) field.disabled = disabled;
      });
    };

    const updateCreateRoleSections = () => {
      const role = roleSelect?.value || "student";
      if (newStudentSection) newStudentSection.classList.toggle("active", role === "student");
      if (newTeacherSection) newTeacherSection.classList.toggle("active", role === "teacher");
      if (newAdminSection) newAdminSection.classList.toggle("active", role === "admin");

      setFieldsDisabled(["#new-class", "#new-year", "#new-prn", "#new-birth", "#new-address"], role !== "student");
      setFieldsDisabled(["#new-subject", "#new-teacher-class"], role !== "teacher");
    };

    if (roleSelect) {
      roleSelect.addEventListener("change", updateCreateRoleSections);
    }

    const resetForm = () => {
      userForm.reset();
      userSubmit.textContent = "Add User";
      if (passwordInput) {
        passwordInput.placeholder = "Password";
      }
      if (teacherLimitedAccess && roleSelect) {
        roleSelect.value = "student";
      }
      updateCreateRoleSections();
    };

    updateCreateRoleSections();

    const openEditModal = (user, role) => {
      if (!editUserModal || !editUserForm) return;
      qs("#edit-user-id").value = user.user_id;
      qs("#edit-name").value = user.name || "";
      qs("#edit-email").value = user.email || "";
      qs("#edit-role").value = role;
      qs("#edit-class").value = role === "student" ? user.student_class || "" : "";
      qs("#edit-year").value = role === "student" ? normalizeYear(user.year || "") : "";
      qs("#edit-prn").value = role === "student" ? user.prn || "" : "";
      qs("#edit-birth").value = role === "student" ? user.birth_date || "" : "";
      qs("#edit-address").value = role === "student" ? user.address || "" : "";
      qs("#edit-subject").value = role === "teacher" ? user.subject || "" : "";
      qs("#edit-teacher-class").value = role === "teacher" ? user.class_name || "" : "";
      qs("#edit-password").value = "";
      if (teacherLimitedAccess && editRoleSelect) {
        editRoleSelect.value = "student";
        editRoleSelect.disabled = true;
      } else if (editRoleSelect) {
        editRoleSelect.disabled = false;
      }
      editUserModal.classList.add("show");
      editUserModal.setAttribute("aria-hidden", "false");
      qs("#edit-name").focus();
    };

    const closeEditModal = () => {
      if (!editUserModal || !editUserForm) return;
      editUserForm.reset();
      editUserModal.classList.remove("show");
      editUserModal.setAttribute("aria-hidden", "true");
    };

    cancelEdit.addEventListener("click", resetForm);
    if (editUserClose) editUserClose.addEventListener("click", closeEditModal);
    if (editUserCancel) editUserCancel.addEventListener("click", closeEditModal);
    if (editUserBackdrop) editUserBackdrop.addEventListener("click", closeEditModal);

    qsa("#user-search, #user-role-filter, #user-class-filter, #user-year-filter").forEach((element) => {
      if (element) element.addEventListener("input", renderUsers);
      if (element) element.addEventListener("change", renderUsers);
    });

    const subjectSearch = qs("#subject-search");
    if (subjectSearch) subjectSearch.addEventListener("input", renderSubjects);
    qsa("#subject-class-filter, #subject-year-filter").forEach((element) => {
      if (element) element.addEventListener("change", renderSubjects);
    });
    const classSearch = qs("#class-search");
    if (classSearch) classSearch.addEventListener("input", renderClasses);

    userForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const rawPassword = qs("#new-password").value.trim();
      const payload = {
        name: qs("#new-name").value.trim(),
        email: qs("#new-email").value.trim(),
        password: rawPassword || null,
        role: qs("#new-role").value,
        student_class: qs("#new-class").value.trim() || null,
        year: normalizeYear(qs("#new-year").value.trim()) || null,
        prn: qs("#new-prn").value.trim() || null,
        birth_date: qs("#new-birth").value.trim() || null,
        address: qs("#new-address").value.trim() || null,
        subject: qs("#new-subject").value.trim() || null,
        class_name: qs("#new-teacher-class").value || null,
      };

      if (payload.role !== "student") {
        payload.student_class = null;
        payload.year = null;
        payload.prn = null;
        payload.birth_date = null;
        payload.address = null;
      }
      if (payload.role !== "teacher") {
        payload.subject = null;
        payload.class_name = null;
      }

      if (!payload.password) {
        announce("Password is required", "error");
        return;
      }
      if (payload.role === "admin") {
        announce("Admin creation is disabled from this form", "error");
        return;
      }
      if (payload.role === "student" && !payload.prn) {
        announce("PRN is required for students", "error");
        return;
      }
      if (payload.role === "student" && !payload.student_class) {
        announce("Class is required for students", "error");
        return;
      }
      if (teacherLimitedAccess && payload.role !== "student") {
        announce("Teacher access allows student management only", "error");
        return;
      }

      if (isOfflineDemo()) {
        const users = getDemoUsers();
        const emailTaken = users.some(
          (user) =>
            user.email.toLowerCase() === payload.email.toLowerCase()
        );
        if (emailTaken) {
          announce("Email already exists in demo users", "error");
          return;
        }
        if (payload.role === "student") {
          const prnTaken = users.some(
            (user) =>
              user.role === "student" &&
              String(user.prn || "").toLowerCase() === String(payload.prn || "").toLowerCase()
          );
          if (prnTaken) {
            announce("PRN already exists in demo users", "error");
            return;
          }
        }

        const stamp = Date.now().toString().slice(-6);
        const nextId =
          payload.role === "student"
            ? `SMJ-${stamp}`
            : payload.role === "teacher"
              ? `SMJ-T-${stamp}`
              : `SMJ-A-${stamp}`;
        users.push({
          user_id: nextId,
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: payload.role,
          student_class: payload.role === "student" ? payload.student_class : undefined,
          year: payload.role === "student" ? payload.year : undefined,
          prn: payload.role === "student" ? payload.prn : undefined,
          birth_date: payload.role === "student" ? payload.birth_date : undefined,
          address: payload.role === "student" ? payload.address : undefined,
          subject: payload.role === "teacher" ? payload.subject : undefined,
          class_name: payload.role === "teacher" ? payload.class_name : undefined,
        });
        saveDemoUsers(users);
        announce("User created (demo mode)");
        resetForm();
        await refreshAdminData();
        setActiveTab("users");
        return;
      }

      let res;
      try {
        res = await authFetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        announce("Backend not reachable. Start server on port 8000.", "error");
        return;
      }

      if (res.ok) {
        announce("User created");
        resetForm();
        await refreshAdminData();
        setActiveTab("users");
      } else {
        let detail = "Unable to create user";
        try {
          const data = await res.json();
          detail = data.detail || detail;
        } catch (error) {
          // ignore
        }
        announce(detail, "error");
      }
    });

    if (editUserForm) {
      editUserForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const editUserId = qs("#edit-user-id").value.trim();
        const payload = {
          name: qs("#edit-name").value.trim(),
          email: qs("#edit-email").value.trim(),
          password: qs("#edit-password").value.trim() || null,
          role: qs("#edit-role").value,
          student_class: qs("#edit-class").value.trim() || null,
          year: normalizeYear(qs("#edit-year").value.trim()) || null,
          prn: qs("#edit-prn").value.trim() || null,
          birth_date: qs("#edit-birth").value.trim() || null,
          address: qs("#edit-address").value.trim() || null,
          subject: qs("#edit-subject").value.trim() || null,
          class_name: qs("#edit-teacher-class").value || null,
        };

        if (!editUserId) {
          announce("Missing user to update", "error");
          return;
        }
        if (payload.role === "admin") {
          announce("Admin role is disabled in this form", "error");
          return;
        }
        if (teacherLimitedAccess && payload.role !== "student") {
          announce("Teacher access can edit students only", "error");
          return;
        }
        if (payload.role === "student" && !payload.student_class) {
          announce("Class is required for students", "error");
          return;
        }

        if (isOfflineDemo()) {
          const users = getDemoUsers();
          const index = users.findIndex((user) => String(user.user_id) === String(editUserId));
          if (index < 0) {
            announce("User not found in demo users", "error");
            return;
          }
          const current = users[index];
          users[index] = {
            ...current,
            name: payload.name,
            email: payload.email,
            role: payload.role,
            password: payload.password || current.password,
            student_class: payload.role === "student" ? payload.student_class || current.student_class : undefined,
            year: payload.role === "student" ? payload.year || current.year : undefined,
            prn: payload.role === "student" ? payload.prn || current.prn : undefined,
            birth_date: payload.role === "student" ? payload.birth_date || current.birth_date : undefined,
            address: payload.role === "student" ? payload.address || current.address : undefined,
            subject: payload.role === "teacher" ? payload.subject || current.subject : undefined,
            class_name: payload.role === "teacher" ? payload.class_name || current.class_name : undefined,
          };
          saveDemoUsers(users);
          announce("User updated (demo mode)");
          closeEditModal();
          await refreshAdminData();
          return;
        }

        let res;
        try {
          res = await authFetch(`/users/${editUserId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (error) {
          announce("Backend not reachable. Start server on port 8000.", "error");
          return;
        }

        if (res.ok) {
          announce("User updated");
          closeEditModal();
          await refreshAdminData();
        } else {
          let detail = "Unable to update user";
          try {
            const data = await res.json();
            detail = data.detail || detail;
          } catch (error) {
            // ignore
          }
          announce(detail, "error");
        }
      });
    }

    qs("#subject-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      if (teacherLimitedAccess) {
        announce("Teacher access does not allow subject changes", "error");
        return;
      }
      const subjectEditId = qs("#subject-edit-id").value.trim();
      const payload = {
        name: qs("#subject-name").value.trim(),
        code: qs("#subject-code").value.trim(),
        class_name: qs("#subject-class").value || null,
        year: normalizeYear(qs("#subject-year").value || "") || null,
      };
      if (!payload.name || !payload.code || !payload.class_name || !payload.year) {
        announce("Subject name, code, class and year are required", "error");
        return;
      }

      if (isOfflineDemo()) {
        const subjects = getDemoSubjects();
        const nameTaken = subjects.some(
          (subject) =>
            subject.name.toLowerCase() === payload.name.toLowerCase() &&
            (subject.class_name || "") === payload.class_name &&
            (subject.year || "") === payload.year &&
            String(subject.id || subject.code) !== String(subjectEditId || "")
        );
        if (nameTaken) {
          announce("Subject already exists for this class and year", "error");
          return;
        }
        const codeTaken = subjects.some(
          (subject) =>
            subject.code.toLowerCase() === payload.code.toLowerCase() &&
            String(subject.id || subject.code) !== String(subjectEditId || "")
        );
        if (codeTaken) {
          announce("Subject code already exists", "error");
          return;
        }

        if (subjectEditId) {
          const index = subjects.findIndex(
            (subject) => String(subject.id || subject.code) === String(subjectEditId)
          );
          if (index < 0) {
            announce("Subject not found", "error");
            return;
          }
          subjects[index] = {
            ...subjects[index],
            name: payload.name,
            code: payload.code,
            class_name: payload.class_name,
            year: payload.year,
          };
          saveDemoSubjects(subjects);
          announce("Subject updated (demo mode)");
        } else {
          subjects.push({ id: `SUB-${Date.now().toString().slice(-6)}`, ...payload });
          saveDemoSubjects(subjects);
          announce("Subject added (demo mode)");
        }
        resetSubjectForm();
        await refreshAdminData();
        setActiveTab("subjects");
        return;
      }

      const endpoint = subjectEditId ? `/subjects/${subjectEditId}` : "/subjects";
      const method = subjectEditId ? "PATCH" : "POST";
      let res;
      try {
        res = await authFetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        announce("Backend not reachable. Start server on port 8000.", "error");
        return;
      }

      if (res.ok) {
        announce(subjectEditId ? "Subject updated" : "Subject added");
        resetSubjectForm();
        await refreshAdminData();
        setActiveTab("subjects");
      } else {
        let detail = subjectEditId ? "Subject update failed" : "Subject creation failed";
        try {
          const data = await res.json();
          detail = data.detail || detail;
        } catch (error) {
          // ignore
        }
        announce(detail, "error");
      }
    });

    const subjectCancelEdit = qs("#subject-cancel-edit");
    if (subjectCancelEdit) {
      subjectCancelEdit.addEventListener("click", resetSubjectForm);
    }

    const resetClassForm = () => {
      const classForm = qs("#class-form");
      const classEditId = qs("#class-edit-id");
      const classSubmit = qs("#class-submit");
      if (classForm) classForm.reset();
      if (classEditId) classEditId.value = "";
      if (classSubmit) classSubmit.textContent = "Add Class";
    };

    const classCancelEdit = qs("#class-cancel-edit");
    if (classCancelEdit) classCancelEdit.addEventListener("click", resetClassForm);

    const classForm = qs("#class-form");
    if (classForm) {
      classForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (teacherLimitedAccess) {
          announce("Teacher access does not allow class changes", "error");
          return;
        }
        const classEditId = qs("#class-edit-id").value.trim();
        const payload = { name: qs("#class-name").value.trim() };
        if (!payload.name) {
          announce("Class name is required", "error");
          return;
        }

        if (isOfflineDemo()) {
          const classes = getDemoClasses();
          const duplicate = classes.some(
            (item) =>
              item.name.toLowerCase() === payload.name.toLowerCase() &&
              String(item.id) !== String(classEditId || "")
          );
          if (duplicate) {
            announce("Class already exists", "error");
            return;
          }
          if (classEditId) {
            const index = classes.findIndex((item) => String(item.id) === String(classEditId));
            if (index < 0) {
              announce("Class not found", "error");
              return;
            }
            classes[index] = { ...classes[index], name: payload.name };
            saveDemoClasses(classes);
            announce("Class updated (demo mode)");
          } else {
            classes.push({ id: `CLS-${Date.now().toString().slice(-6)}`, name: payload.name });
            saveDemoClasses(classes);
            announce("Class added (demo mode)");
          }
          resetClassForm();
          await refreshAdminData();
          setActiveTab("classes");
          return;
        }

        const endpoint = classEditId ? `/classes/${classEditId}` : "/classes";
        const method = classEditId ? "PATCH" : "POST";
        let res;
        try {
          res = await authFetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (error) {
          announce("Backend not reachable. Start server on port 8000.", "error");
          return;
        }
        if (res.ok) {
          announce(classEditId ? "Class updated" : "Class added");
          resetClassForm();
          await refreshAdminData();
          setActiveTab("classes");
        } else {
          let detail = classEditId ? "Class update failed" : "Class creation failed";
          try {
            const data = await res.json();
            detail = data.detail || detail;
          } catch (error) {
            // ignore
          }
          announce(detail, "error");
        }
      });
    }

    const sendAlertsBtn = qs("#send-alerts");
    if (sendAlertsBtn) {
      sendAlertsBtn.addEventListener("click", async () => {
        const res = await authFetch("/notifications/low-attendance", { method: "POST" });
        if (!res.ok) {
          announce("Failed to send alerts", "error");
          return;
        }
        const data = await res.json();
        announce(`Alerts sent to ${data.recipients.length} students`);
      });
    }

    adminBoard.addEventListener("click", async (event) => {
      const editBtn = event.target.closest(".edit-user");
      const deleteBtn = event.target.closest(".delete-user");
      const editSubjectBtn = event.target.closest(".edit-subject");
      const deleteSubjectBtn = event.target.closest(".delete-subject");
      const editClassBtn = event.target.closest(".edit-class");
      const deleteClassBtn = event.target.closest(".delete-class");

      if (editSubjectBtn) {
        if (teacherLimitedAccess) {
          announce("Teacher access does not allow subject changes", "error");
          return;
        }
        const subjectId = editSubjectBtn.dataset.subjectId;
        const subject = adminSubjects.find((item) => String(item.id) === String(subjectId));
        if (!subject) return;
        qs("#subject-edit-id").value = subject.id;
        qs("#subject-name").value = subject.name;
        qs("#subject-code").value = subject.code;
        qs("#subject-class").value = subject.class_name || "";
        qs("#subject-year").value = normalizeYear(subject.year || "");
        qs("#subject-submit").textContent = "Update Subject";
        setActiveTab("subjects");
      }

      if (deleteSubjectBtn) {
        if (teacherLimitedAccess) {
          announce("Teacher access does not allow subject changes", "error");
          return;
        }
        const subjectId = deleteSubjectBtn.dataset.subjectId;
        const confirmed = window.confirm("Delete this subject?");
        if (!confirmed) return;

        if (isOfflineDemo()) {
          const subjects = getDemoSubjects();
          saveDemoSubjects(
            subjects.filter((item) => String(item.id || item.code) !== String(subjectId))
          );
          announce("Subject deleted (demo mode)");
          await refreshAdminData();
          return;
        }

        let res;
        try {
          res = await authFetch(`/subjects/${subjectId}`, { method: "DELETE" });
        } catch (error) {
          announce("Backend not reachable. Start server on port 8000.", "error");
          return;
        }
        if (res.ok) {
          announce("Subject deleted");
          await refreshAdminData();
        } else {
          let detail = "Delete failed";
          try {
            const data = await res.json();
            detail = data.detail || detail;
          } catch (error) {
            // ignore
          }
          announce(detail, "error");
        }
      }

      if (editClassBtn) {
        if (teacherLimitedAccess) {
          announce("Teacher access does not allow class changes", "error");
          return;
        }
        const classId = editClassBtn.dataset.classId;
        const item = adminClasses.find((row) => String(row.id) === String(classId));
        if (!item) return;
        qs("#class-edit-id").value = item.id;
        qs("#class-name").value = item.name;
        qs("#class-submit").textContent = "Update Class";
        setActiveTab("classes");
      }

      if (deleteClassBtn) {
        if (teacherLimitedAccess) {
          announce("Teacher access does not allow class changes", "error");
          return;
        }
        const classId = deleteClassBtn.dataset.classId;
        const confirmed = window.confirm("Delete this class?");
        if (!confirmed) return;
        if (isOfflineDemo()) {
          const classes = getDemoClasses();
          saveDemoClasses(classes.filter((item) => String(item.id) !== String(classId)));
          announce("Class deleted (demo mode)");
          await refreshAdminData();
          return;
        }
        let res;
        try {
          res = await authFetch(`/classes/${classId}`, { method: "DELETE" });
        } catch (error) {
          announce("Backend not reachable. Start server on port 8000.", "error");
          return;
        }
        if (res.ok) {
          announce("Class deleted");
          await refreshAdminData();
        } else {
          let detail = "Delete failed";
          try {
            const data = await res.json();
            detail = data.detail || detail;
          } catch (error) {
            // ignore
          }
          announce(detail, "error");
        }
      }

      if (editBtn) {
        const userId = editBtn.dataset.userId;
        const role = editBtn.dataset.role;
        const source = role === "student" ? adminStudents : adminTeachers;
        const user = source.find((item) => String(item.user_id) === String(userId));
        if (!user) {
          announce("Unable to load selected user for edit", "error");
          return;
        }
        if (teacherLimitedAccess && role !== "student") {
          announce("Teacher access can edit students only", "error");
          return;
        }
        openEditModal(user, role);
        announce(`Editing ${user.name}`);
      }

      if (deleteBtn) {
        const userId = deleteBtn.dataset.userId;
        const confirmed = window.confirm("Delete this user?");
        if (!confirmed) return;
        if (isOfflineDemo()) {
          const users = getDemoUsers();
          const target = users.find((user) => String(user.user_id) === String(userId));
          if (!target) {
            announce("User not found in demo users", "error");
            return;
          }
          if (teacherLimitedAccess && target.role !== "student") {
            announce("Teacher can delete students only", "error");
            return;
          }
          saveDemoUsers(users.filter((user) => String(user.user_id) !== String(userId)));
          announce("User deleted (demo mode)");
          await refreshAdminData();
          return;
        }
        let res;
        try {
          res = await authFetch(`/users/${userId}`, { method: "DELETE" });
        } catch (error) {
          announce("Backend not reachable. Start server on port 8000.", "error");
          return;
        }
        if (res.ok) {
          announce("User deleted");
          await refreshAdminData();
        } else {
          let detail = "Delete failed";
          try {
            const data = await res.json();
            detail = data.detail || detail;
          } catch (error) {
            // ignore
          }
          announce(detail, "error");
        }
      }
    });

    refreshAdminData();
  }

  const contactForm = qs("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      announce("Message sent! Our team will contact you soon.");
      contactForm.reset();
    });
  }
});


