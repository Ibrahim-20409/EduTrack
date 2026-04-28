(() => {
  const STORAGE_KEYS = {
    session: "edutrack_session_v1",
    students: "edutrack_students_v1",
  };

  const ADMIN_CREDENTIALS = {
    email: "admin@edu.pk",
    password: "123",
  };

  function $(id) {
    return document.getElementById(id);
  }

  function getPage() {
    return document.body?.dataset?.page || "";
  }

  function normalizeRole(value) {
    if (value === "Admin" || value === "Student") return value;
    return "Student";
  }

  function readSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.session);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (!parsed.role || !parsed.email) return null;
      return { role: normalizeRole(parsed.role), email: String(parsed.email) };
    } catch {
      return null;
    }
  }

  function writeSession(session) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.session);
  }

  function requireSession() {
    const session = readSession();
    if (!session) {
      window.location.href = "index.html";
      return null;
    }
    return session;
  }

  function wireLogout() {
    const btn = $("logoutBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      clearSession();
      window.location.href = "index.html";
    });
  }

  function readStudents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.students);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((s) => s && typeof s === "object")
        .map((s) => ({
          name: String(s.name ?? "").trim(),
          roll: String(s.roll ?? "").trim(),
        }))
        .filter((s) => s.name && s.roll);
    } catch {
      return [];
    }
  }

  function writeStudents(students) {
    localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(students));
  }

  function renderStudentsTable(students) {
    const tbody = $("studentsTbody");
    const empty = $("studentsEmpty");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (empty) empty.style.display = students.length ? "none" : "block";

    students.forEach((s, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.roll)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function initLoginPage() {
    const year = $("year");
    if (year) year.textContent = String(new Date().getFullYear());

    const existing = readSession();
    if (existing) {
      window.location.href = "dashboard.html";
      return;
    }

    const form = $("loginForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = String($("email")?.value ?? "").trim().toLowerCase();
      const password = String($("password")?.value ?? "").trim();
      const role = normalizeRole(String($("role")?.value ?? "Student"));

      if (!email || !password) {
        alert("Please enter email and password.");
        return;
      }

      if (role === "Admin") {
        const ok = email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
        if (!ok) {
          alert("Invalid Admin credentials.");
          return;
        }
      }

      alert("Login Successful - EduTrack System");
      writeSession({ email, role });
      window.location.href = "dashboard.html";
    });
  }

  function initDashboardPage() {
    const session = requireSession();
    if (!session) return;

    wireLogout();

    const welcomeTitle = $("welcomeTitle");
    const welcomeSubtitle = $("welcomeSubtitle");
    const studentsLink = $("studentsLink");
    const studentsCardTitle = $("studentsCardTitle");
    const studentsCardDesc = $("studentsCardDesc");

    if (welcomeTitle) welcomeTitle.textContent = `Welcome, ${session.role}`;
    if (welcomeSubtitle) {
      welcomeSubtitle.textContent =
        session.role === "Admin"
          ? "You can manage students in this Sprint-1 prototype."
          : "You can view students in this Sprint-1 prototype.";
    }

    if (session.role === "Admin") {
      // ES1-2: Role-Based Access implemented
      console.log("Admin has full access to manage students");
      if (studentsLink) studentsLink.textContent = "Manage Students";
      if (studentsCardTitle) studentsCardTitle.textContent = "Manage Students";
      if (studentsCardDesc)
        studentsCardDesc.textContent = "Add students and view the student list (Admin only).";
    } else {
      if (studentsLink) studentsLink.textContent = "View Students";
      if (studentsCardTitle) studentsCardTitle.textContent = "View Students";
      if (studentsCardDesc) studentsCardDesc.textContent = "View the student list (read-only).";
    }
  }

  function initStudentsPage() {
    const session = requireSession();
    if (!session) return;

    wireLogout();

    const roleBadge = $("roleBadge");
    if (roleBadge) roleBadge.textContent = `Role: ${session.role}`;

    const adminOnly = $("adminOnly");
    const studentViewOnly = $("studentViewOnly");

    const students = readStudents();
    renderStudentsTable(students);

    if (session.role !== "Admin") {
      if (adminOnly) adminOnly.classList.add("panel__section--hidden");
      if (studentViewOnly) studentViewOnly.classList.remove("panel__section--hidden");
      return;
    }

    const form = $("studentForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = String($("studentName")?.value ?? "").trim();
      const roll = String($("rollNumber")?.value ?? "").trim();

      if (!name || !roll) {
        alert("Please fill in Student Name and Roll Number.");
        return;
      }

      const updated = readStudents();
      updated.push({ name, roll });
      writeStudents(updated);
      renderStudentsTable(updated);

      if ($("studentName")) $("studentName").value = "";
      if ($("rollNumber")) $("rollNumber").value = "";
      $("studentName")?.focus();
    });
  }

  function main() {
    const page = getPage();
    if (page === "login") initLoginPage();
    if (page === "dashboard") initDashboardPage();
    if (page === "students") initStudentsPage();
  }

  document.addEventListener("DOMContentLoaded", main);
})();

