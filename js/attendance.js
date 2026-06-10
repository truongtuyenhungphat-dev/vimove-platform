/* ================================================
   VIWORK — Attendance Module (Chấm công)
   v1.0 — Sprint 3
   ================================================ */

// ============ CONFIG ============
const ATT_CONFIG = {
  checkInStd:   '08:00',
  checkOutStd:  '17:00',
  lateThreshold: 30,
  reminderHour:  18,
  // GPS văn phòng — cấu hình tại đây
  office: {
    name:    'Văn phòng Vimove — Đại Mỗ, Hà Nội',
    lat:     20.9996875,  // XQPW+QGR Đại Mỗ, Nam Từ Liêm, Hà Nội
    lng:     105.7594375, // XQPW+QGR Đại Mỗ, Nam Từ Liêm, Hà Nội
    radius:  500,         // mét cho phép ± (check-in trong vòng 500m từ văn phòng)
  },
  qrSecret: 'VIWORK_OFFICE_2026',  // Mã bí mật QR
};

// ============ LOCAL STATE ============
let ATTENDANCE_RECORDS = [];   // Loaded from Firebase
let attUnsubscribe = null;     // Firebase listener handle
let attCheckInterval = null;   // Auto-reminder interval
const ATT_LS_KEY = 'viwork_attendance_local'; // localStorage key

// ============ LOCAL STORAGE HELPERS ============
function attSaveLocal(record) {
  try {
    const arr = attLoadLocal();
    const idx = arr.findIndex(r => r.id === record.id);
    if (idx > -1) arr[idx] = record; else arr.push(record);
    localStorage.setItem(ATT_LS_KEY, JSON.stringify(arr));
  } catch(e) { console.warn('[ATT] localStorage save error', e); }
}

function attLoadLocal() {
  try {
    return JSON.parse(localStorage.getItem(ATT_LS_KEY) || '[]');
  } catch(e) { return []; }
}

/** Merge local records vào ATTENDANCE_RECORDS (chống race condition với Firebase) */
function attMergeLocalPending() {
  const local = attLoadLocal();
  if (!local.length) return;
  local.forEach(loc => {
    const idx = ATTENDANCE_RECORDS.findIndex(r => r.id === loc.id);
    if (idx === -1) {
      // Record chưa lên Firebase → thêm vào local state + retry push
      ATTENDANCE_RECORDS.push(loc);
      if (window.fbSaveAttendance) {
        window.fbSaveAttendance(loc).catch(e => console.warn('[ATT] retry push failed', e));
      }
    } else {
      // Firebase có rồi → kiểm tra xem local có dữ liệu mới hơn không
      const fbRecord = ATTENDANCE_RECORDS[idx];
      let needsSync = false;
      
      if (loc.checkIn && !fbRecord.checkIn) {
        fbRecord.checkIn = loc.checkIn;
        fbRecord.isLate = loc.isLate;
        fbRecord.isOnline = loc.isOnline;
        fbRecord.note = loc.note;
        fbRecord.status = loc.status;
        needsSync = true;
      }
      if (loc.checkOut && !fbRecord.checkOut) {
        fbRecord.checkOut = loc.checkOut;
        fbRecord.duration = loc.duration;
        fbRecord.status = loc.status;
        needsSync = true;
      }

      if (needsSync && window.fbSaveAttendance) {
        window.fbSaveAttendance(fbRecord).catch(e => console.warn('[ATT] retry push failed', e));
      }
      
      // Update local storage to match the merged truth
      Object.assign(loc, fbRecord);
    }
  });
  localStorage.setItem(ATT_LS_KEY, JSON.stringify(local));
}

