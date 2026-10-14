/**
 * Campus Challenge Arena - Modern Dashboard Controller
 * Sectioned Views • Dynamic Leaderboard • MySQL JDBC Integration
 */

(function () {
  'use strict';

  const AppState = {
    currentSection: 'dashboard',
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

  // Section Configuration for Titles and Subtitles
  const SECTIONS_META = {
    dashboard: {
      title: 'Dashboard Overview',
      subtitle: 'Campus Competition Platform • Live Telemetry & Actions'
    },
    arena: {
      title: 'Solve Arena',
      subtitle: 'Interactive Problem Solver • Instant MySQL Answer Validation'
    },
    leaderboard: {
      title: 'Live Leaderboards',
      subtitle: 'Real-time Competition Rankings & Global Hall of Fame'
    },
    competitions: {
      title: 'Tournament Directory',
      subtitle: 'Browse, Filter, and Register for College Events'
    },
    students: {
      title: 'Student Portal',
      subtitle: 'Enrolled Participants Roster & Account Registration'
    },
    organizer: {
      title: 'Organizer Command Center',
      subtitle: 'Tournament Authoring, Challenge Builder & Submission Grading'
    },
    history: {
      title: 'Tournament History & Archives',
      subtitle: 'Completed Contests, Champions Hall of Fame & Statistics'
    }
  };

  // Toast Helper
  function showToast(title, message, isError = false) {
    const toast = document.getElementById('toast');
    const toastCard = document.getElementById('toast-card');
    const toastTitle = document.getElementById('toast-title');
    const toastMsg = document.getElementById('toast-msg');
    const toastIcon = document.getElementById('toast-icon');
    const toastIconWrap = document.getElementById('toast-icon-wrap');

    if (!toast) return;

    toastTitle.textContent = title;
    toastMsg.textContent = message;
    toastIcon.textContent = isError ? '⚠️' : '⚡';

    if (isError) {
      if (toastCard) toastCard.className = 'glass-panel border border-red-500/50 p-4 rounded-xl shadow-2xl flex items-center gap-3.5 max-w-md bg-dark-900/95 text-white';
      if (toastIconWrap) toastIconWrap.className = 'w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xl flex-shrink-0';
    } else {
      if (toastCard) toastCard.className = 'glass-panel border border-brand-500/50 p-4 rounded-xl shadow-2xl flex items-center gap-3.5 max-w-md bg-dark-900/95 text-white';
      if (toastIconWrap) toastIconWrap.className = 'w-10 h-10 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xl flex-shrink-0';
    }

    toast.classList.remove('-translate-y-24', 'opacity-0', 'pointer-events-none');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('-translate-y-24', 'opacity-0', 'pointer-events-none');
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

  // Section Switching Logic
  function switchSection(sectionId, updateHash = true) {
    if (!SECTIONS_META[sectionId]) {
      sectionId = 'dashboard';
    }

    AppState.currentSection = sectionId;

    // 1. Hide all views and show target view
    document.querySelectorAll('.dashboard-view').forEach(view => {
      view.classList.remove('active');
    });
    const targetView = document.getElementById(`view-${sectionId}`);
    if (targetView) {
      targetView.classList.add('active');
    }

    // 2. Update navigation button styles
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.className = 'nav-item w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent';
    });
    const activeNavBtn = document.getElementById(`nav-btn-${sectionId}`);
    if (activeNavBtn) {
      activeNavBtn.className = 'nav-item w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-white bg-brand-500/15 border border-brand-500/30 shadow-sm';
    }

    // 3. Update top header text
    const titleEl = document.getElementById('topbar-section-title');
    const subtitleEl = document.getElementById('topbar-section-subtitle');
    if (titleEl) titleEl.textContent = SECTIONS_META[sectionId].title;
    if (subtitleEl) subtitleEl.textContent = SECTIONS_META[sectionId].subtitle;

    // 4. Update window hash if requested
    if (updateHash) {
      history.replaceState(null, null, `#${sectionId}`);
    }

    // Close mobile sidebar if open
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
      sidebar.classList.remove('mobile-open');
    }

    // Scroll to top of main container
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  }

  function toggleMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('hidden');
    }
  }

  // Handle URL hash changes
  function handleHashRoute() {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && SECTIONS_META[hash]) {
      switchSection(hash, false);
    } else {
      switchSection('dashboard', false);
    }
  }

  // Initial Load
  async function init() {
    await loadSystemStats();
    await loadStudents();
    await loadCompetitions();
    await loadHistory();
    setupDefaultDates();

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
      container.innerHTML = `<p class="p-6 text-xs text-slate-500 text-center">No students registered yet. Fill out the form to register your first student.</p>`;
      return;
    }

    container.innerHTML = students.map(s => `
      <div class="py-3 px-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 rounded-xl transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center font-display text-sm font-bold text-indigo-400">
            #${s.studentId}
          </div>
          <div>
            <div class="font-semibold text-xs text-white flex items-center gap-2">
              ${escapeHtml(s.studentName)}
              ${AppState.activeStudentId == s.studentId ? '<span class="bg-brand-500 text-white text-[9px] px-1.5 py-0.2 font-bold uppercase rounded">Active</span>' : ''}
            </div>
            <div class="text-[11px] text-slate-400 font-mono">${escapeHtml(s.email)}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="font-medium text-xs text-cyan-400">${escapeHtml(s.department)}</div>
          <div class="text-[11px] text-slate-500">Year ${s.yearOfStudy}</div>
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
    showToast('Active Participant', student ? `Acting as ${student.studentName}` : `Student #${studentId} selected`);
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
      container.innerHTML = `<p class="p-4 text-xs text-slate-500">No competitions found.</p>`;
      return;
    }

    container.innerHTML = summaries.slice(0, 3).map(s => {
      const c = s.competition;
      const isLive = c.competitionStatus === 'ACTIVE';
      return `
        <div class="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-mono px-2 py-0.5 rounded ${isLive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'} uppercase font-bold">
                ${c.competitionStatus}
              </span>
              <span class="text-xs text-slate-400 font-mono">${escapeHtml(c.competitionType)}</span>
            </div>
            <h4 class="font-bold text-sm text-white mt-1">${escapeHtml(c.competitionName)}</h4>
            <p class="text-xs text-slate-400 mt-0.5">${s.totalChallenges} Challenges • ${s.registeredParticipants}/${c.maxParticipants} Participants</p>
          </div>
          <button onclick="window.app.jumpToArena(${c.competitionId})" class="px-3.5 py-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500 text-brand-300 hover:text-white font-semibold text-xs border border-brand-500/30 transition-all flex-shrink-0">
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
        btn.className = 'comp-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 text-white transition-all shadow-sm';
      } else {
        btn.className = 'comp-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-850 text-slate-300 hover:text-white transition-all';
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
        <div class="col-span-full glass-panel p-12 text-center rounded-2xl border border-slate-800">
          <div class="font-display text-2xl text-brand-400 mb-2">No Tournaments Found</div>
          <p class="text-xs text-slate-400">No contests match the selected filter. Switch tabs or host a new one in the Organizer Hub.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(s => {
      const c = s.competition;
      const pct = Math.min(100, Math.round((s.registeredParticipants / c.maxParticipants) * 100));

      let statusBadge = '';
      if (c.competitionStatus === 'ACTIVE') {
        statusBadge = '<span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></span>ACTIVE NOW</span>';
      } else if (c.competitionStatus === 'UPCOMING') {
        statusBadge = '<span class="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">⏳ UPCOMING</span>';
      } else {
        statusBadge = '<span class="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">🏁 COMPLETED</span>';
      }

      return `
        <div class="glass-panel-interactive p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-[11px] font-mono font-bold text-brand-400 uppercase tracking-wide border border-brand-500/30 px-2.5 py-0.5 rounded-md bg-brand-500/10">
                ${escapeHtml(c.competitionType)}
              </span>
              ${statusBadge}
            </div>

            <h3 class="font-display text-xl font-bold text-white mb-2 leading-snug">
              ${escapeHtml(c.competitionName)}
            </h3>

            <p class="text-xs text-slate-300 mb-4 line-clamp-2 leading-relaxed">
              ${escapeHtml(c.description || 'No description provided')}
            </p>

            <!-- Metadata Box -->
            <div class="space-y-1.5 bg-dark-850/80 border border-slate-800/80 p-3 rounded-xl mb-4 text-xs font-mono">
              <div class="flex justify-between">
                <span class="text-slate-400">Start:</span>
                <span class="text-white font-medium">${formatDateTime(c.startTime)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">End:</span>
                <span class="text-white font-medium">${formatDateTime(c.endTime)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Challenges:</span>
                <span class="text-cyan-400 font-semibold">${s.totalChallenges} Questions (${s.totalPoints} Pts)</span>
              </div>
            </div>

            <!-- Participant Capacity Meter -->
            <div class="mb-4">
              <div class="flex justify-between text-[11px] font-mono mb-1">
                <span class="text-slate-400">Enrolled Capacity</span>
                <span class="${s.isFull ? 'text-red-400 font-bold' : 'text-slate-200'}">
                  ${s.registeredParticipants} / ${c.maxParticipants} (${pct}%)
                </span>
              </div>
              <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                <div class="h-full ${s.isFull ? 'bg-red-500' : 'bg-gradient-to-r from-brand-500 to-amber-500'}" style="width: ${pct}%"></div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800">
            ${c.competitionStatus === 'ACTIVE' ? `
              <button onclick="window.app.jumpToArena(${c.competitionId})" class="flex-1 py-2 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs text-center transition-colors shadow-sm">
                ⚡ Solve Arena
              </button>
            ` : ''}

            ${s.isRegistrationOpen ? `
              <button onclick="window.app.openRegistrationModal(${c.competitionId})" class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors">
                + Register
              </button>
            ` : `
              <span class="text-[11px] text-slate-500 italic py-1">
                ${s.isFull ? 'Capacity Full' : 'Closed'}
              </span>
            `}

            <button onclick="window.app.loadLeaderboard(${c.competitionId}); window.app.switchSection('leaderboard');" class="py-2 px-3 rounded-xl bg-dark-850 hover:bg-slate-800 text-amber-400 font-semibold text-xs border border-amber-500/20 transition-colors" title="View Standings">
              🏆 Standings
            </button>
          </div>
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
      showToast('Selection Missing', 'Please select a student to register.', true);
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
      showToast('Registration Confirmed! 🎉', `Student enrolled in tournament.`);
      closeRegistrationModal();
      await loadCompetitions();
      await loadSystemStats();
    } else {
      showToast('Enrollment Failed', res.message || 'Error completing registration', true);
    }
  }

  // Leaderboard Logic
  async function loadLeaderboard(competitionId) {
    AppState.isGlobalLeaderboard = false;
    AppState.currentLeaderboardId = parseInt(competitionId);

    const compSelect = document.getElementById('leaderboard-competition-select');
    if (compSelect) compSelect.value = competitionId;

    const globalBtn = document.getElementById('btn-global-standings');
    if (globalBtn) globalBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-850 hover:bg-slate-800 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition-colors';

    const comp = AppState.competitions.find(c => c.competitionId == competitionId);
    const res = await api(`/leaderboard/competition/${competitionId}`);
    if (res.success && res.data) {
      renderLeaderboard(res.data, comp);
    }
  }

  async function toggleGlobalLeaderboard() {
    AppState.isGlobalLeaderboard = true;
    const globalBtn = document.getElementById('btn-global-standings');
    if (globalBtn) globalBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 font-bold border border-amber-400 flex items-center gap-1.5 shadow-glow-orange';

    const res = await api('/leaderboard/global');
    if (res.success && res.data) {
      renderLeaderboard(res.data, { competitionName: 'Global Campus Hall of Fame' });
    }
  }

  function refreshCurrentLeaderboard(notify = true) {
    if (AppState.isGlobalLeaderboard) {
      toggleGlobalLeaderboard();
    } else if (AppState.currentLeaderboardId) {
      loadLeaderboard(AppState.currentLeaderboardId);
    }
    if (notify) showToast('Leaderboard Refreshed', 'Latest scores fetched from MySQL');
  }

  function renderLeaderboard(entries, competition) {
    const tableTitle = document.getElementById('leaderboard-table-title');
    const countBadge = document.getElementById('leaderboard-count');
    const podiumContainer = document.getElementById('podium-container');
    const tbody = document.getElementById('leaderboard-tbody');

    if (tableTitle && competition) {
      tableTitle.textContent = `${competition.competitionName} • Live Standings`;
    }
    if (countBadge) countBadge.textContent = `${entries.length} Ranked`;

    // Render Podium for Top 3
    if (podiumContainer) {
      if (entries.length === 0) {
        podiumContainer.innerHTML = `
          <div class="col-span-full glass-panel p-8 text-center rounded-2xl border border-slate-800">
            <span class="font-display text-xl text-brand-400 font-bold block mb-1">NO SUBMISSIONS YET</span>
            <p class="text-xs text-slate-400">Be the first to submit a solution in the Solve Arena to claim the #1 spot!</p>
          </div>
        `;
      } else {
        const top3 = entries.slice(0, 3);
        const rankColors = [
          { border: 'border-amber-500/50', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', medal: '🥇 1ST PLACE • GOLD' },
          { border: 'border-slate-400/50', badge: 'bg-slate-400/20 text-slate-300 border-slate-400/40', medal: '🥈 2ND PLACE • SILVER' },
          { border: 'border-amber-700/50', badge: 'bg-amber-700/20 text-amber-400 border-amber-700/40', medal: '🥉 3RD PLACE • BRONZE' }
        ];

        podiumContainer.innerHTML = top3.map((e, idx) => `
          <div class="glass-panel p-6 rounded-2xl border ${rankColors[idx].border} relative overflow-hidden shadow-card">
            <div class="flex items-center justify-between mb-3">
              <span class="font-mono font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${rankColors[idx].badge}">
                ${rankColors[idx].medal}
              </span>
              <span class="font-display text-3xl font-bold text-slate-400">
                #0${e.rank}
              </span>
            </div>

            <div class="font-display text-2xl font-bold text-white truncate mb-1">
              ${escapeHtml(e.studentName)}
            </div>
            <div class="text-xs text-slate-400 font-mono mb-4 truncate">
              ${escapeHtml(e.department)} • Yr ${e.yearOfStudy}
            </div>

            <div class="flex items-center justify-between border-t border-slate-800 pt-3">
              <div>
                <span class="text-[10px] uppercase font-mono text-slate-400 block">Total Score</span>
                <span class="font-display text-3xl font-bold text-brand-400">${e.totalScore} <span class="text-xs font-mono text-slate-400">PTS</span></span>
              </div>
              <div class="text-right">
                <span class="text-[10px] uppercase font-mono text-slate-400 block">Problems</span>
                <span class="font-semibold text-xs text-cyan-400">${e.challengesSolved} Solved</span>
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
            <td colspan="6" class="text-center py-8 text-slate-500 font-medium">
              No registered participants have submitted answers yet.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = entries.map(e => `
        <tr class="hover:bg-slate-800/40 transition-colors">
          <td class="py-3 px-4 font-display text-base font-bold text-white">
            #${e.rank}
            ${e.rank === 1 ? '🥇' : (e.rank === 2 ? '🥈' : (e.rank === 3 ? '🥉' : ''))}
          </td>
          <td class="py-3 px-4">
            <div class="font-semibold text-white text-xs">${escapeHtml(e.studentName)}</div>
            <div class="text-[11px] text-slate-400 font-mono">${escapeHtml(e.email)}</div>
          </td>
          <td class="py-3 px-4 text-xs">
            <span class="font-medium text-cyan-400">${escapeHtml(e.department)}</span>
            <span class="text-slate-500 block font-mono text-[11px]">Year ${e.yearOfStudy}</span>
          </td>
          <td class="py-3 px-4 text-center font-mono font-bold text-xs">
            <span class="bg-dark-850 border border-slate-700 px-2.5 py-0.5 rounded text-slate-200">
              ${e.challengesSolved}
            </span>
          </td>
          <td class="py-3 px-4 text-right font-display text-xl font-bold text-brand-400">
            ${e.totalScore}
          </td>
          <td class="py-3 px-4 text-right text-xs text-slate-400 font-mono">
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
        challengeSelect.innerHTML = `<option value="">No challenges in this competition yet</option>`;
      } else {
        challengeSelect.innerHTML = `<option value="">-- Choose Challenge --</option>` + res.data.map(ch => `
          <option value="${ch.challengeId}">[${ch.points} Pts] ${escapeHtml(ch.challengeTitle)}</option>
        `).join('');

        // Select first challenge
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
        <div class="p-2.5 rounded-lg border border-slate-800 bg-dark-850 flex items-center justify-between text-xs">
          <div>
            <span class="font-semibold text-white">${escapeHtml(sub.challengeTitle || 'Challenge')}</span>
            <span class="text-slate-400 block font-mono text-[11px] truncate max-w-xs">Ans: "${escapeHtml(sub.submittedAnswer)}"</span>
          </div>
          <div class="text-right">
            <span class="${sub.score > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}">
              ${sub.score} / ${sub.maxPoints || 0} Pts
            </span>
            <span class="text-[10px] text-slate-500 block font-mono">${formatDateTime(sub.submissionTime)}</span>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `<p class="text-xs text-slate-500 italic py-2">No submissions by this student for this contest yet.</p>`;
    }
  }

  async function handleAnswerSubmit(event) {
    event.preventDefault();

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
      btn.innerHTML = `<span>⏳</span> Evaluating...`;
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
      btn.innerHTML = `<span>⚡</span> Submit & Evaluate`;
    }

    if (resultBox) resultBox.classList.remove('hidden');

    if (res.success && res.data) {
      const sub = res.data;
      const isCorrect = sub.score > 0;

      if (isCorrect) {
        showToast('CORRECT ANSWER! 🎉', `+${sub.score} Points added to score.`);
        if (resultBox) {
          resultBox.innerHTML = `
            <div class="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-xs">
              <div class="font-bold flex items-center gap-2 text-sm text-emerald-300">
                <span>✅</span> CORRECT ANSWER!
              </div>
              <div class="mt-1">Awarded: <strong>+${sub.score} Points</strong> • Status: <strong>${sub.evaluationStatus}</strong></div>
              <div class="text-[11px] text-emerald-400 mt-2 font-mono">Live leaderboard updated in MySQL.</div>
            </div>
          `;
        }
      } else {
        showToast('INCORRECT ANSWER', '0 points awarded. Try again!', true);
        if (resultBox) {
          resultBox.innerHTML = `
            <div class="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs">
              <div class="font-bold flex items-center gap-2 text-sm text-amber-300">
                <span>❌</span> INCORRECT ANSWER
              </div>
              <div class="mt-1">Score: <strong>0 Points</strong> • Status: <strong>${sub.evaluationStatus}</strong></div>
              <div class="text-[11px] text-amber-400 mt-2 font-mono">The answer did not match the expected key.</div>
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
      showToast('Submission Rejected', res.message || 'Error processing submission', true);
      if (resultBox) {
        resultBox.innerHTML = `
          <div class="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs">
            <div class="font-bold flex items-center gap-2 text-sm text-rose-300">
              <span>⛔</span> VALIDATION GUARD REJECTED
            </div>
            <div class="mt-1 font-semibold">${escapeHtml(res.message || 'Validation failed')}</div>
            <div class="text-[11px] text-rose-400 mt-2 font-mono">Ensure the student is enrolled and competition is ACTIVE.</div>
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
      showToast('Student Enrolled!', `Welcome ${res.data.studentName} (#${res.data.studentId})`);
      document.getElementById('student-register-form').reset();
      AppState.activeStudentId = res.data.studentId;
      await loadStudents();
      await loadSystemStats();
    } else {
      showToast('Registration Error', res.message || 'Failed to register student', true);
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
        if (btn) btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 text-white transition-all shadow-sm';
      } else {
        if (panel) panel.classList.add('hidden');
        if (btn) btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-dark-850 text-slate-300 hover:text-white transition-all';
      }
    });
  }

  // Handle Create Competition
  async function handleCreateCompetition(event) {
    event.preventDefault();
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
      showToast('Competition Created!', `Created ${res.data.competitionName}`);
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
      showToast('Challenge Added!', `"${res.data.challengeTitle}" (${res.data.points} Pts) added.`);
      document.getElementById('new-ch-title').value = '';
      document.getElementById('new-ch-desc').value = '';
      document.getElementById('new-ch-answer').value = '';
      await loadCompetitions();
      await loadSystemStats();
    } else {
      showToast('Error Adding Challenge', res.message || 'Could not add challenge', true);
    }
  }

  // Organizer Submissions Review
  async function loadSubmissionsForReview(competitionId) {
    const tbody = document.getElementById('review-submissions-tbody');
    if (!tbody || !competitionId) return;

    tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-slate-500">Loading submissions...</td></tr>`;

    const res = await api(`/submissions/competition/${competitionId}`);
    if (res.success && res.data) {
      if (res.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-slate-500">No submissions recorded for this contest.</td></tr>`;
        return;
      }

      tbody.innerHTML = res.data.map(sub => `
        <tr class="hover:bg-slate-800/40 transition-colors">
          <td class="py-2.5 px-4 font-mono font-bold text-white">#${sub.submissionId}</td>
          <td class="py-2.5 px-4 font-semibold text-white">${escapeHtml(sub.studentName || 'Student #' + sub.studentId)}</td>
          <td class="py-2.5 px-4 text-slate-300">${escapeHtml(sub.challengeTitle || 'Challenge #' + sub.challengeId)}</td>
          <td class="py-2.5 px-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">${escapeHtml(sub.submittedAnswer)}</td>
          <td class="py-2.5 px-4 font-bold ${sub.score > 0 ? 'text-emerald-400' : 'text-rose-400'}">
            ${sub.score} / ${sub.maxPoints || 0}
          </td>
          <td class="py-2.5 px-4">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${sub.evaluationStatus === 'EVALUATED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">
              ${sub.evaluationStatus}
            </span>
          </td>
          <td class="py-2.5 px-4 text-right">
            <button onclick="window.app.openGradingModal(${sub.submissionId}, ${sub.score}, '${sub.evaluationStatus}')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-brand-500 hover:text-white text-slate-200 text-xs font-semibold transition-colors">
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
      showToast('Score Updated', `Submission #${subId} graded.`);
      closeGradingModal();
      const reviewCompSelect = document.getElementById('review-comp-select');
      if (reviewCompSelect) loadSubmissionsForReview(reviewCompSelect.value);
      if (AppState.currentLeaderboardId) loadLeaderboard(AppState.currentLeaderboardId);
    } else {
      showToast('Grading Error', res.message || 'Failed to update score', true);
    }
  }

  // History & Hall of Fame
  async function loadHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;

    const res = await api('/history');
    if (res.success && res.data) {
      if (res.data.length === 0) {
        container.innerHTML = `
          <div class="glass-panel p-8 text-center rounded-2xl border border-slate-800">
            <div class="font-display text-xl text-brand-400 font-bold mb-1">NO ARCHIVED COMPETITIONS YET</div>
            <p class="text-xs text-slate-400">When competitions conclude or reach COMPLETED status, final podiums and score summaries will be preserved here.</p>
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
          <div class="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-card">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="bg-slate-800 text-slate-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    COMPLETED CONTEST
                  </span>
                  <span class="text-xs font-mono text-cyan-400">
                    ${escapeHtml(c.competitionType)}
                  </span>
                </div>
                <h3 class="font-display text-2xl font-bold text-white">
                  ${escapeHtml(c.competitionName)}
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">
                  Concluded: ${formatDateTime(c.endTime)} • ${h.totalParticipants} Participants • ${h.totalSubmissions} Submissions
                </p>
              </div>

              <div>
                <button onclick="window.app.loadLeaderboard(${c.competitionId}); window.app.switchSection('leaderboard');" class="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-sm">
                  View Full Standings 🏆
                </button>
              </div>
            </div>

            <!-- Hall of Fame Podium Display -->
            <div class="grid sm:grid-cols-3 gap-4">
              <!-- Winner Gold -->
              <div class="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 shadow-sm">
                <div class="font-mono font-bold text-[10px] uppercase tracking-wider text-amber-300 mb-1 flex items-center gap-1">
                  <span>🥇</span> CHAMPION / GOLD
                </div>
                <div class="font-display text-xl font-bold text-white truncate">
                  ${winner ? escapeHtml(winner.studentName) : 'No Submissions'}
                </div>
                <div class="text-xs text-slate-400 font-mono mt-0.5">
                  ${winner ? `${escapeHtml(winner.department)} • ${winner.totalScore} Pts` : '—'}
                </div>
              </div>

              <!-- Runner up Silver -->
              <div class="p-4 rounded-xl border border-slate-400/40 bg-slate-400/10 shadow-sm">
                <div class="font-mono font-bold text-[10px] uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                  <span>🥈</span> 2ND PLACE / SILVER
                </div>
                <div class="font-display text-xl font-bold text-white truncate">
                  ${runnerUp ? escapeHtml(runnerUp.studentName) : '—'}
                </div>
                <div class="text-xs text-slate-400 font-mono mt-0.5">
                  ${runnerUp ? `${escapeHtml(runnerUp.department)} • ${runnerUp.totalScore} Pts` : '—'}
                </div>
              </div>

              <!-- Third place Bronze -->
              <div class="p-4 rounded-xl border border-amber-700/40 bg-amber-700/10 shadow-sm">
                <div class="font-mono font-bold text-[10px] uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1">
                  <span>🥉</span> 3RD PLACE / BRONZE
                </div>
                <div class="font-display text-xl font-bold text-white truncate">
                  ${thirdPlace ? escapeHtml(thirdPlace.studentName) : '—'}
                </div>
                <div class="text-xs text-slate-400 font-mono mt-0.5">
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
    showToast('Resetting Database...', 'Restoring demonstration records in MySQL.');
    const res = await api('/system/reset-seed', { method: 'POST' });
    if (res.success) {
      showToast('Database Seeded!', 'Demo students, active & completed contests, and submissions created.');
      await init();
    } else {
      showToast('Seed Failed', res.message || 'Error resetting database', true);
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
  };

  // Launch on DOM ready
  document.addEventListener('DOMContentLoaded', init);

})();
