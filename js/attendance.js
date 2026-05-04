/* ================================================
   VIWORK — Attendance Module (Chấm công)
   v1.0 — Sprint 3
   ================================================ */

// ============ CONFIG ============
const ATT_CONFIG = {
  checkInStd:   '08:00',   // Giờ vào chuẩn
  checkOutStd:  '17:00',   // Giờ ra chuẩn
  lateThreshold: 30,        // Phút muộn (vào sau 08:30)
  reminderHour:  18,        // Nhắc nhở chưa check-out sau 18:00
};

// ============ LOCAL STATE ============
let ATTENDANCE_RECORDS = [];   // Loaded from Firebase
let attUnsubscribe = null;     // Firebase listener handle
let attCheckInterval = null;   // Auto-reminder interval

// ============ INIT ============
function initAttendance() {
  // Listen to Firebase real-time
  if (window.fbListenAttendance) {
    if (attUnsubscribe) attUnsubscribe();
    attUnsubscribe = window.fbListenAttendance((records) => {
      ATTENDANCE_RECORDS = records;
      // Re-render if page is active
      const page = document.getElementById('page-attendance');
      if (page && !page.classList.contains('hidden')) {
        renderAttendance();
      }
      // Update badge & reminder
      checkAttendanceReminder();
    });
  }
  // Check reminder every minute
  if (attCheckInterval) clearInterval(attCheckInterval);
  attCheckInterval = setInterval(checkAttendanceReminder, 60000);
}

