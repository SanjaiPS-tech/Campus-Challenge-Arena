/**
 * Campus Challenge Arena - Hand-Drawn Creative Planner Controller
 * Sketch Aesthetics • Playful Animations • MySQL Integration
 */

(function () {
  'use strict';

  const AppState = {
    currentSection: 'dashboard',
    currentRole: 'STUDENT',
    selectedLoginRole: 'STUDENT',
    students: [],
    competitions: [],
    summaries: [],
    activeStudentId: null,
    currentLeaderboardId: null,
    currentArenaCompId: null,
    arenaChallenges: [],
    currentFilter: 'ALL',
    isGlobalLeaderboard: false,
    selectedRegCompId: null,
    activeOrganizerTab: 'create-comp',
    refreshTimer: null,
    spotlightCompId: null,
  };

  // Planner Sections Metadata
  const SECTIONS_META = {
    dashboard: {
      title: 'Planner Overview',
      subtitle: 'Daily agenda, active challenges, and sketched milestones'
    },
    arena: {
      title: 'Solve Arena',
      subtitle: 'Problem Scratchpad & Instant Pencil Checks'
    },
    leaderboard: {
      title: 'Goal Tracker & Scoreboard',
      subtitle: 'Cumulative student scores, solved problems, and ranking medals'
    },
    competitions: {
      title: 'Event Calendar & Schedules',
      subtitle: 'Weekly competition horizons, hackathons, and quiz dates'
    },
    students: {
      title: 'Student Class Directory',
      subtitle: 'All enrolled students recorded in the database'
    },
    organizer: {
      title: 'Organizer Studio & Grading Desk',
      subtitle: 'Draft new contests, attach challenge assignments, and grade papers'
    },
    history: {
      title: 'Memory Scrapbook & Past Seasons',
      subtitle: 'Historical records, final podiums, and past champion awards'
    }
  };

  // Toast Helper (Sketched Sticky Note Alert)
  function showToast(title, message, isError = false) {
    const toast = document.getElementById('toast');
    const toastCard = document.getElementById('toast-card');
    const toastTitle = document.getElementById('toast-title');
    const toastMsg = document.getElementById('toast-msg');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast) return;

    toastTitle.textContent = title;
    toastMsg.textContent = message;
    toastIcon.textContent = isError ? '⚠️' : '✏️';

    if (isError) {
      if (toastCard) toastCard.className = 'sketch-box p-4 bg-pastel-pink border-2 border-ink shadow-sketch-lg flex items-center gap-3 max-w-md relative rotate-1';
    } else {
      if (toastCard) toastCard.className = 'sketch-box p-4 bg-pastel-yellow border-2 border-ink shadow-sketch-lg flex items-center gap-3 max-w-md relative rotate-1';
    }

    toast.classList.remove('-translate-y-28', 'opacity-0', 'pointer-events-none');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('-translate-y-28', 'opacity-0', 'pointer-events-none');
    }, 4000);
  }

  // API Call helper
  async function api(endpoint, options = {}) {
    try {
      const res = await fetch('/api' + endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('API Error:', endpoint, err);
      return { success: false, message: err.message };
    }
  }

  // Planner Tab Switching Logic
  function switchSection(sectionId, updateHash = true) {
    if (!SECTIONS_META[sectionId]) {
      sectionId = 'dashboard';
    }

    // Role-based access validation
    if (sectionId === 'organizer' && AppState.currentRole === 'STUDENT') {
      showToast('Faculty Area 🔒', 'Organizer Studio is reserved for Teachers & Admins. Switch role to access.', true);
      sectionId = 'dashboard';
    }

    AppState.currentSection = sectionId;

    // 1. Hide all pages and show target page with page-turn animation
    document.querySelectorAll('.dashboard-view').forEach(view => {
      view.classList.remove('active');
    });
    const targetView = document.getElementById(`view-${sectionId}`);
    if (targetView) {
      targetView.classList.add('active');
    }

    // 2. Update navigation item styles as colorful tabbed dividers
    const tabColors = {
      dashboard: 'bg-pastel-yellow',
      arena: 'bg-pastel-mint',
      leaderboard: 'bg-pastel-lavender',
      competitions: 'bg-pastel-blue',
      students: 'bg-pastel-pink',
      organizer: 'bg-pastel-terracotta',
      history: 'bg-stone-200'
    };

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.className = 'nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 border-transparent text-sm font-hand text-stone-700 hover:bg-stone-100 transition-all text-left';
    });
    const activeNavBtn = document.getElementById(`nav-btn-${sectionId}`);
    if (activeNavBtn) {
      const colorClass = tabColors[sectionId] || 'bg-pastel-yellow';
      activeNavBtn.className = `nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 border-ink text-sm font-hand text-ink ${colorClass} shadow-sketch-sm transition-all text-left`;
    }

    // 3. Update top header title & subtitle
    const titleEl = document.getElementById('topbar-section-title');
    const subtitleEl = document.getElementById('topbar-section-subtitle');
    if (titleEl) titleEl.textContent = SECTIONS_META[sectionId].title;
    if (subtitleEl) subtitleEl.textContent = SECTIONS_META[sectionId].subtitle;

    // 4. Update window hash
    if (updateHash) {
      history.replaceState(null, null, `#${sectionId}`);
    }

    // Close mobile sidebar if open
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
      sidebar.classList.remove('mobile-open');
    }

    // Scroll to top of open notebook page
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  }

  function toggleMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('hidden');
    }
  }

  // Handle URL hash routing
  function handleHashRoute() {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && SECTIONS_META[hash]) {
      switchSection(hash, false);
    } else {
      switchSection('dashboard', false);
    }
  }

  // ==============================================================
  // ROLE-BASED AUTHENTICATION & ACCESS CONTROL
  // Roles: STUDENT | TEACHER | ADMIN
  // ==============================================================

  function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    AppState.selectedLoginRole = AppState.currentRole;
    modal.classList.remove('hidden');
    selectLoginRole(AppState.selectedLoginRole);
  }

  function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('hidden');
  }

  function selectLoginRole(role) {
    AppState.selectedLoginRole = role;

    ['STUDENT', 'TEACHER', 'ADMIN'].forEach(r => {
      const tab = document.getElementById(`role-tab-${r}`);
      if (tab) {
        if (r === role) {
          const activeBg = r === 'STUDENT' ? 'bg-pastel-mint' : (r === 'TEACHER' ? 'bg-pastel-lavender' : 'bg-pastel-yellow');
          tab.className = `sketch-box p-3.5 ${activeBg} border-2 border-ink text-left transition-all shadow-sketch-sm scale-[1.02]`;
        } else {
          tab.className = `sketch-box p-3.5 bg-white hover:bg-stone-50 border-2 border-stone-300 text-left transition-all`;
        }
      }
    });

    renderLoginRolePanel();
  }

  function renderLoginRolePanel() {
    const panel = document.getElementById('login-role-panel');
    if (!panel) return;

    const role = AppState.selectedLoginRole || 'STUDENT';

    if (role === 'STUDENT') {
      const studentsOptions = AppState.students.map(s => `
        <option value="${s.studentId}" ${s.studentId == AppState.activeStudentId ? 'selected' : ''}>
          ${escapeHtml(s.studentName)} (${escapeHtml(s.department)} • Yr ${s.yearOfStudy})
        </option>
      `).join('');

      panel.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-hand font-bold text-base text-ink flex items-center gap-1.5">
              <span>🎓</span> Student Persona Profile
            </span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-pastel-mint border border-ink font-hand font-bold">
              Solve & Enroll Mode
            </span>
          </div>

          <div class="space-y-1">
            <label class="block font-hand text-xs font-bold text-stone-600">Select Student Account:</label>
            <select id="modal-role-student-select" class="w-full p-2 rounded-xl bg-pastel-mint/30 border-2 border-ink text-xs font-hand text-ink focus:outline-none">
              ${studentsOptions}
            </select>
          </div>

          <div class="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs font-sans text-stone-600 space-y-1">
            <div>✓ Solve challenges in the Arena & run instant pencil checks</div>
            <div>✓ Enroll into live competitions and track leaderboard medals</div>
            <div class="text-stone-400">✗ Creation of contests and assignments is reserved for Faculty</div>
          </div>

          <button onclick="window.app.confirmRoleLogin('STUDENT', document.getElementById('modal-role-student-select').value)" class="sketch-btn w-full py-2.5 bg-pastel-mint hover:bg-pastel-mintdark text-ink font-bold text-base">
            Log In as Student ➔
          </button>
        </div>
      `;
    } else if (role === 'TEACHER') {
      panel.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-hand font-bold text-base text-ink flex items-center gap-1.5">
              <span>👨‍🏫</span> Faculty Instructor Account
            </span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-pastel-lavender border border-ink font-hand font-bold">
              Organizer Desk
            </span>
          </div>

          <div class="p-3 bg-pastel-lavender/30 border-2 border-ink rounded-xl space-y-1">
            <div class="font-hand font-bold text-lg text-ink">Prof. Vikram Sarabhai</div>
            <div class="text-xs text-stone-600 font-sans">Dept. of Computer Science & Engineering • Faculty ID: FAC-2026-CS</div>
            <div class="text-xs text-stone-600 font-sans">Email: prof.sarabhai@campus.edu</div>
          </div>

          <div class="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs font-sans text-stone-600 space-y-1">
            <div>✓ Full access to Organizer Studio (Draft contests, assignments)</div>
            <div>✓ Grade student submissions and assign marks</div>
            <div>✓ Access Student Class Directory & roster analytics</div>
            <div class="text-stone-400">✗ Solving questions in Arena is disabled for faculty</div>
          </div>

          <button onclick="window.app.confirmRoleLogin('TEACHER')" class="sketch-btn w-full py-2.5 bg-pastel-lavender hover:bg-pastel-lavenderdark text-ink font-bold text-base">
            Log In as Teacher ➔
          </button>
        </div>
      `;
    } else if (role === 'ADMIN') {
      panel.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-hand font-bold text-base text-ink flex items-center gap-1.5">
              <span>🛡️</span> System Administrator Console
            </span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-pastel-yellow border border-ink font-hand font-bold">
              Superuser Root
            </span>
          </div>

          <div class="p-3 bg-pastel-yellow/30 border-2 border-ink rounded-xl space-y-1">
            <div class="font-hand font-bold text-lg text-ink">Admin Console (Root)</div>
            <div class="text-xs text-stone-600 font-sans">Full Database & Application Governance • ID: ROOT-01</div>
            <div class="text-xs text-stone-600 font-sans">Email: admin@campus.edu</div>
          </div>

          <div class="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs font-sans text-stone-600 space-y-1">
            <div>✓ Toggle competition lifecycle states (Active, Upcoming, Concluded)</div>
            <div>✓ One-click database reset and seed demo records in MySQL</div>
            <div>✓ Register and edit student directory slips</div>
            <div>✓ Full authoring and grading permissions</div>
          </div>

          <button onclick="window.app.confirmRoleLogin('ADMIN')" class="sketch-btn w-full py-2.5 bg-pastel-yellow hover:bg-pastel-yellowdark text-ink font-bold text-base">
            Log In as Administrator ➔
          </button>
        </div>
      `;
    }
  }

  function confirmRoleLogin(role, studentId = null) {
    AppState.currentRole = role;
    localStorage.setItem('campus_arena_role', role);

    if (role === 'STUDENT' && studentId) {
      AppState.activeStudentId = parseInt(studentId);
    }

    closeLoginModal();
    applyRolePermissions();

    const titleMap = {
      STUDENT: 'Logged in as Student 🎓',
      TEACHER: 'Logged in as Faculty Teacher 👨‍🏫',
      ADMIN: 'Logged in as System Administrator 🛡️'
    };

    const descMap = {
      STUDENT: 'Student desk unlocked: Solve challenges & view leaderboard goals.',
      TEACHER: 'Organizer Studio unlocked: Draft contests & grade papers.',
      ADMIN: 'Admin Console unlocked: Full system & lifecycle privileges active.'
    };

    showToast(titleMap[role] || 'Logged In', descMap[role] || 'Role updated');

    if (role === 'TEACHER' && AppState.currentSection === 'arena') {
      switchSection('organizer');
    } else if (role === 'STUDENT' && AppState.currentSection === 'organizer') {
      switchSection('dashboard');
    }
  }

  function applyRolePermissions() {
    const role = AppState.currentRole || 'STUDENT';

    // 1. Sidebar role badge
    const roleBadge = document.getElementById('sidebar-role-badge');
    if (roleBadge) {
      if (role === 'STUDENT') {
        roleBadge.className = 'inline-flex items-center gap-1 text-[11px] font-hand font-bold px-2 py-0.5 rounded-full border border-ink bg-pastel-mint text-ink';
        roleBadge.innerHTML = '🎓 Student Mode';
      } else if (role === 'TEACHER') {
        roleBadge.className = 'inline-flex items-center gap-1 text-[11px] font-hand font-bold px-2 py-0.5 rounded-full border border-ink bg-pastel-lavender text-ink';
        roleBadge.innerHTML = '👨‍🏫 Teacher Mode';
      } else {
        roleBadge.className = 'inline-flex items-center gap-1 text-[11px] font-hand font-bold px-2 py-0.5 rounded-full border border-ink bg-pastel-yellow text-ink';
        roleBadge.innerHTML = '🛡️ Admin Mode';
      }
    }

    // 2. Nav mode label
    const navMode = document.getElementById('nav-mode-label');
    if (navMode) navMode.textContent = role;

    // 3. User tag & persona details in footer
    const userTag = document.getElementById('current-user-role-tag');
    const userName = document.getElementById('current-user-name');
    const studentWrapper = document.getElementById('student-persona-wrapper');

    if (role === 'STUDENT') {
      if (userTag) {
        userTag.className = 'text-[10px] font-mono px-1.5 rounded bg-pastel-mint font-bold border border-ink';
        userTag.textContent = 'STUDENT';
      }
      const student = AppState.students.find(s => s.studentId == AppState.activeStudentId);
      if (userName) userName.textContent = student ? student.studentName : 'Student Account';
      if (studentWrapper) studentWrapper.classList.remove('hidden');
    } else if (role === 'TEACHER') {
      if (userTag) {
        userTag.className = 'text-[10px] font-mono px-1.5 rounded bg-pastel-lavender font-bold border border-ink';
        userTag.textContent = 'FACULTY';
      }
      if (userName) userName.textContent = 'Prof. Vikram Sarabhai';
      if (studentWrapper) studentWrapper.classList.add('hidden');
    } else {
      if (userTag) {
        userTag.className = 'text-[10px] font-mono px-1.5 rounded bg-pastel-yellow font-bold border border-ink';
        userTag.textContent = 'ROOT ADMIN';
      }
      if (userName) userName.textContent = 'System Administrator';
      if (studentWrapper) studentWrapper.classList.add('hidden');
    }

    // 4. Topbar role label
    const topbarRole = document.getElementById('topbar-role-label');
    if (topbarRole) {
      if (role === 'STUDENT') {
        const student = AppState.students.find(s => s.studentId == AppState.activeStudentId);
        topbarRole.textContent = `Student (${student ? student.studentName.split(' ')[0] : 'Active'}) ▾`;
      } else if (role === 'TEACHER') {
        topbarRole.textContent = 'Teacher (Prof. Vikram) ▾';
      } else {
        topbarRole.textContent = 'Admin Console ▾';
      }
    }

    // 5. Navigation elements visibility
    document.querySelectorAll('.nav-student').forEach(el => {
      el.style.display = (role === 'STUDENT' || role === 'ADMIN') ? '' : 'none';
    });

    document.querySelectorAll('.nav-teacher').forEach(el => {
      el.style.display = (role === 'TEACHER' || role === 'ADMIN') ? '' : 'none';
    });

    document.querySelectorAll('.nav-admin').forEach(el => {
      el.style.display = (role === 'ADMIN') ? '' : 'none';
    });

    document.querySelectorAll('.nav-staff-header').forEach(el => {
      el.style.display = (role === 'STUDENT') ? 'none' : '';
    });

    // 6. Topbar quick actions visibility
    const topSolve = document.getElementById('topbar-btn-solve');
    const topDraft = document.getElementById('topbar-btn-draft');
    const topSeed = document.getElementById('topbar-btn-seed');

    if (topSolve) topSolve.style.display = (role === 'STUDENT' || role === 'ADMIN') ? 'inline-flex' : 'none';
    if (topDraft) topDraft.style.display = (role === 'TEACHER' || role === 'ADMIN') ? 'inline-flex' : 'none';
    if (topSeed) topSeed.style.display = (role === 'ADMIN') ? 'inline-flex' : 'none';

    // 7. Dashboard welcome banner
    const welcomeIcon = document.getElementById('role-welcome-icon');
    const welcomeTitle = document.getElementById('role-welcome-title');
    const welcomeDesc = document.getElementById('role-welcome-desc');

    if (role === 'STUDENT') {
      const student = AppState.students.find(s => s.studentId == AppState.activeStudentId);
      if (welcomeIcon) welcomeIcon.textContent = '🎓';
      if (welcomeTitle) welcomeTitle.textContent = `Welcome to the Student Arena, ${student ? student.studentName : 'Student'}!`;
      if (welcomeDesc) welcomeDesc.textContent = 'Solve active problem sets, track your goals on the leaderboard, and submit answers.';
    } else if (role === 'TEACHER') {
      if (welcomeIcon) welcomeIcon.textContent = '👨‍🏫';
      if (welcomeTitle) welcomeTitle.textContent = 'Welcome to Faculty Desk, Prof. Vikram!';
      if (welcomeDesc) welcomeDesc.textContent = 'Draft new competitions, attach challenge assignments, grade papers, and inspect class rosters.';
    } else {
      if (welcomeIcon) welcomeIcon.textContent = '🛡️';
      if (welcomeTitle) welcomeTitle.textContent = 'Welcome System Administrator!';
      if (welcomeDesc) welcomeDesc.textContent = 'Full platform governance: manage contest lifecycle states (Active/Upcoming/Completed), seed MySQL database, and oversee student submissions.';
    }

    // 8. Role-Tailored Dashboard Actions
    renderDashboardRoleActions();

    // 9. Re-render competitions grid for admin controls
    renderCompetitionsGrid(AppState.summaries);
  }

  function renderDashboardRoleActions() {
    const container = document.getElementById('dashboard-role-actions');
    if (!container) return;

    if (AppState.currentRole === 'STUDENT') {
      const student = AppState.students.find(s => s.studentId == AppState.activeStudentId);
      const studentName = student ? student.studentName : 'Student';
      container.innerHTML = `
        <div class="space-y-2.5">
          <div class="flex items-center gap-2 border-b-2 border-dashed border-stone-200 pb-2">
            <span class="text-xl">🎓</span>
            <div>
              <div class="font-hand font-bold text-base text-ink">Student Desk • ${escapeHtml(studentName)}</div>
              <div class="text-[11px] text-stone-500 font-sans">Enrolled in active campus rounds</div>
            </div>
          </div>

          <div class="space-y-2">
            <button onclick="window.app.switchSection('arena')" class="w-full sketch-btn p-3 bg-pastel-mint hover:bg-pastel-mintdark text-ink text-left flex items-center justify-between group">
              <div>
                <div class="font-hand font-bold text-base flex items-center gap-1.5">
                  <span>✏️</span> Jump to Solve Arena
                </div>
                <div class="text-[11px] text-stone-600 font-sans">Select challenge task & verify answers</div>
              </div>
              <span class="text-lg group-hover:translate-x-1 transition-transform">➔</span>
            </button>

            <button onclick="window.app.switchSection('leaderboard')" class="w-full sketch-btn p-3 bg-pastel-lavender hover:bg-pastel-lavenderdark text-ink text-left flex items-center justify-between group">
              <div>
                <div class="font-hand font-bold text-base flex items-center gap-1.5">
                  <span>🏆</span> Check Standings & Badges
                </div>
                <div class="text-[11px] text-stone-600 font-sans">Track personal rank and solved problems</div>
              </div>
              <span class="text-lg group-hover:translate-x-1 transition-transform">➔</span>
            </button>

            <button onclick="window.app.switchSection('competitions')" class="w-full sketch-btn p-3 bg-pastel-blue hover:bg-pastel-bluedark text-ink text-left flex items-center justify-between group">
              <div>
                <div class="font-hand font-bold text-base flex items-center gap-1.5">
                  <span>🗓️</span> Browse Contest Calendar
                </div>
                <div class="text-[11px] text-stone-600 font-sans">Sign up for upcoming hackathons & quizzes</div>
              </div>
              <span class="text-lg group-hover:translate-x-1 transition-transform">➔</span>
            </button>
          </div>
        </div>
      `;
    } else if (AppState.currentRole === 'TEACHER') {
      container.innerHTML = `
        <div class="space-y-2.5">
          <div class="flex items-center gap-2 border-b-2 border-dashed border-stone-200 pb-2">
            <span class="text-xl">👨‍🏫</span>
            <div>
              <div class="font-hand font-bold text-base text-ink">Faculty Studio • Prof. Vikram Sarabhai</div>
              <div class="text-[11px] text-stone-500 font-sans">Curator & Examination Evaluator</div>
            </div>
          </div>

          <div class="space-y-2">
            <button onclick="window.app.switchOrganizerTab('create-comp'); window.app.switchSection('organizer');" class="w-full sketch-btn p-3 bg-pastel-yellow hover:bg-pastel-yellowdark text-ink text-left flex items-center justify-between group">
              <div>
                <div class="font-hand font-bold text-base flex items-center gap-1.5">
                  <span>➕</span> Draft New Competition
                </div>
                <div class="text-[11px] text-stone-600 font-sans">Publish quizzes, coding rounds, & deadlines</div>
              </div>
              <span class="text-lg group-hover:translate-x-1 transition-transform">➔</span>
            </button>

            <button onclick="window.app.switchOrganizerTab('add-challenge'); window.app.switchSection('organizer');" class="w-full sketch-btn p-3 bg-pastel-mint hover:bg-pastel-mintdark text-ink text-left flex items-center justify-between group">
              <div>
                <div class="font-hand font-bold text-base flex items-center gap-1.5">
                  <span>🧩</span> Attach Challenge Question
                </div>
                <div class="text-[11px] text-stone-600 font-sans">Add problem statement, points, and answer key</div>
              </div>
              <span class="text-lg group-hover:translate-x-1 transition-transform">➔</span>
            </button>

            <button onclick="window.app.switchOrganizerTab('review-submissions'); window.app.switchSection('organizer');" class="w-full sketch-btn p-3 bg-pastel-lavender hover:bg-pastel-lavenderdark text-ink text-left flex items-center justify-between group">
              <div>
                <div class="font-hand font-bold text-base flex items-center gap-1.5">
                  <span>📝</span> Grade Student Submissions
                </div>
                <div class="text-[11px] text-stone-600 font-sans">Review answers and award manual marks</div>
              </div>
              <span class="text-lg group-hover:translate-x-1 transition-transform">➔</span>
            </button>

            <button onclick="window.app.switchSection('students')" class="w-full sketch-btn p-3 bg-pastel-pink hover:bg-pastel-pinkdark text-ink text-left flex items-center justify-between group">
              <div>
                <div class="font-hand font-bold text-base flex items-center gap-1.5">
                  <span>👥</span> Student Class Directory
                </div>
                <div class="text-[11px] text-stone-600 font-sans">View enrolled students and class sizes</div>
              </div>
              <span class="text-lg group-hover:translate-x-1 transition-transform">➔</span>
            </button>
          </div>
        </div>
      `;
    } else if (AppState.currentRole === 'ADMIN') {
      container.innerHTML = `
        <div class="space-y-2.5">
          <div class="flex items-center gap-2 border-b-2 border-dashed border-stone-200 pb-2">
            <span class="text-xl">🛡️</span>
            <div>
              <div class="font-hand font-bold text-base text-ink">System Administrator Console</div>
              <div class="text-[11px] text-stone-500 font-sans">Full Platform Superuser Privileges</div>
            </div>
          </div>

          <div class="space-y-2">
            <button onclick="window.app.switchSection('competitions')" class="w-full sketch-btn p-3 bg-pastel-blue hover:bg-pastel-bluedark text-ink text-left flex items-center justify-between group">
              <div>
                <div class="font-hand font-bold text-base flex items-center gap-1.5">
                  <span>⚡</span> Contest Lifecycle Controls
                </div>
                <div class="text-[11px] text-stone-600 font-sans">Toggle status (ACTIVE, UPCOMING, CONCLUDED)</div>
              </div>
              <span class="text-lg group-hover:translate-x-1 transition-transform">➔</span>
            </button>

            <button onclick="window.app.resetAndSeedData()" class="w-full sketch-btn p-3 bg-pastel-yellow hover:bg-pastel-yellowdark text-ink text-left flex items-center justify-between group">
              <div>
                <div class="font-hand font-bold text-base flex items-center gap-1.5">
                  <span>↻</span> Seed / Reset MySQL Database
                </div>
                <div class="text-[11px] text-stone-600 font-sans">Clean restore of demo records in campus_challenge</div>
              </div>
              <span class="text-lg group-hover:translate-x-1 transition-transform">➔</span>
            </button>

            <button onclick="window.app.switchSection('students')" class="w-full sketch-btn p-3 bg-pastel-pink hover:bg-pastel-pinkdark text-ink text-left flex items-center justify-between group">
              <div>
                <div class="font-hand font-bold text-base flex items-center gap-1.5">
                  <span>📝</span> Register New Student Slip
                </div>
                <div class="text-[11px] text-stone-600 font-sans">Insert fresh student profile into MySQL</div>
              </div>
              <span class="text-lg group-hover:translate-x-1 transition-transform">➔</span>
            </button>

            <button onclick="window.app.switchSection('organizer')" class="w-full sketch-btn p-3 bg-pastel-mint hover:bg-pastel-mintdark text-ink text-left flex items-center justify-between group">
              <div>
                <div class="font-hand font-bold text-base flex items-center gap-1.5">
                  <span>🎨</span> Access Organizer Desk
                </div>
                <div class="text-[11px] text-stone-600 font-sans">Manage contests, assignments & evaluations</div>
              </div>
              <span class="text-lg group-hover:translate-x-1 transition-transform">➔</span>
            </button>
          </div>
        </div>
      `;
    }
  }

  async function updateCompetitionStatus(competitionId, newStatus) {
    if (AppState.currentRole !== 'ADMIN') {
      showToast('Admin Required', 'Only system administrators can alter competition lifecycle states.', true);
      return;
    }
    showToast('Updating Schedule...', `Changing competition #${competitionId} status to ${newStatus}.`);
    const res = await api(`/competitions/${competitionId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    if (res.success) {
      showToast('Contest Updated! 🎯', `Competition status changed to ${newStatus}.`);
      await loadCompetitions();
      await loadSystemStats();
    } else {
      showToast('Status Update Failed', res.message || 'Could not update status', true);
    }
  }

  // Initial Load
  async function init() {
    // Restore saved role from localStorage
    const savedRole = localStorage.getItem('campus_arena_role');
    if (savedRole && ['STUDENT', 'TEACHER', 'ADMIN'].includes(savedRole)) {
      AppState.currentRole = savedRole;
      AppState.selectedLoginRole = savedRole;
    }

    await loadSystemStats();
    await loadStudents();
    await loadCompetitions();
    await loadHistory();
    setupDefaultDates();

    applyRolePermissions();

    // Check initial hash route
    handleHashRoute();
    window.addEventListener('hashchange', handleHashRoute);

    // Periodic refresh for leaderboard (every 8s)
    if (AppState.refreshTimer) clearInterval(AppState.refreshTimer);
    AppState.refreshTimer = setInterval(() => {
      if (!AppState.isGlobalLeaderboard && AppState.currentLeaderboardId && AppState.currentSection === 'leaderboard') {
        refreshCurrentLeaderboard(false);
      }
    }, 8000);
  }

  function setupDefaultDates() {
    const now = new Date();
    const startStr = now.toISOString().slice(0, 16);
    const end = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const endStr = end.toISOString().slice(0, 16);

    const startInput = document.getElementById('new-comp-start');
    const endInput = document.getElementById('new-comp-end');
    if (startInput && !startInput.value) startInput.value = startStr;
    if (endInput && !endInput.value) endInput.value = endStr;
  }

  // System Stats
  async function loadSystemStats() {
    const res = await api('/system/stats');
    if (res.success && res.data) {
      const d = res.data;
      animateNumber('stat-competitions', d.totalCompetitions || 0);
      animateNumber('stat-students', d.totalStudents || 0);
      animateNumber('stat-challenges', d.totalChallenges || 0);
      animateNumber('stat-submissions', d.totalSubmissions || 0);

      const navBadge = document.getElementById('nav-badge-competitions');
      if (navBadge) navBadge.textContent = d.totalCompetitions || 0;
    }
  }

  function animateNumber(id, finalValue) {
    const el = document.getElementById(id);
    if (!el) return;
    let start = 0;
    const duration = 600;
    const step = Math.max(1, Math.floor(finalValue / 15));
    const timer = setInterval(() => {
      start += step;
      if (start >= finalValue) {
        el.textContent = finalValue;
        clearInterval(timer);
      } else {
        el.textContent = start;
      }
    }, 30);
  }

  // Load Students
  async function loadStudents() {
    const res = await api('/students');
    if (res.success && res.data) {
      AppState.students = res.data;
      renderStudentsList(res.data);
      populateStudentDropdowns(res.data);

      if (!AppState.activeStudentId && res.data.length > 0) {
        AppState.activeStudentId = res.data[0].studentId;
      }

      const activeSelect = document.getElementById('active-student-select');
      if (activeSelect && AppState.activeStudentId) {
        activeSelect.value = AppState.activeStudentId;
      }
    }
  }

  function populateStudentDropdowns(students) {
    const activeSelect = document.getElementById('active-student-select');
    const arenaSelect = document.getElementById('arena-student-select');
    const modalSelect = document.getElementById('modal-student-select');

    const makeOptions = (includeDefault = false) => {
      let html = includeDefault ? '<option value="">-- Choose Student --</option>' : '';
      students.forEach(s => {
        html += `<option value="${s.studentId}">${escapeHtml(s.studentName)} (${escapeHtml(s.department)} • Yr ${s.yearOfStudy})</option>`;
      });
      return html;
    };

    if (activeSelect) activeSelect.innerHTML = makeOptions();
    if (arenaSelect) arenaSelect.innerHTML = makeOptions(true);
    if (modalSelect) modalSelect.innerHTML = makeOptions(true);

    if (AppState.activeStudentId) {
      if (activeSelect) activeSelect.value = AppState.activeStudentId;
      if (arenaSelect) arenaSelect.value = AppState.activeStudentId;
      if (modalSelect) modalSelect.value = AppState.activeStudentId;
    }
  }

  function renderStudentsList(students) {
    const container = document.getElementById('students-list-container');
    const badge = document.getElementById('student-count-badge');
    if (!container) return;

    if (badge) badge.textContent = `${students.length} Students`;

    if (students.length === 0) {
      container.innerHTML = `<p class="p-6 text-sm font-hand text-stone-500 text-center">No students registered on the roster yet. Fill out the slip on the right.</p>`;
      return;
    }

    container.innerHTML = students.map(s => `
      <div class="py-3 px-3.5 flex items-center justify-between gap-3 hover:bg-stone-50 rounded-xl transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full border-2 border-ink bg-pastel-mint flex items-center justify-center font-hand text-sm font-bold text-ink">
            #${s.studentId}
          </div>
          <div>
            <div class="font-hand font-bold text-base text-ink flex items-center gap-2">
              ${escapeHtml(s.studentName)}
              ${AppState.activeStudentId == s.studentId ? '<span class="bg-pastel-pink border border-ink text-ink text-[10px] px-2 py-0.2 font-bold uppercase rounded-full">★ Active</span>' : ''}
            </div>
            <div class="text-xs text-stone-600 font-sans">${escapeHtml(s.email)}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="font-hand font-bold text-sm text-rose-600">${escapeHtml(s.department)}</div>
          <div class="text-xs font-hand text-stone-500">Year ${s.yearOfStudy}</div>
        </div>
      </div>
    `).join('');
  }

  function onActiveStudentChange(studentId) {
    AppState.activeStudentId = studentId ? parseInt(studentId) : null;
    renderStudentsList(AppState.students);
    const arenaSelect = document.getElementById('arena-student-select');
    if (arenaSelect && AppState.activeStudentId) {
      arenaSelect.value = AppState.activeStudentId;
      loadStudentSubmissionsInArena();
    }
    const student = AppState.students.find(s => s.studentId == AppState.activeStudentId);
    showToast('Participant Switched', student ? `Acting as ${student.studentName}` : `Student #${studentId} selected`);
    applyRolePermissions();
  }

  // Load Competitions
  async function loadCompetitions() {
    const res = await api('/competitions/summaries');
    if (res.success && res.data) {
      AppState.summaries = res.data;
      AppState.competitions = res.data.map(s => s.competition);

      renderCompetitionsGrid(res.data);
      updateSpotlightCard(res.data);
      updateDashboardQuickCompetitions(res.data);
      populateCompetitionDropdowns(res.data);

      if (!AppState.currentLeaderboardId && res.data.length > 0) {
        AppState.currentLeaderboardId = res.data[0].competition.competitionId;
        loadLeaderboard(AppState.currentLeaderboardId);
      }
    }
  }

  function populateCompetitionDropdowns(summaries) {
    const lbSelect = document.getElementById('leaderboard-competition-select');
    const arenaSelect = document.getElementById('arena-competition-select');
    const targetCompSelect = document.getElementById('challenge-target-comp');
    const reviewCompSelect = document.getElementById('review-comp-select');

    let options = summaries.map(s => {
      const c = s.competition;
      const statusIcon = c.competitionStatus === 'ACTIVE' ? '🟢' : (c.competitionStatus === 'UPCOMING' ? '⏳' : '🏁');
      return `<option value="${c.competitionId}">${statusIcon} ${escapeHtml(c.competitionName)} [${c.competitionStatus}]</option>`;
    }).join('');

    if (lbSelect) {
      lbSelect.innerHTML = options;
      if (AppState.currentLeaderboardId) lbSelect.value = AppState.currentLeaderboardId;
    }

    if (arenaSelect) {
      arenaSelect.innerHTML = `<option value="">Choose competition...</option>` + options;
      const activeSummary = summaries.find(s => s.competition.competitionStatus === 'ACTIVE') || summaries[0];
      if (activeSummary && !arenaSelect.value) {
        arenaSelect.value = activeSummary.competition.competitionId;
        onArenaCompetitionSelect(activeSummary.competition.competitionId);
      }
    }

    if (targetCompSelect) targetCompSelect.innerHTML = options;
    if (reviewCompSelect) {
      reviewCompSelect.innerHTML = options;
      if (summaries.length > 0) loadSubmissionsForReview(summaries[0].competition.competitionId);
    }
  }

  function updateSpotlightCard(summaries) {
    const active = summaries.find(s => s.competition.competitionStatus === 'ACTIVE') || summaries[0];
    if (!active) return;

    const c = active.competition;
    const titleEl = document.getElementById('spotlight-title');
    const descEl = document.getElementById('spotlight-desc');
    const typeEl = document.getElementById('spotlight-type');
    const challengesEl = document.getElementById('spotlight-challenges');
    const participantsEl = document.getElementById('spotlight-participants');

    if (titleEl) titleEl.textContent = c.competitionName;
    if (descEl) descEl.textContent = c.description || 'No description provided';
    if (typeEl) typeEl.textContent = c.competitionType;
    if (challengesEl) challengesEl.textContent = `${active.totalChallenges} Questions (${active.totalPoints} Pts)`;
    if (participantsEl) participantsEl.textContent = `${active.registeredParticipants} / ${c.maxParticipants} Enrolled`;

    AppState.spotlightCompId = c.competitionId;
  }

  function updateDashboardQuickCompetitions(summaries) {
    const container = document.getElementById('dashboard-quick-comps');
    if (!container) return;

    if (summaries.length === 0) {
      container.innerHTML = `<p class="p-4 text-xs font-hand text-stone-500">No scheduled events found.</p>`;
      return;
    }

    container.innerHTML = summaries.slice(0, 3).map(s => {
      const c = s.competition;
      const isLive = c.competitionStatus === 'ACTIVE';
      return `
        <div class="sketch-card p-4 bg-white border-2 border-ink flex items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-hand px-2 py-0.5 rounded-full border border-ink ${isLive ? 'bg-pastel-mint text-ink font-bold' : 'bg-stone-100 text-stone-600'}">
                ${c.competitionStatus}
              </span>
              <span class="text-xs text-stone-500 font-sans">${escapeHtml(c.competitionType)}</span>
            </div>
            <h4 class="font-hand text-xl font-bold text-ink mt-1">${escapeHtml(c.competitionName)}</h4>
            <p class="text-xs text-stone-600 font-sans mt-0.5">${s.totalChallenges} Challenges • ${s.registeredParticipants}/${c.maxParticipants} Students Enrolled</p>
          </div>
          <button onclick="window.app.jumpToArena(${c.competitionId})" class="sketch-btn px-4 py-1.5 bg-pastel-mint hover:bg-pastel-mintdark text-ink font-bold text-sm flex-shrink-0">
            Solve ➔
          </button>
        </div>
      `;
    }).join('');
  }

  function enterSpotlightContest() {
    if (AppState.spotlightCompId) {
      jumpToArena(AppState.spotlightCompId);
    } else {
      switchSection('arena');
    }
  }

  function viewSpotlightLeaderboard() {
    if (AppState.spotlightCompId) {
      const lbSelect = document.getElementById('leaderboard-competition-select');
      if (lbSelect) lbSelect.value = AppState.spotlightCompId;
      loadLeaderboard(AppState.spotlightCompId);
      switchSection('leaderboard');
    } else {
      switchSection('leaderboard');
    }
  }

  function filterCompetitions(filter) {
    AppState.currentFilter = filter;
    document.querySelectorAll('.comp-filter-btn').forEach(btn => {
      if (btn.dataset.filter === filter) {
        btn.className = 'comp-filter-btn sketch-btn px-4 py-2 bg-pastel-yellow font-bold text-sm shadow-sketch-sm';
      } else {
        btn.className = 'comp-filter-btn sketch-btn px-4 py-2 bg-white text-stone-700 text-sm';
      }
    });

    renderCompetitionsGrid(AppState.summaries);
  }

  function renderCompetitionsGrid(summaries) {
    const container = document.getElementById('competitions-grid');
    if (!container) return;

    const filtered = summaries.filter(s => {
      if (AppState.currentFilter === 'ALL') return true;
      return s.competition.competitionStatus === AppState.currentFilter;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full sketch-card p-12 text-center bg-white border-2 border-ink">
          <div class="font-hand text-3xl text-rose-600 mb-2">No Scheduled Events</div>
          <p class="text-sm font-hand text-stone-600">No events match the selected filter. Draft a new one in the Organizer Studio.</p>
        </div>
      `;
      return;
    }

    const washiColors = ['washi-tape-pink', 'washi-tape-mint', 'washi-tape-blue', ''];

    container.innerHTML = filtered.map((s, idx) => {
      const c = s.competition;
      const pct = Math.min(100, Math.round((s.registeredParticipants / c.maxParticipants) * 100));
      const washi = washiColors[idx % washiColors.length];

      let statusBadge = '';
      if (c.competitionStatus === 'ACTIVE') {
        statusBadge = '<span class="bg-pastel-mint border border-ink text-ink font-hand text-xs font-bold px-2.5 py-0.5 rounded-full">★ ACTIVE NOW</span>';
      } else if (c.competitionStatus === 'UPCOMING') {
        statusBadge = '<span class="bg-pastel-yellow border border-ink text-ink font-hand text-xs font-bold px-2.5 py-0.5 rounded-full">⏳ UPCOMING</span>';
      } else {
        statusBadge = '<span class="bg-stone-200 border border-ink text-stone-700 font-hand text-xs font-bold px-2.5 py-0.5 rounded-full">🏁 CONCLUDED</span>';
      }

      return `
        <div class="sketch-card p-6 bg-white border-2 border-ink flex flex-col justify-between relative">
          <div class="washi-tape ${washi}"></div>

          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-xs font-hand font-bold text-stone-700 uppercase tracking-wide border border-ink px-2 py-0.5 rounded bg-pastel-yellow">
                ${escapeHtml(c.competitionType)}
              </span>
              ${statusBadge}
            </div>

            <h3 class="font-hand text-2xl font-bold text-ink mb-1.5 leading-snug">
              ${escapeHtml(c.competitionName)}
            </h3>

            <p class="text-xs text-stone-600 mb-4 line-clamp-2 leading-relaxed font-sans">
              ${escapeHtml(c.description || 'No description provided')}
            </p>

            <!-- Metadata Box -->
            <div class="space-y-1.5 bg-[#FFFDF9] border-2 border-dashed border-stone-300 p-3 rounded-xl mb-4 text-xs font-sans">
              <div class="flex justify-between">
                <span class="text-stone-500 font-hand text-sm">Starts:</span>
                <span class="font-medium text-ink">${formatDateTime(c.startTime)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-stone-500 font-hand text-sm">Ends:</span>
                <span class="font-medium text-ink">${formatDateTime(c.endTime)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-stone-500 font-hand text-sm">Challenge Tasks:</span>
                <span class="font-bold text-rose-600 font-hand text-sm">${s.totalChallenges} Questions (${s.totalPoints} Pts)</span>
              </div>
            </div>

            <!-- Participant Capacity Meter -->
            <div class="mb-4">
              <div class="flex justify-between text-xs font-hand mb-1">
                <span class="text-stone-600">Class Enrollment</span>
                <span class="${s.isFull ? 'text-rose-600 font-bold' : 'text-ink font-bold'}">
                  ${s.registeredParticipants} / ${c.maxParticipants} (${pct}%)
                </span>
              </div>
              <div class="w-full bg-stone-100 h-3 rounded-full overflow-hidden border-2 border-ink">
                <div class="h-full ${s.isFull ? 'bg-rose-400' : 'bg-pastel-mintdark'}" style="width: ${pct}%"></div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center gap-2 pt-3 border-t-2 border-dashed border-stone-200">
            ${c.competitionStatus === 'ACTIVE' ? `
              <button onclick="window.app.jumpToArena(${c.competitionId})" class="sketch-btn flex-1 py-2 px-3 bg-pastel-mint hover:bg-pastel-mintdark text-ink font-bold text-sm text-center">
                ✏️ Solve Arena
              </button>
            ` : ''}

            ${s.isRegistrationOpen ? `
              <button onclick="window.app.openRegistrationModal(${c.competitionId})" class="sketch-btn py-2 px-3 bg-pastel-pink hover:bg-pastel-pinkdark text-ink font-bold text-sm">
                + Sign Up
              </button>
            ` : `
              <span class="text-xs font-hand text-stone-500 italic py-1">
                ${s.isFull ? 'Class Full' : 'Registration Closed'}
              </span>
            `}

            <button onclick="window.app.loadLeaderboard(${c.competitionId}); window.app.switchSection('leaderboard');" class="sketch-btn py-2 px-3 bg-pastel-yellow hover:bg-pastel-yellowdark text-ink font-bold text-sm" title="View Standings">
              🏆 Standings
            </button>
          </div>

          <!-- Admin Lifecycle Override Controls -->
          ${AppState.currentRole === 'ADMIN' ? `
            <div class="mt-3 pt-2.5 border-t-2 border-dashed border-stone-300 bg-pastel-yellow/30 p-2.5 rounded-xl">
              <div class="text-[10px] font-hand font-bold text-stone-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span class="flex items-center gap-1 font-bold text-ink">🛡️ Admin Lifecycle Override</span>
                <span class="font-mono text-[10px] text-stone-500 font-bold">ID #${c.competitionId}</span>
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                ${c.competitionStatus !== 'ACTIVE' ? `
                  <button onclick="window.app.updateCompetitionStatus(${c.competitionId}, 'ACTIVE')" class="sketch-btn px-2.5 py-1 bg-pastel-mint hover:bg-pastel-mintdark text-ink font-bold text-xs" title="Make Competition Live Now">
                    ▶ Set Active
                  </button>
                ` : ''}
                ${c.competitionStatus !== 'COMPLETED' ? `
                  <button onclick="window.app.updateCompetitionStatus(${c.competitionId}, 'COMPLETED')" class="sketch-btn px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs" title="Conclude Competition">
                    ⏹ Conclude
                  </button>
                ` : ''}
                ${c.competitionStatus !== 'UPCOMING' ? `
                  <button onclick="window.app.updateCompetitionStatus(${c.competitionId}, 'UPCOMING')" class="sketch-btn px-2.5 py-1 bg-pastel-yellow hover:bg-pastel-yellowdark text-ink font-bold text-xs" title="Revert to Upcoming">
                    ⏳ Set Upcoming
                  </button>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  // Registration Modal
  function openRegistrationModal(competitionId) {
    AppState.selectedRegCompId = competitionId;
    const comp = AppState.competitions.find(c => c.competitionId === competitionId);
    if (!comp) return;

    document.getElementById('modal-comp-name').textContent = comp.competitionName;
    document.getElementById('modal-comp-meta').textContent = `${comp.competitionType} • Closes: ${formatDateTime(comp.endTime)}`;

    const modal = document.getElementById('registration-modal');
    modal.classList.remove('hidden');
  }

  function closeRegistrationModal() {
    document.getElementById('registration-modal').classList.add('hidden');
    AppState.selectedRegCompId = null;
  }

  async function confirmRegistration() {
    const studentSelect = document.getElementById('modal-student-select');
    const studentId = studentSelect ? studentSelect.value : null;
    const compId = AppState.selectedRegCompId;

    if (!studentId || !compId) {
      showToast('Selection Missing', 'Please select a student from the dropdown.', true);
      return;
    }

    const res = await api('/registrations', {
      method: 'POST',
      body: JSON.stringify({
        competitionId: compId,
        studentId: parseInt(studentId)
      })
    });

    if (res.success) {
      showToast('Enrolled! 📝', `Student added to contest roster.`);
      closeRegistrationModal();
      await loadCompetitions();
      await loadSystemStats();
    } else {
      showToast('Enrollment Error', res.message || 'Error completing sign-up', true);
    }
  }

  // Leaderboard Logic
  async function loadLeaderboard(competitionId) {
    AppState.isGlobalLeaderboard = false;
    AppState.currentLeaderboardId = parseInt(competitionId);

    const compSelect = document.getElementById('leaderboard-competition-select');
    if (compSelect) compSelect.value = competitionId;

    const globalBtn = document.getElementById('btn-global-standings');
    if (globalBtn) globalBtn.className = 'sketch-btn px-4 py-2 bg-white text-ink text-sm font-bold flex items-center gap-2';

    const comp = AppState.competitions.find(c => c.competitionId == competitionId);
    const res = await api(`/leaderboard/competition/${competitionId}`);
    if (res.success && res.data) {
      renderLeaderboard(res.data, comp);
    }
  }

  async function toggleGlobalLeaderboard() {
    AppState.isGlobalLeaderboard = true;
    const globalBtn = document.getElementById('btn-global-standings');
    if (globalBtn) globalBtn.className = 'sketch-btn px-4 py-2 bg-pastel-yellow text-ink font-bold text-sm flex items-center gap-2 shadow-sketch-sm';

    const res = await api('/leaderboard/global');
    if (res.success && res.data) {
      renderLeaderboard(res.data, { competitionName: 'Global Campus Honor Roll' });
    }
  }

  function refreshCurrentLeaderboard(notify = true) {
    if (AppState.isGlobalLeaderboard) {
      toggleGlobalLeaderboard();
    } else if (AppState.currentLeaderboardId) {
      loadLeaderboard(AppState.currentLeaderboardId);
    }
    if (notify) showToast('Scores Updated', 'Latest grades loaded from MySQL');
  }

  function renderLeaderboard(entries, competition) {
    const tableTitle = document.getElementById('leaderboard-table-title');
    const countBadge = document.getElementById('leaderboard-count');
    const podiumContainer = document.getElementById('podium-container');
    const tbody = document.getElementById('leaderboard-tbody');

    if (tableTitle && competition) {
      tableTitle.textContent = `${competition.competitionName} • Goal Tracker`;
    }
    if (countBadge) countBadge.textContent = `${entries.length} Ranked`;

    // Render Sketched Top 3 Podium
    if (podiumContainer) {
      if (entries.length === 0) {
        podiumContainer.innerHTML = `
          <div class="col-span-full sketch-card p-8 text-center bg-white border-2 border-ink">
            <span class="font-hand text-2xl text-rose-600 font-bold block mb-1">NO SCORES RECORDED YET</span>
            <p class="text-sm font-hand text-stone-600">Solve assignments in the Solve Arena to claim top podium honors!</p>
          </div>
        `;
      } else {
        const top3 = entries.slice(0, 3);
        const rankThemes = [
          { bg: 'bg-pastel-yellow', medal: '🥇 GOLD MEDAL • 1ST PLACE' },
          { bg: 'bg-pastel-lavender', medal: '🥈 SILVER RIBBON • 2ND PLACE' },
          { bg: 'bg-pastel-pink', medal: '🥉 BRONZE STAR • 3RD PLACE' }
        ];

        podiumContainer.innerHTML = top3.map((e, idx) => `
          <div class="sketch-card p-6 ${rankThemes[idx].bg} border-2 border-ink relative">
            <div class="flex items-center justify-between mb-2">
              <span class="font-hand font-bold text-xs uppercase px-2.5 py-0.5 rounded-full border border-ink bg-white">
                ${rankThemes[idx].medal}
              </span>
              <span class="font-hand text-3xl font-bold text-ink">
                #0${e.rank}
              </span>
            </div>

            <div class="font-hand text-3xl font-bold text-ink truncate mb-1">
              ${escapeHtml(e.studentName)}
            </div>
            <div class="text-xs text-stone-700 font-sans mb-4 truncate">
              ${escapeHtml(e.department)} • Year ${e.yearOfStudy}
            </div>

            <div class="flex items-center justify-between border-t-2 border-dashed border-stone-300 pt-3">
              <div>
                <span class="text-xs font-hand text-stone-600 block">Total Marks</span>
                <span class="font-hand text-4xl font-bold text-ink">${e.totalScore} <span class="text-xs font-sans text-stone-600">PTS</span></span>
              </div>
              <div class="text-right">
                <span class="text-xs font-hand text-stone-600 block">Completed</span>
                <span class="font-hand font-bold text-base text-rose-600">${e.challengesSolved} Solved</span>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // Render Rankings Table
    if (tbody) {
      if (entries.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-8 text-stone-500 font-hand text-base">
              No registered students have submitted answers for this contest yet.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = entries.map(e => `
        <tr class="hover:bg-pastel-mint/30 transition-colors">
          <td class="py-3 px-4 font-hand text-lg font-bold text-ink">
            #${e.rank}
            ${e.rank === 1 ? '🥇' : (e.rank === 2 ? '🥈' : (e.rank === 3 ? '🥉' : ''))}
          </td>
          <td class="py-3 px-4">
            <div class="font-hand font-bold text-base text-ink">${escapeHtml(e.studentName)}</div>
            <div class="text-xs text-stone-500 font-sans">${escapeHtml(e.email)}</div>
          </td>
          <td class="py-3 px-4 text-xs font-sans">
            <span class="font-bold text-stone-700">${escapeHtml(e.department)}</span>
            <span class="text-stone-500 block font-hand text-sm">Year ${e.yearOfStudy}</span>
          </td>
          <td class="py-3 px-4 text-center font-hand font-bold text-base">
            <span class="bg-pastel-yellow border border-ink px-2.5 py-0.5 rounded-full">
              ${e.challengesSolved}
            </span>
          </td>
          <td class="py-3 px-4 text-right font-hand text-2xl font-bold text-ink">
            ${e.totalScore}
          </td>
          <td class="py-3 px-4 text-right text-xs text-stone-600 font-sans">
            ${e.lastSubmissionTime ? formatDateTime(e.lastSubmissionTime) : '—'}
          </td>
        </tr>
      `).join('');
    }
  }

  // Solve Arena Logic
  async function onArenaCompetitionSelect(competitionId) {
    if (!competitionId) return;
    AppState.currentArenaCompId = parseInt(competitionId);

    const challengeSelect = document.getElementById('arena-challenge-select');
    const challengeCard = document.getElementById('arena-challenge-card');
    if (challengeCard) challengeCard.classList.add('hidden');

    const res = await api(`/challenges/competition/${competitionId}`);
    if (res.success && res.data) {
      AppState.arenaChallenges = res.data;
      if (res.data.length === 0) {
        challengeSelect.innerHTML = `<option value="">No assignments in this contest yet</option>`;
      } else {
        challengeSelect.innerHTML = `<option value="">-- Choose Challenge Task --</option>` + res.data.map(ch => `
          <option value="${ch.challengeId}">[${ch.points} Pts] ${escapeHtml(ch.challengeTitle)}</option>
        `).join('');

        challengeSelect.value = res.data[0].challengeId;
        onArenaChallengeSelect(res.data[0].challengeId);
      }
    }

    loadStudentSubmissionsInArena();
  }

  function onArenaChallengeSelect(challengeId) {
    if (!challengeId || !AppState.arenaChallenges) return;
    const ch = AppState.arenaChallenges.find(c => c.challengeId == challengeId);
    if (!ch) return;

    const card = document.getElementById('arena-challenge-card');
    const badge = document.getElementById('arena-card-badge');
    const title = document.getElementById('arena-card-title');
    const desc = document.getElementById('arena-card-desc');

    if (badge) badge.textContent = `${ch.points} Points`;
    if (title) title.textContent = ch.challengeTitle;
    if (desc) desc.textContent = ch.questionDescription;
    if (card) card.classList.remove('hidden');
  }

  async function loadStudentSubmissionsInArena() {
    const studentSelect = document.getElementById('arena-student-select');
    const studentId = studentSelect && studentSelect.value ? studentSelect.value : AppState.activeStudentId;
    const compId = AppState.currentArenaCompId;

    const container = document.getElementById('student-recent-submissions');
    if (!container || !studentId || !compId) return;

    const res = await api(`/submissions/student/${studentId}/competition/${compId}`);
    if (res.success && res.data && res.data.length > 0) {
      container.innerHTML = res.data.slice(0, 5).map(sub => `
        <div class="p-2.5 rounded-xl border-2 border-stone-300 bg-[#FFFDF9] flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="sketch-check ${sub.score > 0 ? 'bg-pastel-mint border-emerald-700' : 'bg-pastel-pink border-rose-700'}">
              ${sub.score > 0 ? '✓' : '✕'}
            </span>
            <div>
              <span class="font-hand font-bold text-sm text-ink">${escapeHtml(sub.challengeTitle || 'Challenge')}</span>
              <span class="text-stone-500 block font-mono text-[11px] truncate max-w-xs">Ans: "${escapeHtml(sub.submittedAnswer)}"</span>
            </div>
          </div>
          <div class="text-right">
            <span class="font-hand font-bold text-sm ${sub.score > 0 ? 'text-emerald-700' : 'text-rose-600'}">
              ${sub.score} / ${sub.maxPoints || 0} Pts
            </span>
            <span class="text-[10px] text-stone-500 block font-sans">${formatDateTime(sub.submissionTime)}</span>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `<p class="text-xs text-stone-500 italic py-2 font-hand">No submissions by this student for this contest yet.</p>`;
    }
  }

  async function handleAnswerSubmit(event) {
    event.preventDefault();

    // Faculty restriction check
    if (AppState.currentRole === 'TEACHER') {
      showToast('Faculty Area Restricted 👨‍🏫', 'Problem submission in Solve Arena is reserved for students. Head to Organizer Studio to grade papers.', true);
      const resultBox = document.getElementById('submission-result');
      if (resultBox) {
        resultBox.classList.remove('hidden');
        resultBox.innerHTML = `
          <div class="p-4 rounded-xl border-2 border-stone-800 bg-pastel-lavender text-ink text-xs">
            <div class="font-hand font-bold flex items-center gap-2 text-base text-purple-950">
              <span>👨‍🏫</span> TEACHER MODE: SUBMISSIONS RESERVED FOR STUDENTS
            </div>
            <div class="mt-1 font-sans text-stone-700">Teachers draft challenges and review submissions. Switch to <strong>Student Mode</strong> via the role menu if you wish to solve questions.</div>
          </div>
        `;
      }
      return;
    }

    const compSelect = document.getElementById('arena-competition-select');
    const chSelect = document.getElementById('arena-challenge-select');
    const stSelect = document.getElementById('arena-student-select');
    const answerInput = document.getElementById('submit-answer-text');
    const resultBox = document.getElementById('submission-result');

    const compId = compSelect ? compSelect.value : null;
    const chId = chSelect ? chSelect.value : null;
    const stId = stSelect && stSelect.value ? stSelect.value : AppState.activeStudentId;
    const answer = answerInput ? answerInput.value.trim() : '';

    if (!compId || !chId || !stId || !answer) {
      showToast('Incomplete Form', 'Please choose competition, challenge, student, and write an answer.', true);
      return;
    }

    const btn = document.getElementById('btn-submit-answer');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳</span> Grading Solution...`;
    }

    const res = await api('/submissions', {
      method: 'POST',
      body: JSON.stringify({
        challengeId: parseInt(chId),
        studentId: parseInt(stId),
        submittedAnswer: answer
      })
    });

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>✏️</span> Submit & Check Grade`;
    }

    if (resultBox) resultBox.classList.remove('hidden');

    if (res.success && res.data) {
      const sub = res.data;
      const isCorrect = sub.score > 0;

      if (isCorrect) {
        showToast('CORRECT ANSWER! 🎉', `+${sub.score} Points awarded.`);
        if (resultBox) {
          resultBox.innerHTML = `
            <div class="p-4 rounded-xl border-2 border-emerald-700 bg-pastel-mint text-emerald-900 text-xs">
              <div class="font-hand font-bold flex items-center gap-2 text-base text-emerald-950">
                <span>✅</span> CORRECT ANSWER! FULL MARKS AWARDED
              </div>
              <div class="mt-1 font-hand text-sm">Awarded: <strong>+${sub.score} Points</strong> • Status: <strong>${sub.evaluationStatus}</strong></div>
              <div class="text-[11px] text-emerald-800 mt-2 font-mono">Live leaderboard score updated in MySQL.</div>
            </div>
          `;
        }
      } else {
        showToast('NEEDS REVISION', '0 marks awarded. Try again!', true);
        if (resultBox) {
          resultBox.innerHTML = `
            <div class="p-4 rounded-xl border-2 border-rose-500 bg-pastel-pink text-rose-950 text-xs">
              <div class="font-hand font-bold flex items-center gap-2 text-base text-rose-900">
                <span>❌</span> INCORRECT ANSWER
              </div>
              <div class="mt-1 font-hand text-sm">Score: <strong>0 Points</strong> • Status: <strong>${sub.evaluationStatus}</strong></div>
              <div class="text-[11px] text-rose-800 mt-2 font-mono">The answer did not match the expected answer key.</div>
            </div>
          `;
        }
      }

      await loadSystemStats();
      loadStudentSubmissionsInArena();
      if (AppState.currentLeaderboardId == compId) {
        loadLeaderboard(compId);
      }
    } else {
      showToast('Validation Error', res.message || 'Error processing submission', true);
      if (resultBox) {
        resultBox.innerHTML = `
          <div class="p-4 rounded-xl border-2 border-rose-500 bg-pastel-pink text-rose-900 text-xs">
            <div class="font-hand font-bold flex items-center gap-2 text-base">
              <span>⛔</span> SUBMISSION NOT ACCEPTED
            </div>
            <div class="mt-1 font-semibold">${escapeHtml(res.message || 'Validation failed')}</div>
            <div class="text-[11px] text-rose-800 mt-2 font-sans">Make sure the student is enrolled and the competition is currently ACTIVE.</div>
          </div>
        `;
      }
    }
  }

  function clearSubmissionForm() {
    const input = document.getElementById('submit-answer-text');
    const resultBox = document.getElementById('submission-result');
    if (input) input.value = '';
    if (resultBox) resultBox.classList.add('hidden');
  }

  function jumpToArena(competitionId) {
    const select = document.getElementById('arena-competition-select');
    if (select) {
      select.value = competitionId;
      onArenaCompetitionSelect(competitionId);
    }
    switchSection('arena');
  }

  // Student Registration Form
  async function handleStudentRegister(event) {
    event.preventDefault();
    const name = document.getElementById('reg-student-name').value.trim();
    const email = document.getElementById('reg-student-email').value.trim();
    const dept = document.getElementById('reg-student-dept').value;
    const year = parseInt(document.getElementById('reg-student-year').value);

    const res = await api('/students', {
      method: 'POST',
      body: JSON.stringify({
        studentName: name,
        email: email,
        department: dept,
        yearOfStudy: year
      })
    });

    if (res.success && res.data) {
      showToast('Student Added!', `Welcome ${res.data.studentName} (#${res.data.studentId})`);
      document.getElementById('student-register-form').reset();
      AppState.activeStudentId = res.data.studentId;
      await loadStudents();
      await loadSystemStats();
    } else {
      showToast('Registration Error', res.message || 'Failed to add student', true);
    }
  }

  // Organizer Console Tabs
  function switchOrganizerTab(tabName) {
    AppState.activeOrganizerTab = tabName;
    ['create-comp', 'add-challenge', 'review-submissions'].forEach(t => {
      const panel = document.getElementById(`tab-${t}`);
      const btn = document.getElementById(`tab-btn-${t}`);
      if (t === tabName) {
        if (panel) panel.classList.remove('hidden');
        if (btn) btn.className = 'sketch-btn px-4 py-2 bg-pastel-yellow text-ink font-bold text-sm shadow-sketch-sm';
      } else {
        if (panel) panel.classList.add('hidden');
        if (btn) btn.className = 'sketch-btn px-4 py-2 bg-white text-stone-700 text-sm';
      }
    });
  }

  // Handle Create Competition
  async function handleCreateCompetition(event) {
    event.preventDefault();

    if (AppState.currentRole === 'STUDENT') {
      showToast('Faculty Permission Required', 'Creating competitions is reserved for Teachers & Admins. Switch role to proceed.', true);
      return;
    }

    const name = document.getElementById('new-comp-name').value.trim();
    const type = document.getElementById('new-comp-type').value;
    const desc = document.getElementById('new-comp-desc').value.trim();
    const start = document.getElementById('new-comp-start').value;
    const end = document.getElementById('new-comp-end').value;
    const max = parseInt(document.getElementById('new-comp-max').value);

    const res = await api('/competitions', {
      method: 'POST',
      body: JSON.stringify({
        competitionName: name,
        competitionType: type,
        description: desc,
        startTime: start,
        endTime: end,
        maxParticipants: max
      })
    });

    if (res.success && res.data) {
      showToast('Contest Published!', `Created ${res.data.competitionName}`);
      event.target.reset();
      setupDefaultDates();
      await loadCompetitions();
      await loadSystemStats();
      switchOrganizerTab('add-challenge');
    } else {
      showToast('Creation Failed', res.message || 'Error creating competition', true);
    }
  }

  // Handle Add Challenge
  async function handleAddChallenge(event) {
    event.preventDefault();

    if (AppState.currentRole === 'STUDENT') {
      showToast('Faculty Permission Required', 'Attaching challenges is reserved for Teachers & Admins. Switch role to proceed.', true);
      return;
    }

    const compId = parseInt(document.getElementById('challenge-target-comp').value);
    const title = document.getElementById('new-ch-title').value.trim();
    const desc = document.getElementById('new-ch-desc').value.trim();
    const points = parseInt(document.getElementById('new-ch-points').value);
    const answer = document.getElementById('new-ch-answer').value.trim();

    const res = await api('/challenges', {
      method: 'POST',
      body: JSON.stringify({
        competitionId: compId,
        challengeTitle: title,
        questionDescription: desc,
        points: points,
        correctAnswer: answer
      })
    });

    if (res.success && res.data) {
      showToast('Challenge Pinned!', `"${res.data.challengeTitle}" (${res.data.points} Pts) added.`);
      document.getElementById('new-ch-title').value = '';
      document.getElementById('new-ch-desc').value = '';
      document.getElementById('new-ch-answer').value = '';
      await loadCompetitions();
      await loadSystemStats();
    } else {
      showToast('Error Adding Challenge', res.message || 'Could not attach challenge', true);
    }
  }

  // Organizer Submissions Review
  async function loadSubmissionsForReview(competitionId) {
    const tbody = document.getElementById('review-submissions-tbody');
    if (!tbody || !competitionId) return;

    tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center font-hand text-base text-stone-500">Loading exam papers...</td></tr>`;

    const res = await api(`/submissions/competition/${competitionId}`);
    if (res.success && res.data) {
      if (res.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center font-hand text-base text-stone-500">No student answers turned in for this contest yet.</td></tr>`;
        return;
      }

      tbody.innerHTML = res.data.map(sub => `
        <tr class="hover:bg-stone-50 transition-colors">
          <td class="py-3 px-4 font-hand font-bold text-base text-ink">#${sub.submissionId}</td>
          <td class="py-3 px-4 font-bold text-ink">${escapeHtml(sub.studentName || 'Student #' + sub.studentId)}</td>
          <td class="py-3 px-4 font-hand text-sm text-stone-700">${escapeHtml(sub.challengeTitle || 'Challenge #' + sub.challengeId)}</td>
          <td class="py-3 px-4 font-mono text-[11px] text-stone-600 max-w-xs truncate">${escapeHtml(sub.submittedAnswer)}</td>
          <td class="py-3 px-4 font-hand text-base font-bold ${sub.score > 0 ? 'text-emerald-700' : 'text-rose-600'}">
            ${sub.score} / ${sub.maxPoints || 0}
          </td>
          <td class="py-3 px-4">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-hand font-bold border border-ink ${sub.evaluationStatus === 'EVALUATED' ? 'bg-pastel-mint text-emerald-950' : 'bg-pastel-yellow text-amber-950'}">
              ${sub.evaluationStatus}
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <button onclick="window.app.openGradingModal(${sub.submissionId}, ${sub.score}, '${sub.evaluationStatus}')" class="sketch-btn px-3 py-1 bg-white hover:bg-pastel-mint text-ink text-xs font-bold">
              Grade ✎
            </button>
          </td>
        </tr>
      `).join('');
    }
  }

  function openGradingModal(subId, score, status) {
    document.getElementById('grade-sub-id').value = subId;
    document.getElementById('grade-sub-score').value = score;
    document.getElementById('grade-sub-status').value = status;
    document.getElementById('grading-modal').classList.remove('hidden');
  }

  function closeGradingModal() {
    document.getElementById('grading-modal').classList.add('hidden');
  }

  async function saveGrading() {
    const subId = document.getElementById('grade-sub-id').value;
    const score = parseInt(document.getElementById('grade-sub-score').value);
    const status = document.getElementById('grade-sub-status').value;

    const res = await api(`/submissions/${subId}/evaluate`, {
      method: 'POST',
      body: JSON.stringify({ score, status })
    });

    if (res.success) {
      showToast('Grade Saved', `Submission #${subId} marks updated.`);
      closeGradingModal();
      const reviewCompSelect = document.getElementById('review-comp-select');
      if (reviewCompSelect) loadSubmissionsForReview(reviewCompSelect.value);
      if (AppState.currentLeaderboardId) loadLeaderboard(AppState.currentLeaderboardId);
    } else {
      showToast('Grading Error', res.message || 'Failed to update score', true);
    }
  }

  // Memory Scrapbook & History
  async function loadHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;

    const res = await api('/history');
    if (res.success && res.data) {
      if (res.data.length === 0) {
        container.innerHTML = `
          <div class="sketch-card p-8 text-center bg-white border-2 border-ink">
            <div class="font-hand text-2xl text-rose-600 font-bold mb-1">NO PAST SEASONS RECORDED YET</div>
            <p class="text-xs text-stone-600 font-sans">When competitions reach completion, their final award podiums appear here in the scrapbook.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = res.data.map(h => {
        const c = h.competition;
        const winner = h.winner;
        const runnerUp = h.runnerUp;
        const thirdPlace = h.thirdPlace;

        return `
          <div class="sketch-card p-6 sm:p-8 bg-white border-2 border-ink relative">
            <div class="washi-tape washi-tape-blue"></div>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-dashed border-stone-300 pb-4 mb-6">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="bg-stone-200 text-stone-800 font-hand text-xs font-bold px-2 py-0.5 rounded-full border border-ink">
                    PAST SEASON
                  </span>
                  <span class="text-xs font-hand text-rose-600 font-bold">
                    ${escapeHtml(c.competitionType)}
                  </span>
                </div>
                <h3 class="font-hand text-3xl font-bold text-ink">
                  ${escapeHtml(c.competitionName)}
                </h3>
                <p class="text-xs text-stone-600 font-sans mt-0.5">
                  Concluded: ${formatDateTime(c.endTime)} • ${h.totalParticipants} Participants • ${h.totalSubmissions} Solutions Turned In
                </p>
              </div>

              <div>
                <button onclick="window.app.loadLeaderboard(${c.competitionId}); window.app.switchSection('leaderboard');" class="sketch-btn px-4 py-2 bg-pastel-yellow hover:bg-pastel-yellowdark text-ink font-bold text-sm">
                  View Full Standings 🏆
                </button>
              </div>
            </div>

            <!-- Scrapbook Podium Display -->
            <div class="grid sm:grid-cols-3 gap-4">
              <!-- Winner Gold -->
              <div class="sketch-box p-4 bg-pastel-yellow border-2 border-ink">
                <div class="font-hand font-bold text-xs uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1">
                  <span>🥇</span> GOLD MEDAL CHAMPION
                </div>
                <div class="font-hand text-2xl font-bold text-ink truncate">
                  ${winner ? escapeHtml(winner.studentName) : 'No Submissions'}
                </div>
                <div class="text-xs text-stone-700 font-sans mt-0.5">
                  ${winner ? `${escapeHtml(winner.department)} • ${winner.totalScore} Pts` : '—'}
                </div>
              </div>

              <!-- Runner up Silver -->
              <div class="sketch-box p-4 bg-pastel-lavender border-2 border-ink">
                <div class="font-hand font-bold text-xs uppercase tracking-wider text-purple-900 mb-1 flex items-center gap-1">
                  <span>🥈</span> SILVER RIBBON RUNNER-UP
                </div>
                <div class="font-hand text-2xl font-bold text-ink truncate">
                  ${runnerUp ? escapeHtml(runnerUp.studentName) : '—'}
                </div>
                <div class="text-xs text-stone-700 font-sans mt-0.5">
                  ${runnerUp ? `${escapeHtml(runnerUp.department)} • ${runnerUp.totalScore} Pts` : '—'}
                </div>
              </div>

              <!-- Third place Bronze -->
              <div class="sketch-box p-4 bg-pastel-pink border-2 border-ink">
                <div class="font-hand font-bold text-xs uppercase tracking-wider text-rose-900 mb-1 flex items-center gap-1">
                  <span>🥉</span> BRONZE STAR THIRD PLACE
                </div>
                <div class="font-hand text-2xl font-bold text-ink truncate">
                  ${thirdPlace ? escapeHtml(thirdPlace.studentName) : '—'}
                </div>
                <div class="text-xs text-stone-700 font-sans mt-0.5">
                  ${thirdPlace ? `${escapeHtml(thirdPlace.department)} • ${thirdPlace.totalScore} Pts` : '—'}
                </div>
              </div>
            </div>

          </div>
        `;
      }).join('');
    }
  }

  // Database Reset and Seed
  async function resetAndSeedData() {
    showToast('Re-Sketching Planner...', 'Restoring sample records in MySQL.');
    const res = await api('/system/reset-seed', { method: 'POST' });
    if (res.success) {
      showToast('Notebook Re-Seeded! ✏️', 'Fresh students, contests, and assignments restored.');
      await init();
    } else {
      showToast('Reset Failed', res.message || 'Error re-seeding database', true);
    }
  }

  // Utilities
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/&/g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDateTime(isoString) {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  // Export functions to window.app for HTML callbacks
  window.app = {
    init,
    switchSection,
    toggleMobileSidebar,
    loadSystemStats,
    loadStudents,
    loadCompetitions,
    loadLeaderboard,
    toggleGlobalLeaderboard,
    refreshCurrentLeaderboard,
    filterCompetitions,
    openRegistrationModal,
    closeRegistrationModal,
    confirmRegistration,
    onActiveStudentChange,
    onArenaCompetitionSelect,
    onArenaChallengeSelect,
    handleAnswerSubmit,
    clearSubmissionForm,
    jumpToArena,
    enterSpotlightContest,
    viewSpotlightLeaderboard,
    handleStudentRegister,
    switchOrganizerTab,
    handleCreateCompetition,
    handleAddChallenge,
    loadSubmissionsForReview,
    openGradingModal,
    closeGradingModal,
    saveGrading,
    resetAndSeedData,
    openLoginModal,
    closeLoginModal,
    selectLoginRole,
    confirmRoleLogin,
    applyRolePermissions,
    updateCompetitionStatus,
  };

  // Launch on DOM ready
  document.addEventListener('DOMContentLoaded', init);

})();