// ============ INIT ============
function initAttendance() {
  // Restore local cache trước khi Firebase trả về
  const cached = attLoadLocal();
  if (cached.length > 0) ATTENDANCE_RECORDS = cached;

  // Listen to Firebase real-time
  if (window.fbListenAttendance) {
    if (attUnsubscribe) attUnsubscribe();
    attUnsubscribe = window.fbListenAttendance(
      (records) => {
        // Merge: ưu tiên Firebase nhưng không bỏ mất record local chưa sync
        ATTENDANCE_RECORDS = records;
        attMergeLocalPending();
        // Re-render nếu trang đang active
        const page = document.getElementById('page-attendance');
        if (page && !page.classList.contains('hidden')) {
          renderAttendance();
        }
        checkAttendanceReminder();
      },
      (err) => {
        console.warn('[ATT] Firebase listener error, using local cache:', err);
        // Fallback: dùng full cache nếu Firebase lỗi
        try {
          const cachedFull = JSON.parse(localStorage.getItem('viwork_attendance_full_cache') || '[]');
          if (cachedFull.length > 0) {
            ATTENDANCE_RECORDS = cachedFull;
            attMergeLocalPending(); // Merge pending local over full cache
          } else {
            const cached2 = attLoadLocal();
            if (cached2.length > 0) ATTENDANCE_RECORDS = cached2;
          }
        } catch(e) {
          const cached2 = attLoadLocal();
          if (cached2.length > 0) ATTENDANCE_RECORDS = cached2;
        }
        const page = document.getElementById('page-attendance');
        if (page && !page.classList.contains('hidden')) renderAttendance();
      }
    );
  } else {
    // Firebase chưa sẵn sàng — dùng localStorage
    ATTENDANCE_RECORDS = attLoadLocal();
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

// ============ GPS HELPERS ============

/** Tính khoảng cách giữa 2 tọa độ (metres) */
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/** Lấy vị trí GPS hiện tại */
function getCurrentGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Thiết bị không hỗ trợ GPS'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/** Kiểm tra GPS có trong phạm vi văn phòng không */
function isInOfficeRange(lat, lng) {
  const d = calcDistance(lat, lng, ATT_CONFIG.office.lat, ATT_CONFIG.office.lng);
  return { inRange: d <= ATT_CONFIG.office.radius, distance: Math.round(d) };
}

// ============ CHECK-IN (GPS văn phòng) ============
async function doCheckIn(isOnline, gpsData, viaQR) {
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

  let record;
  if (existing) {
    record = {
      ...existing,
      checkIn:    now,
      isOnline:   existing.remoteApproved ? true : !!isOnline,
      note:       (existing.note ? existing.note + ' | ' : '') + (viaQR ? 'QR check-in tại văn phòng' : ''),
      isLate,
      status:     'working',
      checkInMethod: viaQR ? 'qr' : (isOnline ? 'online' : 'manual'),
      gps:        gpsData || null,
    };
    const idx = ATTENDANCE_RECORDS.findIndex(r => r.id === existing.id);
    if (idx > -1) ATTENDANCE_RECORDS[idx] = record;
  } else {
    record = {
      id:         generateId('att'),
      userId:     user.id,
      userName:   user.name,
      date:       today,
      checkIn:    now,
      checkOut:   null,
      duration:   null,
      isOnline:   !!isOnline,
      note:       viaQR ? 'QR check-in tại văn phòng' : '',
      isLate,
      status:     'working',
      checkInMethod: viaQR ? 'qr' : (isOnline ? 'online' : 'manual'),
      gps:        gpsData || null,
    };
    ATTENDANCE_RECORDS.push(record);
  }

  // 2. Lưu vào localStorage làm backup (chống mất dữ liệu khi Firebase lỗi)
  attSaveLocal(record);

  // 3. Đẩy lên Firebase (Optimistic)
  if (window.fbSaveAttendance) {
    window.fbSaveAttendance(record).catch(e => {
      console.warn('[ATT] Firebase save failed, will retry on next sync:', e);
      showToast('⚠️ Chấm công đã ghi nhận cục bộ. Sẽ đồng bộ Cloud khi có kết nối.', 'info');
    });
  }

  let msg;
  if (viaQR)       msg = `✅ QR Check-in lúc ${formatTime(now)} — Tại văn phòng`;
  else if (isLate) msg = `🟡 Đã check-in lúc ${formatTime(now)} (Muộn ${ciMins - 8*60 - ATT_CONFIG.lateThreshold} phút)`;
  else             msg = `✅ Check-in lúc ${formatTime(now)}${isOnline ? ' — Online' : ' — Văn phòng' + (gpsData ? ` (±${Math.round(gpsData.acc||0)}m)` : '')}`;

  showToast(msg, isLate ? 'info' : 'success');
  renderAttendance();
}

/** Check-in văn phòng — xác minh vị trí GPS trước khi cho phép check-in */
async function checkInOffice() {
  const btn = document.getElementById('btnCheckIn');
  if (btn) { btn.disabled = true; btn.querySelector('small').textContent = 'Đang xác định GPS...'; }

  if (!navigator.geolocation) {
    showGpsUnavailableDialog();
    if (btn) { btn.disabled = false; btn.querySelector('small').textContent = 'Bấm để check-in'; }
    return;
  }

  showToast('📍 Đang xác định vị trí...', 'info');

  try {
    const gps = await getCurrentGPS(); // Dùng hàm đã có sẵn trong file
    const { inRange, distance } = isInOfficeRange(gps.lat, gps.lng);

    if (inRange) {
      await doCheckIn(false, gps, false);
    } else {
      showGpsOutOfRangeDialog(distance, gps);
    }
  } catch (err) {
    console.warn('[GPS] Geolocation error:', err);
    showGpsUnavailableDialog();
  } finally {
    if (btn) { btn.disabled = false; btn.querySelector('small').textContent = 'Bấm để check-in'; }
  }
}

/** Dialog khi o ngoai pham vi van phong */
function showGpsOutOfRangeDialog(distance, gps) {
  document.getElementById('gpsDialog')?.remove();
  const el = document.createElement('div');
  el.id = 'gpsDialog';
  el.className = 'modal-overlay';
  el.onclick = e => { if (e.target === el) el.remove(); };
  el.innerHTML = `
    <div class="modal-box" style="max-width:380px;text-align:center">
      <div class="modal-body" style="padding:28px 24px">
        <div style="font-size:42px;margin-bottom:12px">📍</div>
        <div style="font-weight:700;font-size:16px;margin-bottom:8px">Ngoài phạm vi văn phòng</div>
        <div style="font-size:13px;color:var(--c-text-2);margin-bottom:6px">
          Bạn đang cách văn phòng <strong style="color:#EF4444">${distance}m</strong><br>
          Phạm vi cho phép: <strong>±${ATT_CONFIG.office.radius}m</strong>
        </div>
        <div style="font-size:12px;color:var(--c-text-3);margin-bottom:20px">
          Nếu bạn đang ở văn phòng, GPS có thể chưa chính xác. Bạn có muốn tiếp tục không?
        </div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-cancel" onclick="document.getElementById('gpsDialog').remove()">Hủy</button>
          <button class="btn btn-save" onclick="document.getElementById('gpsDialog').remove(); doCheckIn(false, ${JSON.stringify(gps)}, false)">✔️ Xác nhận check-in</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(el);
}

/** Dialog khi GPS khong kha dung */
function showGpsUnavailableDialog() {
  document.getElementById('gpsDialog')?.remove();
  const el = document.createElement('div');
  el.id = 'gpsDialog';
  el.className = 'modal-overlay';
  el.onclick = e => { if (e.target === el) el.remove(); };
  el.innerHTML = `
    <div class="modal-box" style="max-width:360px;text-align:center">
      <div class="modal-body" style="padding:28px 24px">
        <div style="font-size:42px;margin-bottom:12px">🚧</div>
        <div style="font-weight:700;font-size:16px;margin-bottom:8px">Không xác định được GPS</div>
        <div style="font-size:13px;color:var(--c-text-2);margin-bottom:6px">
          Vui lòng bật GPS trên thiết bị và cấp quyền vị trí cho trình duyệt.
        </div>
        <div style="font-size:12px;color:var(--c-text-3);margin-bottom:20px">
          Hoặc sử dụng <strong>QR Check-in</strong> tại quầy lễ tân.
        </div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-cancel" onclick="document.getElementById('gpsDialog').remove()">Hủy</button>
          <button class="btn btn-save" onclick="document.getElementById('gpsDialog').remove(); doCheckIn(false, null, false)">Check-in không GPS</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(el);
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

  // 1. Cập nhật local state ngay lập tức
  const idx = ATTENDANCE_RECORDS.findIndex(r => r.id === record.id);
  if (idx > -1) ATTENDANCE_RECORDS[idx] = updated;

  // 2. Lưu localStorage backup
  attSaveLocal(updated);

  // 3. Đồng bộ nền lên Firebase (Optimistic UI)
  if (window.fbSaveAttendance) {
    window.fbSaveAttendance(updated).catch(e => {
      console.warn('[ATT] Firebase checkout save failed, will retry:', e);
      showToast('⚠️ Check-out đã ghi nhận cục bộ. Sẽ đồng bộ Cloud khi có kết nối.', 'info');
    });
  }

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
      <div class="page-actions" style="gap:8px">
        ${isAdminOrMgr ? `
          <button class="att-admin-qr-btn" onclick="openMonthlyReportModal()" style="background:#10B981;color:white;border:none" title="Xem bảng chấm công và tính lương">
            📊 Báo cáo Tháng
          </button>
          <button class="att-admin-qr-btn" onclick="openQrDisplayModal()" title="Sinh mã QR cho nhân viên quét">
            📋 Mã QR VP
          </button>
          <button class="att-admin-qr-btn" onclick="updateOfficeLocation()" title="Cập nhật tọa độ GPS văn phòng">
            📍 Cập nhật GPS VP
          </button>
        ` : ''}
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
          <button class="att-btn checkin-office" onclick="checkInOffice()" id="btnCheckIn">
            <span class="att-btn-icon">🏢</span>
            <span class="att-btn-text">
              <strong>Check-in Văn phòng</strong>
              <small>Bấm để check-in</small>
            </span>
          </button>
          <button class="att-btn checkin-qr" onclick="openQrScanModal()" id="btnCheckInQR">
            <span class="att-btn-icon">📷</span>
            <span class="att-btn-text">
              <strong>Quét mã QR</strong>
              <small>Check-in bằng mã QR tại VP</small>
            </span>
          </button>
          <button class="att-btn checkin-online ${remoteRec ? 'approved' : ''}" onclick="doCheckIn(true, null, false)" id="btnCheckInOnline">
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

// ============ BÁO CÁO TỔNG HỢP (ADMIN) ============
function openMonthlyReportModal(ym) {
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') return;
  const now = new Date();
  const yearMonth = ym || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  document.getElementById('monthlyReportModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'monthlyReportModal';
  modal.className = 'modal-overlay';
  modal.style.zIndex = '9999';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };

  modal.innerHTML = `
    <div class="modal-box" style="max-width:1200px;width:95vw;max-height:90vh;display:flex;flex-direction:column">
      <div class="modal-header">
        <h3>📊 Bảng Chấm Công & Tính Lương Tổng Hợp</h3>
        <div style="display:flex;gap:10px;align-items:center">
          <input type="month" id="reportMonthPicker" class="form-input" value="${yearMonth}" onchange="openMonthlyReportModal(this.value)" style="width:150px;padding:6px">
          <button class="btn btn-save" onclick="window.print()">🖨️ In / PDF</button>
          <button class="modal-close" onclick="document.getElementById('monthlyReportModal').remove()">✕</button>
        </div>
      </div>
      <div class="modal-body" style="flex:1;overflow:auto;padding:0">
        ${renderMonthlyReportTable(yearMonth)}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function renderMonthlyReportTable(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number);
  const users = getAppUsers();
  
  let rows = users.map(u => {
    // Attendance stats
    const records = getUserMonthRecords(u.id, y, m);
    const totalDays  = records.filter(r => r.checkIn).length;
    const lateDays   = records.filter(r => r.isLate).length;
    const leaveDays  = records.filter(r => r.isLeave).length;
    
    // Payroll stats (using existing hr.js function if available)
    let psHtml = '';
    if (typeof calcPayslip === 'function') {
      const ps = calcPayslip(u.id, yearMonth);
      if (ps) {
        psHtml = `
          <td style="text-align:center"><strong>${ps.kpiPct}%</strong></td>
          <td style="text-align:right">${fmtVND(ps.basePaid)}</td>
          <td style="text-align:right;color:#10B981">+${fmtVND(ps.kpiBonus + ps.excelBonus + ps.cvcBonus)}</td>
          <td style="text-align:right">+${fmtVND(ps.totalAllowance)}</td>
          <td style="text-align:right;color:#EF4444">${ps.tax > 0 ? '-' : ''}${fmtVND(ps.tax)}</td>
          <td style="text-align:right"><strong style="color:#10B981;font-size:15px">${fmtVND(ps.net)}</strong></td>
          <td style="text-align:center">
            <button class="btn-outline sm" onclick="openPayslip('${u.id}', '${yearMonth}')">📄 Xem</button>
          </td>
        `;
      } else {
        psHtml = `<td colspan="7" style="text-align:center;color:var(--c-text-3)">Chưa có dữ liệu lương</td>`;
      }
    } else {
        psHtml = `<td colspan="7" style="text-align:center;color:var(--c-text-3)">Mô-đun lương chưa tải</td>`;
    }

    return `
      <tr style="border-bottom:1px solid var(--c-border-subtle)">
        <td style="padding:10px">
          <div style="font-weight:600">${escHtml(u.name)}</div>
          <div style="font-size:11px;color:var(--c-text-3)">${escHtml(u.department||'')}</div>
        </td>
        <td style="text-align:center"><strong>${totalDays}</strong></td>
        <td style="text-align:center;${lateDays>0?'color:#F59E0B;font-weight:bold':''}">${lateDays}</td>
        <td style="text-align:center;${leaveDays>0?'color:#8B5CF6':''}">${leaveDays}</td>
        ${psHtml}
      </tr>
    `;
  }).join('');

  return `
    <table class="att-table" style="width:100%;white-space:nowrap;margin:0;border-collapse:collapse">
      <thead style="position:sticky;top:0;z-index:10;background:var(--c-surface)">
        <tr>
          <th rowspan="2" style="border-bottom:2px solid var(--c-border);text-align:left;padding:10px">Nhân sự</th>
          <th colspan="3" style="text-align:center;border-bottom:1px solid var(--c-border);border-left:1px solid var(--c-border-subtle)">Dữ liệu Chấm công</th>
          <th colspan="7" style="text-align:center;border-bottom:1px solid var(--c-border);border-left:1px solid var(--c-border-subtle)">Dữ liệu Lương & Thưởng</th>
        </tr>
        <tr>
          <th style="border-bottom:2px solid var(--c-border);border-left:1px solid var(--c-border-subtle);text-align:center">Công</th>
          <th style="border-bottom:2px solid var(--c-border);text-align:center">Muộn</th>
          <th style="border-bottom:2px solid var(--c-border);text-align:center">Nghỉ</th>
          <th style="border-bottom:2px solid var(--c-border);border-left:1px solid var(--c-border-subtle);text-align:center">KPI</th>
          <th style="border-bottom:2px solid var(--c-border);text-align:right">Lương cứng</th>
          <th style="border-bottom:2px solid var(--c-border);text-align:right">Thưởng</th>
          <th style="border-bottom:2px solid var(--c-border);text-align:right">Phụ cấp</th>
          <th style="border-bottom:2px solid var(--c-border);text-align:right">Khấu trừ</th>
          <th style="border-bottom:2px solid var(--c-border);text-align:right">Thực nhận</th>
          <th style="border-bottom:2px solid var(--c-border);text-align:center">Chi tiết</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="11" style="text-align:center;padding:20px">Không có dữ liệu</td></tr>'}
      </tbody>
    </table>
  `;
}

console.log('[⚡ VIWORK] Attendance module loaded!');