// ============ HELPERS ============
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getDateKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function formatDuration(ms) {
  if (!ms || ms < 0) return '—';
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m} phút`;
  return `${h}h ${m > 0 ? m + "'" : ''}`;
}

function formatDateVN(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
  return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function getAttStatus(record) {
  if (!record) return 'absent';
  if (record.isLeave)          return 'leave';           // Nghỉ phép được duyệt
  if (record.status === 'remote_approved' && !record.checkIn) return 'remote_approved';
  if (!record.checkIn)         return 'absent';

  const ci     = new Date(record.checkIn);
  const ciMins = ci.getHours() * 60 + ci.getMinutes();
  const lateLimit = 8 * 60 + ATT_CONFIG.lateThreshold;  // 08:30

  if (!record.checkOut) return 'working';
  if (ciMins > lateLimit) return 'late';
  return 'ontime';
}

function getStatusLabel(status, isOnline) {
  const loc = isOnline ? ' 🌐' : '';
  const map = {
    ontime:          `✅ Đúng giờ${loc}`,
    late:            `🟡 Đi muộn${loc}`,
    working:         `🔵 Đang làm${loc}`,
    absent:          '❌ Vắng',
    leave:           '🏖️ Nghỉ phép',
    remote_approved: '🌐 Chờ check-in Online',
  };
  return map[status] || '—';
}

function getStatusBadgeClass(status) {
  return {
    ontime:          'att-badge ontime',
    late:            'att-badge late',
    working:         'att-badge working',
    absent:          'att-badge absent',
    leave:           'att-badge leave',
    remote_approved: 'att-badge remote',
  }[status] || 'att-badge';
}

/** Kiểm tra hôm nay user có đề xuất remote được duyệt không */
function getTodayRemoteApproved(userId) {
  const today = getTodayKey();
  return ATTENDANCE_RECORDS.find(r =>
    r.userId === userId && r.date === today && r.remoteApproved === true
  ) || null;
}

/** Kiểm tra hôm nay user có nghỉ phép không */
function getTodayLeave(userId) {
  const today = getTodayKey();
  return ATTENDANCE_RECORDS.find(r =>
    r.userId === userId && r.date === today && r.isLeave === true
  ) || null;
}

/** Lấy record của user hôm nay */
function getTodayRecord(userId) {
  const today = getTodayKey();
  return ATTENDANCE_RECORDS.find(r => r.userId === userId && r.date === today) || null;
}

/** Lấy tất cả record của user trong 1 tháng */
function getUserMonthRecords(userId, year, month) {
  const prefix = `${year}-${String(month).padStart(2,'0')}`;
  return ATTENDANCE_RECORDS.filter(r => r.userId === userId && r.date.startsWith(prefix));
}

// ============ CHECK-IN ============
async function doCheckIn(isOnline) {
  const user = currentUser;
  if (!user) return;

  const today = getTodayKey();
  const existing = getTodayRecord(user.id);
  if (existing && existing.checkIn) {
    showToast('⚠️ Bạn đã check-in hôm nay rồi!', 'error');
    return;
  }

  const now = Date.now();
  const ci = new Date(now);
  const ciMins = ci.getHours() * 60 + ci.getMinutes();
  const lateLimit = 8 * 60 + ATT_CONFIG.lateThreshold;
  const isLate = ciMins > lateLimit;

  const record = {
    id:         generateId('att'),
    userId:     user.id,
    userName:   user.name,
    date:       today,
    checkIn:    now,
    checkOut:   null,
    duration:   null,
    isOnline:   !!isOnline,
    note:       '',
    isLate,
    status:     'working',
  };

  ATTENDANCE_RECORDS.push(record);
  if (window.fbSaveAttendance) await window.fbSaveAttendance(record);

  const msg = isLate
    ? `🟡 Đã check-in lúc ${formatTime(now)} (Muộn ${ciMins - 8*60 - ATT_CONFIG.lateThreshold} phút)`
    : `✅ Đã check-in lúc ${formatTime(now)}${isOnline ? ' — Online' : ' — Tại văn phòng'}`;
  showToast(msg, isLate ? 'info' : 'success');
  renderAttendance();
}

// ============ CHECK-OUT ============
async function doCheckOut() {
  const user = currentUser;
  if (!user) return;

  const record = getTodayRecord(user.id);
  if (!record || !record.checkIn) {
    showToast('⚠️ Bạn chưa check-in hôm nay!', 'error');
    return;
  }
  if (record.checkOut) {
    showToast('⚠️ Bạn đã check-out rồi!', 'error');
    return;
  }

  const now = Date.now();
  const duration = now - record.checkIn;

  const updated = { ...record, checkOut: now, duration, status: getAttStatus({ ...record, checkOut: now }) };
  const idx = ATTENDANCE_RECORDS.findIndex(r => r.id === record.id);
  if (idx > -1) ATTENDANCE_RECORDS[idx] = updated;
  if (window.fbSaveAttendance) await window.fbSaveAttendance(updated);

  showToast(`🏁 Đã check-out lúc ${formatTime(now)} · Làm việc ${formatDuration(duration)}`, 'success');
  renderAttendance();
}

// ============ REMINDER ============
function checkAttendanceReminder() {
  if (!currentUser) return;
  const now = new Date();
  if (now.getHours() < ATT_CONFIG.reminderHour) return;

  const record = getTodayRecord(currentUser.id);
  if (record && record.checkIn && !record.checkOut) {
    // Show badge on nav
    const badge = document.getElementById('badge-attendance');
    if (badge) { badge.textContent = '!'; badge.style.display = ''; }
    // One-time toast (per session)
    if (!sessionStorage.getItem('att_remind_' + getTodayKey())) {
      showToast('⏰ Đã 18:00 — Bạn chưa check-out! Đừng quên chấm công ra nhé.', 'info');
      sessionStorage.setItem('att_remind_' + getTodayKey(), '1');
    }
  } else {
    const badge = document.getElementById('badge-attendance');
    if (badge) badge.style.display = 'none';
  }
}

// ============ RENDER MAIN PAGE ============
function renderAttendance() {
  const page = document.getElementById('page-attendance');
  if (!page) return;

  const user   = currentUser;
  const today  = getTodayKey();
  const record = getTodayRecord(user?.id);
  const isAdminOrMgr = user?.role === 'admin' || user?.role === 'manager';

  page.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-h1">⏱ Chấm công</h1>
        <p class="page-sub">${formatDateVN(today)}</p>
      </div>
      <div class="page-actions">
        <select id="attViewPeriod" class="select-input" onchange="renderAttHistory()">
          <option value="week">Tuần này</option>
          <option value="month" selected>Tháng này</option>
        </select>
      </div>
    </div>

    <!-- WIDGET CHECK-IN -->
    ${renderCheckInWidget(record)}

    <!-- STATS ROW -->
    ${renderAttStats(user)}

    <!-- TEAM OVERVIEW (Admin/Manager) -->
    ${isAdminOrMgr ? renderTeamAttendanceSection() : ''}

    <!-- PERSONAL HISTORY -->
    <div class="att-section">
      <div class="att-section-header">
        <h3>📅 Lịch sử chấm công</h3>
      </div>
      <div id="attHistoryContainer">
        ${renderAttHistoryHTML(user)}
      </div>
    </div>
  `;
}

