/**
 * Campus Challenge Arena - Interactive Frontend Logic
 * Brutalist UI • Live Leaderboards • Dynamic MySQL Sync
 */

(function () {
  'use strict';

  const AppState = {
    students: [],
    competitions: [],
    summaries: [],
    activeStudentId: null,
    currentLeaderboardId: null,
    currentFilter: 'ALL',
    isGlobalLeaderboard: false,
    selectedRegCompId: null,
    activeOrganizerTab: 'create-comp',
    refreshTimer: null,
  };

  // Toast Helper
  function showToast(title, message, isError = false) {
    const toast = document.getElementById('toast');
    const toastCard = document.getElementById('toast-card');
    const toastTitle = document.getElementById('toast-title');
    const toastMsg = document.getElementById('toast-msg');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast) return;

    toastTitle.textContent = title;
    toastMsg.textContent = message;
    toastIcon.textContent = isError ? '⚠️' : '⚡';

    if (isError) {
      toastCard.className = 'border-4 border-brand-accent p-4 bg-red-600 text-white font-primary font-bold shadow-dark flex items-center gap-3 max-w-md';
    } else {
      toastCard.className = 'border-4 border-brand-accent p-4 bg-brand-primary text-text-on-primary font-primary font-bold shadow-dark flex items-center gap-3 max-w-md';
    }

    toast.classList.remove('translate-y-32', 'opacity-0', 'pointer-events-none');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-32', 'opacity-0', 'pointer-events-none');
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

  // Initial Load
  async function init() {
    await loadSystemStats();
    await loadStudents();
    await loadCompetitions();
    await loadHistory();
    setupDefaultDates();

    // Setup periodic refresh for leaderboard (every 8s)
    if (AppState.refreshTimer) clearInterval(AppState.refreshTimer);
    AppState.refreshTimer = setInterval(() => {
      if (!AppState.isGlobalLeaderboard && AppState.currentLeaderboardId) {
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
        html += `<option value="${s.studentId}">${s.studentName} (${s.department} • Yr ${s.yearOfStudy})</option>`;
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
      container.innerHTML = `<p class="p-4 text-xs text-text-secondary text-center">No students registered yet. Fill out the form to register your first student.</p>`;
      return;
    }

    container.innerHTML = students.map(s => `
      <div class="py-3 px-2 flex items-center justify-between gap-3 hover:bg-neutral-surface1 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 border-2 border-brand-accent bg-neutral-surface1 flex items-center justify-center font-display text-lg font-bold text-brand-primary">
            #${s.studentId}
          </div>
          <div>
            <div class="font-primary font-bold text-sm text-text-primary flex items-center gap-2">
              ${escapeHtml(s.studentName)}
              ${AppState.activeStudentId == s.studentId ? '<span class="bg-brand-primary text-white text-[9px] px-1.5 py-0.2 font-bold uppercase rounded">Active</span>' : ''}
            </div>
            <div class="text-xs text-text-secondary font-mono">${escapeHtml(s.email)}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="font-primary font-bold text-xs text-brand-tertiary">${escapeHtml(s.department)}</div>
          <div class="text-[11px] text-text-secondary">Year ${s.yearOfStudy}</div>
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
    showToast('Active Student Changed', `Now acting as student #${studentId}`);
  }

  // Load Competitions
  async function loadCompetitions() {
    const res = await api('/competitions/summaries');
    if (res.success && res.data) {
      AppState.summaries = res.data;
      AppState.competitions = res.data.map(s => s.competition);

      renderCompetitionsGrid(res.data);
      updateSpotlightCard(res.data);
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
      // Auto select first active competition if none selected
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
    document.getElementById('spotlight-title').textContent = c.competitionName;
    document.getElementById('spotlight-desc').textContent = c.description || 'No description provided';
    document.getElementById('spotlight-type').textContent = c.competitionType;
    document.getElementById('spotlight-challenges').textContent = `${active.totalChallenges} Questions (${active.totalPoints} Pts)`;
    document.getElementById('spotlight-participants').textContent = `${active.registeredParticipants} / ${c.maxParticipants} Enrolled`;

    AppState.spotlightCompId = c.competitionId;
  }

  function enterSpotlightContest() {
    if (AppState.spotlightCompId) {
      const arenaSelect = document.getElementById('arena-competition-select');
      if (arenaSelect) {
        arenaSelect.value = AppState.spotlightCompId;
        onArenaCompetitionSelect(AppState.spotlightCompId);
      }
      window.location.hash = '#arena';
    }
  }

  function viewSpotlightLeaderboard() {
    if (AppState.spotlightCompId) {
      const lbSelect = document.getElementById('leaderboard-competition-select');
      if (lbSelect) lbSelect.value = AppState.spotlightCompId;
      loadLeaderboard(AppState.spotlightCompId);
      window.location.hash = '#leaderboard';
    }
  }

  function filterCompetitions(filter) {
    AppState.currentFilter = filter;
    document.querySelectorAll('.comp-filter-btn').forEach(btn => {
      if (btn.dataset.filter === filter) {
        btn.className = 'comp-filter-btn brutalist-btn bg-brand-accent text-text-on-primary px-4 py-2 text-xs';
      } else {
        btn.className = 'comp-filter-btn brutalist-btn bg-neutral-surface text-text-primary px-4 py-2 text-xs hover:bg-neutral-surface1';
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
        <div class="col-span-full border-4 border-brand-accent bg-neutral-surface p-12 text-center shadow-subtle">
          <div class="font-display text-4xl text-brand-primary mb-2">NO COMPETITIONS FOUND</div>
          <p class="text-sm text-text-secondary">No contests match the selected filter. Switch tabs or host a new one in the Organizer Console.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(s => {
      const c = s.competition;
      const pct = Math.min(100, Math.round((s.registeredParticipants / c.maxParticipants) * 100));

      let statusBadge = '';
      if (c.competitionStatus === 'ACTIVE') {
        statusBadge = '<span class="bg-emerald-600 text-white font-primary font-bold text-[10px] px-2.5 py-0.5 uppercase tracking-wider flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-white pulse-dot"></span>ACTIVE NOW</span>';
      } else if (c.competitionStatus === 'UPCOMING') {
        statusBadge = '<span class="bg-amber-600 text-white font-primary font-bold text-[10px] px-2.5 py-0.5 uppercase tracking-wider">⏳ UPCOMING</span>';
      } else {
        statusBadge = '<span class="bg-neutral-800 text-white font-primary font-bold text-[10px] px-2.5 py-0.5 uppercase tracking-wider">🏁 COMPLETED</span>';
      }

      return `
        <div class="border-4 border-brand-accent bg-neutral-surface p-6 shadow-dark hover:shadow-hover transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="font-primary font-bold text-[11px] text-brand-primary uppercase tracking-wide border-2 border-brand-primary px-2 py-0.5">
                ${escapeHtml(c.competitionType)}
              </span>
              ${statusBadge}
            </div>

            <h3 class="font-display text-2xl font-bold text-brand-accent mb-2 leading-tight">
              ${escapeHtml(c.competitionName)}
            </h3>

            <p class="text-xs text-text-secondary mb-4 line-clamp-2 leading-relaxed">
              ${escapeHtml(c.description || 'No description provided')}
            </p>

            <!-- Metadata Box -->
            <div class="space-y-2 bg-neutral-surface1 border-2 border-brand-accent p-3 mb-4 text-xs font-primary">
              <div class="flex justify-between">
                <span class="text-text-secondary">Start:</span>
                <span class="font-bold text-text-primary">${formatDateTime(c.startTime)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">End:</span>
                <span class="font-bold text-text-primary">${formatDateTime(c.endTime)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">Questions:</span>
                <span class="font-bold text-brand-tertiary">${s.totalChallenges} Questions (${s.totalPoints} Pts)</span>
              </div>
            </div>

            <!-- Participant Capacity Meter -->
            <div class="mb-4">
              <div class="flex justify-between text-[11px] font-primary font-bold mb-1">
                <span>Registration Limit</span>
                <span class="${s.isFull ? 'text-red-600 font-extrabold' : 'text-brand-accent'}">
                  ${s.registeredParticipants} / ${c.maxParticipants} (${pct}%)
                </span>
              </div>
              <div class="w-full bg-neutral-border h-2.5 border-2 border-brand-accent overflow-hidden">
                <div class="h-full ${s.isFull ? 'bg-red-500' : 'bg-brand-primary'}" style="width: ${pct}%"></div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2 pt-3 border-t-2 border-neutral-border">
            ${c.competitionStatus === 'ACTIVE' ? `
              <button onclick="window.app.jumpToArena(${c.competitionId})" class="brutalist-btn bg-brand-primary text-text-on-primary py-2 px-3 text-xs flex-1 text-center hover:bg-brand-secondary">
                ⚡ Enter Arena
              </button>
            ` : ''}

            ${s.isRegistrationOpen ? `
              <button onclick="window.app.openRegistrationModal(${c.competitionId})" class="brutalist-btn bg-neutral-surface text-brand-accent py-2 px-3 text-xs hover:bg-brand-secondary hover:text-white">
                + Register
              </button>
            ` : `
              <span class="text-[11px] text-text-secondary italic self-center">
                ${s.isFull ? 'Capacity Full' : 'Registration Closed'}
              </span>
            `}

            <button onclick="window.app.loadLeaderboard(${c.competitionId}); window.location.hash='#leaderboard';" class="brutalist-btn bg-neutral-surface1 text-brand-tertiary py-2 px-3 text-xs hover:bg-neutral-surface">
              Leaderboard 🏆
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

    if (!studentId) {
      showToast('Validation Error', 'Please choose a student to register.', true);
      return;
    }
    if (!AppState.selectedRegCompId) return;

    const res = await api('/registrations', {
      method: 'POST',
      body: JSON.stringify({
        competitionId: AppState.selectedRegCompId,
        studentId: parseInt(studentId)
      })
    });

    if (res.success) {
      showToast('Registration Confirmed!', res.message || 'You are registered for the competition.');
      closeRegistrationModal();
      await loadCompetitions();
      await loadSystemStats();
    } else {
      showToast('Registration Denied', res.message || 'Could not complete registration.', true);
    }
  }

  // Live Leaderboard
  async function loadLeaderboard(competitionId) {
    AppState.isGlobalLeaderboard = false;
    AppState.currentLeaderboardId = parseInt(competitionId);

    const btnGlobal = document.getElementById('btn-global-standings');
    if (btnGlobal) btnGlobal.className = 'brutalist-btn bg-neutral-surface text-text-primary px-4 py-2 text-xs hover:bg-neutral-surface1';

    const select = document.getElementById('leaderboard-competition-select');
    if (select && select.value != competitionId) select.value = competitionId;

    const res = await api(`/leaderboard/competition/${competitionId}`);
    if (res.success && res.data) {
      renderLeaderboard(res.data.leaderboard || [], res.data.competition);
    } else {
      showToast('Leaderboard Error', res.message || 'Failed to load leaderboard', true);
    }
  }

  async function toggleGlobalLeaderboard() {
    AppState.isGlobalLeaderboard = true;
    const btnGlobal = document.getElementById('btn-global-standings');
    if (btnGlobal) btnGlobal.className = 'brutalist-btn bg-brand-tertiary text-text-on-primary px-4 py-2 text-xs shadow-dark';

    const res = await api('/leaderboard/global');
    if (res.success && res.data) {
      renderLeaderboard(res.data, { competitionName: 'College-Wide Hall of Fame', competitionStatus: 'GLOBAL' });
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
      tableTitle.textContent = `${competition.competitionName} • Live Rankings`;
    }
    if (countBadge) countBadge.textContent = `${entries.length} Ranked`;

    // Render Podium for Top 3
    if (podiumContainer) {
      if (entries.length === 0) {
        podiumContainer.innerHTML = `
          <div class="col-span-full bg-neutral-surface border-3 border-brand-accent p-6 text-center shadow-subtle">
            <span class="font-display text-2xl text-brand-primary">NO SUBMISSIONS YET</span>
            <p class="text-xs text-text-secondary mt-1">Be the first to submit a solution in the Solve Arena to claim the #1 spot!</p>
          </div>
        `;
      } else {
        const top3 = entries.slice(0, 3);
        const rankColors = [
          { border: 'border-amber-500', bg: 'bg-amber-400', label: '1ST PLACE • GOLD' },
          { border: 'border-slate-400', bg: 'bg-slate-300', label: '2ND PLACE • SILVER' },
          { border: 'border-amber-700', bg: 'bg-amber-600', label: '3RD PLACE • BRONZE' }
        ];

        podiumContainer.innerHTML = top3.map((e, idx) => `
          <div class="border-4 border-brand-accent bg-neutral-surface p-6 shadow-dark relative">
            <div class="flex items-center justify-between mb-3">
              <span class="font-primary font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 ${rankColors[idx].bg} text-brand-accent border border-brand-accent">
                ${rankColors[idx].label}
              </span>
              <span class="font-display text-4xl font-bold text-brand-accent">
                0${e.rank}
              </span>
            </div>

            <div class="font-display text-2xl font-bold text-brand-accent truncate mb-1">
              ${escapeHtml(e.studentName)}
            </div>
            <div class="text-xs text-text-secondary font-mono mb-4 truncate">
              ${escapeHtml(e.department)} • Yr ${e.yearOfStudy}
            </div>

            <div class="flex items-center justify-between border-t-2 border-neutral-border pt-3">
              <div>
                <span class="text-[10px] uppercase font-bold text-text-secondary block">Total Score</span>
                <span class="font-display text-3xl font-bold text-brand-primary">${e.totalScore} <span class="text-xs font-primary">PTS</span></span>
              </div>
              <div class="text-right">
                <span class="text-[10px] uppercase font-bold text-text-secondary block">Solved</span>
                <span class="font-primary font-bold text-sm text-brand-tertiary">${e.challengesSolved} Solved</span>
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
            <td colspan="6" class="text-center py-8 text-text-secondary font-bold">
              No registered participants have submitted answers yet.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = entries.map(e => `
        <tr class="hover:bg-neutral-surface1 transition-colors">
          <td class="py-3 px-4 font-display text-xl font-bold text-brand-accent">
            #${e.rank}
            ${e.rank === 1 ? '🥇' : (e.rank === 2 ? '🥈' : (e.rank === 3 ? '🥉' : ''))}
          </td>
          <td class="py-3 px-4">
            <div class="font-bold text-text-primary text-sm">${escapeHtml(e.studentName)}</div>
            <div class="text-[11px] text-text-secondary font-mono">${escapeHtml(e.email)}</div>
          </td>
          <td class="py-3 px-4 text-xs">
            <span class="font-semibold text-brand-tertiary">${escapeHtml(e.department)}</span>
            <span class="text-text-secondary block">Year ${e.yearOfStudy}</span>
          </td>
          <td class="py-3 px-4 text-center font-bold text-xs">
            <span class="bg-neutral-surface1 border border-brand-accent px-2 py-0.5">
              ${e.challengesSolved}
            </span>
          </td>
          <td class="py-3 px-4 text-right font-display text-2xl font-bold text-brand-primary">
            ${e.totalScore}
          </td>
          <td class="py-3 px-4 text-right text-xs text-text-secondary font-mono">
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
    document.getElementById('arena-card-badge').textContent = `${ch.points} Points`;
    document.getElementById('arena-card-title').textContent = ch.challengeTitle;
    document.getElementById('arena-card-desc').textContent = ch.questionDescription;
    card.classList.remove('hidden');
  }

  async function loadStudentSubmissionsInArena() {
    const studentSelect = document.getElementById('arena-student-select');
    const studentId = studentSelect ? studentSelect.value : AppState.activeStudentId;
    const compId = AppState.currentArenaCompId;

    const container = document.getElementById('student-recent-submissions');
    if (!container || !studentId || !compId) return;

    const res = await api(`/submissions/student/${studentId}/competition/${compId}`);
    if (res.success && res.data && res.data.length > 0) {
      container.innerHTML = res.data.slice(0, 5).map(sub => `
        <div class="p-2 border border-brand-accent bg-neutral-surface flex items-center justify-between text-xs">
          <div>
            <span class="font-bold text-brand-accent">${escapeHtml(sub.challengeTitle || 'Challenge')}</span>
            <span class="text-text-secondary block font-mono text-[11px] truncate max-w-xs">Ans: "${escapeHtml(sub.submittedAnswer)}"</span>
          </div>
          <div class="text-right">
            <span class="${sub.score > 0 ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}">
              ${sub.score} / ${sub.maxPoints || 0} Pts
            </span>
            <span class="text-[10px] text-text-secondary block font-mono">${formatDateTime(sub.submissionTime)}</span>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `<p class="text-xs text-text-secondary italic">No submissions by this student for this contest yet.</p>`;
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
    const stId = stSelect ? stSelect.value : AppState.activeStudentId;
    const answer = answerInput ? answerInput.value.trim() : '';

    if (!compId || !chId || !stId || !answer) {
      showToast('Incomplete Form', 'Please choose competition, challenge, student, and write an answer.', true);
      return;
    }

    const btn = document.getElementById('btn-submit-answer');
    btn.disabled = true;
    btn.innerHTML = `<span>⏳</span> Evaluating...`;

    const res = await api('/submissions', {
      method: 'POST',
      body: JSON.stringify({
        challengeId: parseInt(chId),
        studentId: parseInt(stId),
        submittedAnswer: answer
      })
    });

    btn.disabled = false;
    btn.innerHTML = `<span>⚡</span> Submit & Evaluate`;

    resultBox.classList.remove('hidden');

    if (res.success && res.data) {
      const sub = res.data;
      const isCorrect = sub.score > 0;

      if (isCorrect) {
        showToast('CORRECT ANSWER! 🎉', `+${sub.score} Points added to student's score.`);
        resultBox.innerHTML = `
          <div class="border-3 border-emerald-700 bg-emerald-50 p-4 font-primary text-emerald-900 shadow-subtle">
            <div class="font-bold text-sm uppercase flex items-center gap-2">
              <span class="text-xl">✅</span> EVALUATION SUCCESSFUL — CORRECT ANSWER!
            </div>
            <div class="text-xs mt-1">
              Awarded: <strong>+${sub.score} Points</strong> • Status: <strong>${sub.evaluationStatus}</strong>
            </div>
            <div class="text-[11px] text-emerald-700 mt-2 font-mono">
              Live leaderboard updated immediately in MySQL database.
            </div>
          </div>
        `;
      } else {
        showToast('INCORRECT ANSWER', '0 points awarded. Try again!', true);
        resultBox.innerHTML = `
          <div class="border-3 border-amber-600 bg-amber-50 p-4 font-primary text-amber-900 shadow-subtle">
            <div class="font-bold text-sm uppercase flex items-center gap-2">
              <span class="text-xl">❌</span> EVALUATED — INCORRECT ANSWER
            </div>
            <div class="text-xs mt-1">
              Score: <strong>0 Points</strong> • Status: <strong>${sub.evaluationStatus}</strong>
            </div>
            <div class="text-[11px] text-amber-700 mt-2 font-mono">
              The submitted answer did not match the expected solution for this challenge.
            </div>
          </div>
        `;
      }

      await loadSystemStats();
      loadStudentSubmissionsInArena();
      if (AppState.currentLeaderboardId == compId) {
        loadLeaderboard(compId);
      }
    } else {
      showToast('Submission Rejected', res.message || 'Error processing submission', true);
      resultBox.innerHTML = `
        <div class="border-3 border-red-600 bg-red-50 p-4 font-primary text-red-900 shadow-subtle">
          <div class="font-bold text-sm uppercase flex items-center gap-2">
            <span class="text-xl">⛔</span> VALIDATION GUARD REJECTED SUBMISSION
          </div>
          <div class="text-xs mt-1 font-semibold">
            ${escapeHtml(res.message || 'Validation failed')}
          </div>
          <div class="text-[11px] text-red-700 mt-2 font-mono">
            Ensure the student is registered for this competition, and the competition is currently ACTIVE.
          </div>
        </div>
      `;
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
    window.location.hash = '#arena';
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
        if (btn) btn.className = 'brutalist-btn bg-brand-accent text-text-on-primary px-4 py-2 text-xs';
      } else {
        if (panel) panel.classList.add('hidden');
        if (btn) btn.className = 'brutalist-btn bg-neutral-surface text-text-primary px-4 py-2 text-xs hover:bg-neutral-surface1';
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

    tbody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-text-secondary">Loading submissions...</td></tr>`;

    const res = await api(`/submissions/competition/${competitionId}`);
    if (res.success && res.data) {
      if (res.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-text-secondary">No submissions recorded for this contest.</td></tr>`;
        return;
      }

      tbody.innerHTML = res.data.map(sub => `
        <tr class="hover:bg-neutral-surface1 transition-colors">
          <td class="py-2.5 px-4 font-mono font-bold">#${sub.submissionId}</td>
          <td class="py-2.5 px-4 font-semibold text-text-primary">${escapeHtml(sub.studentName || 'Student #' + sub.studentId)}</td>
          <td class="py-2.5 px-4">${escapeHtml(sub.challengeTitle || 'Challenge #' + sub.challengeId)}</td>
          <td class="py-2.5 px-4 font-mono text-[11px] max-w-xs truncate">${escapeHtml(sub.submittedAnswer)}</td>
          <td class="py-2.5 px-4 font-bold ${sub.score > 0 ? 'text-emerald-700' : 'text-red-600'}">
            ${sub.score} / ${sub.maxPoints || 0}
          </td>
          <td class="py-2.5 px-4">
            <span class="px-2 py-0.5 text-[10px] font-bold ${sub.evaluationStatus === 'EVALUATED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              ${sub.evaluationStatus}
            </span>
          </td>
          <td class="py-2.5 px-4 text-right">
            <button onclick="window.app.openGradingModal(${sub.submissionId}, ${sub.score}, '${sub.evaluationStatus}')" class="brutalist-btn bg-neutral-surface text-brand-accent px-2.5 py-1 text-[11px] hover:bg-brand-primary hover:text-white">
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
          <div class="border-3 border-brand-accent bg-neutral-surface p-8 text-center shadow-subtle">
            <div class="font-display text-2xl text-brand-primary">NO ARCHIVED COMPETITIONS YET</div>
            <p class="text-xs text-text-secondary mt-1">When competitions reach their end time or are marked COMPLETED, their final results and podiums appear here.</p>
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
          <div class="border-4 border-brand-accent bg-neutral-surface p-6 sm:p-8 shadow-dark">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-neutral-border pb-4 mb-6">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="bg-neutral-800 text-white font-primary font-bold text-[10px] px-2 py-0.5 uppercase tracking-wider">
                    COMPLETED CONTEST
                  </span>
                  <span class="text-xs font-primary font-semibold text-brand-tertiary">
                    ${escapeHtml(c.competitionType)}
                  </span>
                </div>
                <h3 class="font-display text-3xl font-bold text-brand-accent">
                  ${escapeHtml(c.competitionName)}
                </h3>
                <p class="text-xs text-text-secondary mt-0.5">
                  Concluded: ${formatDateTime(c.endTime)} • ${h.totalParticipants} Participants • ${h.totalSubmissions} Submissions
                </p>
              </div>

              <div>
                <button onclick="window.app.loadLeaderboard(${c.competitionId}); window.location.hash='#leaderboard';" class="brutalist-btn bg-brand-primary text-text-on-primary px-4 py-2.5 text-xs hover:bg-brand-secondary">
                  View Full Standings 🏆
                </button>
              </div>
            </div>

            <!-- Hall of Fame Podium Display -->
            <div class="grid sm:grid-cols-3 gap-4">
              <!-- Winner Gold -->
              <div class="border-3 border-amber-500 bg-amber-50/50 p-4 shadow-subtle">
                <div class="font-primary font-bold text-[10px] uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1">
                  <span>🥇</span> CHAMPION / GOLD
                </div>
                <div class="font-display text-2xl font-bold text-brand-accent truncate">
                  ${winner ? escapeHtml(winner.studentName) : 'No Submissions'}
                </div>
                <div class="text-xs text-text-secondary">
                  ${winner ? `${escapeHtml(winner.department)} • ${winner.totalScore} Pts` : '—'}
                </div>
              </div>

              <!-- Runner up Silver -->
              <div class="border-3 border-slate-400 bg-slate-50 p-4 shadow-subtle">
                <div class="font-primary font-bold text-[10px] uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                  <span>🥈</span> 2ND PLACE / SILVER
                </div>
                <div class="font-display text-2xl font-bold text-brand-accent truncate">
                  ${runnerUp ? escapeHtml(runnerUp.studentName) : '—'}
                </div>
                <div class="text-xs text-text-secondary">
                  ${runnerUp ? `${escapeHtml(runnerUp.department)} • ${runnerUp.totalScore} Pts` : '—'}
                </div>
              </div>

              <!-- Third place Bronze -->
              <div class="border-3 border-amber-700 bg-orange-50/40 p-4 shadow-subtle">
                <div class="font-primary font-bold text-[10px] uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1">
                  <span>🥉</span> 3RD PLACE / BRONZE
                </div>
                <div class="font-display text-2xl font-bold text-brand-accent truncate">
                  ${thirdPlace ? escapeHtml(thirdPlace.studentName) : '—'}
                </div>
                <div class="text-xs text-text-secondary">
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
      .replace(/</g, '&lt;')
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