// ============ WIDGET CHECK-IN/OUT ============
function renderCheckInWidget(record) {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const isCheckedIn  = record && record.checkIn;
  const isCheckedOut = record && record.checkOut;

  let widgetContent = '';

  if (!isCheckedIn) {
    // Kiểm tra nghỉ phép
    const leaveRec = getTodayLeave(currentUser?.id);
    if (leaveRec) {
      widgetContent = `
        <div class="att-widget-status leave">
          <div style="font-size:48px;text-align:center;margin-bottom:8px">🏖️</div>
          <div class="att-status-text" style="justify-content:center">Hôm nay bạn đang nghỉ phép</div>
          <div class="att-config-info" style="text-align:center">${leaveRec.note || 'Nghỉ phép được duyệt'}</div>
        </div>
      `;
    } else {
      // Kiểm tra remote được duyệt
      const remoteRec = getTodayRemoteApproved(currentUser?.id);
      const remoteNote = remoteRec ? `
        <div class="att-remote-approved-banner">
          ✅ Đã được duyệt làm Online hôm nay — bạn có thể Check-in Online
        </div>` : '';

      widgetContent = `
        <div class="att-widget-status idle">
          <div class="att-clock-display" id="attLiveClock">${timeStr}</div>
          <div class="att-status-text">Chưa chấm công hôm nay</div>
          <div class="att-config-info">⏰ Giờ chuẩn: ${ATT_CONFIG.checkInStd} — ${ATT_CONFIG.checkOutStd}</div>
        </div>
        ${remoteNote}
        <div class="att-buttons">
          <button class="att-btn checkin-office" onclick="doCheckIn(false)" id="btnCheckIn">
            <span class="att-btn-icon">🏢</span>
            <span class="att-btn-text">
              <strong>Check-in Văn phòng</strong>
              <small>Làm việc tại văn phòng</small>
            </span>
          </button>
          <button class="att-btn checkin-online ${remoteRec ? 'approved' : ''}" onclick="doCheckIn(true)" id="btnCheckInOnline">
            <span class="att-btn-icon">🌐</span>
            <span class="att-btn-text">
              <strong>Check-in Online</strong>
              <small>${remoteRec ? '✅ Đã được duyệt làm từ xa' : 'Cần đề xuất làm online'}</small>
            </span>
          </button>
        </div>
      `;
    }
  } else if (!isCheckedOut) {
    // Đã vào, chưa ra
    const elapsed = Date.now() - record.checkIn;
    const lateInfo = record.isLate
      ? `<span class="att-late-tag">🟡 Muộn</span>`
      : `<span class="att-ontime-tag">✅ Đúng giờ</span>`;

    widgetContent = `
      <div class="att-widget-status working">
        <div class="att-clock-display" id="attLiveClock">${timeStr}</div>
        <div class="att-status-text">
          Đang làm việc ${record.isOnline ? '<span class="online-tag">🌐 Online</span>' : '<span class="office-tag">🏢 Văn phòng</span>'}
          ${lateInfo}
        </div>
        <div class="att-checkin-info">
          Check-in: <strong>${formatTime(record.checkIn)}</strong> &nbsp;·&nbsp; Đã làm: <strong id="attElapsed">${formatDuration(elapsed)}</strong>
        </div>
      </div>
      <div class="att-buttons single">
        <button class="att-btn checkout" onclick="doCheckOut()" id="btnCheckOut">
          <span class="att-btn-icon">🏁</span>
          <span class="att-btn-text">
            <strong>Check-out — Kết thúc ca</strong>
            <small>Kết thúc làm việc hôm nay</small>
          </span>
        </button>
      </div>
    `;
    // Start elapsed timer
    startElapsedTimer(record.checkIn);
  } else {
    // Đã hoàn thành
    const status = getAttStatus(record);
    widgetContent = `
      <div class="att-widget-status done">
        <div class="att-done-icon">🎉</div>
        <div class="att-status-text">Đã hoàn thành ca làm việc hôm nay</div>
        <div class="att-summary-row">
          <div class="att-sum-item">
            <span class="att-sum-label">Check-in</span>
            <span class="att-sum-val">${formatTime(record.checkIn)}</span>
          </div>
          <div class="att-sum-sep">→</div>
          <div class="att-sum-item">
            <span class="att-sum-label">Check-out</span>
            <span class="att-sum-val">${formatTime(record.checkOut)}</span>
          </div>
          <div class="att-sum-sep">·</div>
          <div class="att-sum-item">
            <span class="att-sum-label">Tổng giờ</span>
            <span class="att-sum-val highlight">${formatDuration(record.duration)}</span>
          </div>
        </div>
        <span class="${getStatusBadgeClass(status)}">${getStatusLabel(status, record.isOnline)}</span>
      </div>
    `;
  }

  return `
    <div class="att-widget-card" id="attWidget">
      ${widgetContent}
    </div>
  `;
}

// ============ LIVE CLOCK ============
let elapsedTimer = null;
function startElapsedTimer(checkInTs) {
  if (elapsedTimer) clearInterval(elapsedTimer);
  elapsedTimer = setInterval(() => {
    const el = document.getElementById('attElapsed');
    const clk = document.getElementById('attLiveClock');
    if (el) el.textContent = formatDuration(Date.now() - checkInTs);
    if (clk) {
      const n = new Date();
      clk.textContent = `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
    }
    if (!el) clearInterval(elapsedTimer);
  }, 10000); // update mỗi 10s
}

// ============ STATS ============
function renderAttStats(user) {
  if (!user) return '';
  const now = new Date();
  const records = getUserMonthRecords(user.id, now.getFullYear(), now.getMonth() + 1);

  const totalDays    = records.filter(r => r.checkIn).length;
  const ontimeDays   = records.filter(r => !r.isLate && r.checkIn).length;
  const lateDays     = records.filter(r => r.isLate).length;
  const totalMs      = records.reduce((s, r) => s + (r.duration || 0), 0);
  const totalHours   = (totalMs / 3600000).toFixed(1);

  return `
    <div class="att-stats-row">
      <div class="att-stat-card">
        <div class="att-stat-icon" style="background:linear-gradient(135deg,#10B981,#059669)">📅</div>
        <div class="att-stat-body">
          <div class="att-stat-val">${totalDays}</div>
          <div class="att-stat-lbl">Ngày làm tháng này</div>
        </div>
      </div>
      <div class="att-stat-card">
        <div class="att-stat-icon" style="background:linear-gradient(135deg,#5AB800,#3D9900)">⏱</div>
        <div class="att-stat-body">
          <div class="att-stat-val">${totalHours}h</div>
          <div class="att-stat-lbl">Tổng giờ làm</div>
        </div>
      </div>
      <div class="att-stat-card">
        <div class="att-stat-icon" style="background:linear-gradient(135deg,#3B82F6,#1D4ED8)">✅</div>
        <div class="att-stat-body">
          <div class="att-stat-val">${ontimeDays}</div>
          <div class="att-stat-lbl">Đúng giờ</div>
        </div>
      </div>
      <div class="att-stat-card">
        <div class="att-stat-icon" style="background:linear-gradient(135deg,#F59E0B,#D97706)">🟡</div>
        <div class="att-stat-body">
          <div class="att-stat-val">${lateDays}</div>
          <div class="att-stat-lbl">Đi muộn</div>
        </div>
      </div>
    </div>
  `;
}

// ============ PERSONAL HISTORY ============
function renderAttHistory() {
  const el = document.getElementById('attHistoryContainer');
  if (el) el.innerHTML = renderAttHistoryHTML(currentUser);
}

function renderAttHistoryHTML(user) {
  if (!user) return '';
  const period  = document.getElementById('attViewPeriod')?.value || 'month';
  const now     = new Date();

  let records = [];
  if (period === 'week') {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      const rec = ATTENDANCE_RECORDS.find(r => r.userId === user.id && r.date === key);
      const dow = d.getDay();
      if (dow !== 0) records.push({ date: key, rec, dayOfWeek: dow }); // skip Sunday
    }
  } else {
    // Current month
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= now.getDate(); i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      const key = getDateKey(d);
      const rec = ATTENDANCE_RECORDS.find(r => r.userId === user.id && r.date === key);
      const dow = d.getDay();
      if (dow !== 0) records.push({ date: key, rec, dayOfWeek: dow });
    }
  }

  if (records.length === 0) return '<div class="att-empty">Chưa có dữ liệu chấm công.</div>';

  const rows = records.reverse().map(({ date, rec }) => {
    const status  = getAttStatus(rec);
    const isLeave = rec?.isLeave;
    const isRemoteApproved = rec?.remoteApproved && !rec?.checkIn;
    const locIcon = rec?.isOnline ? '🌐' : (rec?.checkIn ? '🏢' : (isLeave ? '🏖️' : ''));
    return `
      <tr class="att-row ${status}">
        <td class="att-date">${formatDateVN(date)}</td>
        <td class="att-time">${isLeave ? '<span style="color:#8B5CF6;font-size:12px">Nghỉ phép</span>' : (rec?.checkIn ? formatTime(rec.checkIn) : '—')}</td>
        <td class="att-time">${isLeave || isRemoteApproved ? '—' : (rec?.checkOut ? formatTime(rec.checkOut) : '—')}</td>
        <td class="att-dur">${rec?.duration ? formatDuration(rec.duration) : '—'}</td>
        <td><span class="att-loc">${locIcon}</span></td>
        <td><span class="${getStatusBadgeClass(status)}">${getStatusLabel(status, rec?.isOnline)}</span></td>
      </tr>
    `;
  }).join('');

  return `
    <div class="att-table-wrap">
      <table class="att-table">
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Giờ làm</th>
            <th>Địa điểm</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ============ TEAM ATTENDANCE (Admin/Manager) ============
function renderTeamAttendanceSection() {
  const allUsers = getAppUsers();
  const today    = getTodayKey();

  const rows = allUsers.map(u => {
    const rec = ATTENDANCE_RECORDS.find(r => r.userId === u.id && r.date === today);
    const status = getAttStatus(rec);
    const locIcon = rec?.isOnline ? '🌐 Online' : (rec?.checkIn ? '🏢 VP' : '');

    return `
      <tr class="att-row ${status}">
        <td>
          <div class="att-user-cell">
            <div class="user-avatar" style="width:28px;height:28px;font-size:10px">${u.avatar || getInitials(u.name)}</div>
            <div>
              <div class="att-user-name">${escHtml(u.name)}</div>
              <div class="att-user-dept">${escHtml(u.department || '—')}</div>
            </div>
          </div>
        </td>
        <td class="att-time">${rec?.checkIn ? formatTime(rec.checkIn) : '—'}</td>
        <td class="att-time">${rec?.checkOut ? formatTime(rec.checkOut) : '—'}</td>
        <td>${rec?.duration ? formatDuration(rec.duration) : '—'}</td>
        <td><span class="att-loc-tag">${locIcon}</span></td>
        <td><span class="${getStatusBadgeClass(status)}">${getStatusLabel(status, rec?.isOnline)}</span></td>
      </tr>
    `;
  }).join('');

  // Summary counts
  const todayRecs = allUsers.map(u => ATTENDANCE_RECORDS.find(r => r.userId === u.id && r.date === today));
  const present  = todayRecs.filter(r => r?.checkIn).length;
  const working  = todayRecs.filter(r => r?.checkIn && !r?.checkOut).length;
  const absent   = allUsers.length - present;
  const online   = todayRecs.filter(r => r?.isOnline).length;

  return `
    <div class="att-section">
      <div class="att-section-header">
        <h3>👥 Điểm danh đội ngũ hôm nay</h3>
        <div class="att-team-summary">
          <span class="att-sum-chip present">✅ Có mặt: ${present}</span>
          <span class="att-sum-chip working">🔵 Đang làm: ${working}</span>
          <span class="att-sum-chip online">🌐 Online: ${online}</span>
          <span class="att-sum-chip absent">❌ Vắng: ${absent}</span>
        </div>
      </div>
      <div class="att-table-wrap">
        <table class="att-table">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Giờ làm</th>
              <th>Địa điểm</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

console.log('[⚡ VIWORK] Attendance module loaded!');
