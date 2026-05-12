/* ================================================
   VIWORK — QR Check-in Module
   - Admin: sinh mã QR in tại văn phòng
   - Nhân viên: quét QR để check-in
   ================================================ */

// Dung jsQR de scan QR tu camera
// Script jsQR duoc load tu CDN trong index.html

// ============ SINH MA QR (Admin) ============

/**
 * Tạo payload QR: chứa secret + ngày hôm nay (hết hạn sau 24h)
 * Format: VIWORK_OFFICE|2026-05-12|VIWORK_OFFICE_2026
 */
function generateQrPayload() {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  return `VIWORK_OFFICE|${dateKey}|${ATT_CONFIG.qrSecret}`;
}

/** Xác minh QR payload có hợp lệ không */
function verifyQrPayload(payload) {
  try {
    const parts = payload.split('|');
    if (parts.length !== 3) return false;
    if (parts[0] !== 'VIWORK_OFFICE') return false;
    if (parts[2] !== ATT_CONFIG.qrSecret) return false;
    // Kiểm tra ngày
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    return parts[1] === dateKey;
  } catch { return false; }
}

/** Mở modal hiển thị QR cho Admin in/hiển thị tại VP */
function openQrDisplayModal() {
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
    showToast('⚠️ Chỉ Admin/Manager mới có thể xem mã QR văn phòng!', 'error');
    return;
  }
  const payload = generateQrPayload();
  const today   = new Date();
  const dateStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;

  document.getElementById('qrDisplayModal')?.remove();
  const el = document.createElement('div');
  el.id = 'qrDisplayModal';
  el.className = 'modal-overlay';
  el.onclick = e => { if (e.target === el) el.remove(); };
  el.innerHTML = `
    <div class="modal-box" style="max-width:400px;text-align:center">
      <div class="modal-header">
        <h3>📋 Mã QR Check-in Văn phòng</h3>
        <button class="modal-close" onclick="document.getElementById('qrDisplayModal').remove()">✕</button>
      </div>
      <div class="modal-body" style="padding:20px">
        <div style="font-size:13px;color:var(--c-text-3);margin-bottom:12px">
          Ngày: <strong>${dateStr}</strong> · Hết hạn cuối ngày
        </div>
        <div id="qrCodeContainer" style="display:flex;justify-content:center;margin:16px 0">
          <canvas id="qrCanvas" width="220" height="220" style="border-radius:12px;border:4px solid var(--c-primary)"></canvas>
        </div>
        <div style="font-size:12px;color:var(--c-text-3);margin-bottom:16px">
          📌 Hiển thị mã này tại lễ tân hoặc in ra để nhân viên quét check-in
        </div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button class="btn btn-cancel" onclick="document.getElementById('qrDisplayModal').remove()">Đóng</button>
          <button class="btn btn-save" onclick="printQrCode()">🖨️ In mã QR</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(el);

  // Render QR sau khi modal xuất hiện
  setTimeout(() => renderQrCode(payload), 100);
}

/** Render QR lên canvas dùng thuật toán QR đơn giản (qrcode.js) */
function renderQrCode(text) {
  const canvas = document.getElementById('qrCanvas');
  if (!canvas) return;

  // Dung QRCode library neu co, fallback dung Google Charts API
  if (window.QRCode) {
    const container = document.getElementById('qrCodeContainer');
    container.innerHTML = '';
    new QRCode(container, {
      text,
      width: 220, height: 220,
      colorDark: '#1a1a1a', colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
    return;
  }

  // Fallback: hien thi qua image tu Google Charts
  const img = document.createElement('img');
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}&bgcolor=ffffff&color=1a1a1a&margin=10`;
  img.style.cssText = 'border-radius:12px;border:4px solid #5AB800;width:220px;height:220px';
  img.alt = 'QR Check-in';
  const container = document.getElementById('qrCodeContainer');
  container.innerHTML = '';
  container.appendChild(img);
}

function printQrCode() {
  window.print();
}

// ============ QUÉT QR (Nhân viên) ============

let _qrStream = null;
let _qrScanInterval = null;

/** Mở modal camera để quét QR */
function openQrScanModal() {
  const existing = getTodayRecord(currentUser?.id);
  if (existing?.checkIn) {
    showToast('⚠️ Bạn đã check-in hôm nay rồi!', 'error');
    return;
  }

  document.getElementById('qrScanModal')?.remove();
  const el = document.createElement('div');
  el.id = 'qrScanModal';
  el.className = 'modal-overlay';
  el.onclick = e => { if (e.target === el) closeQrScanModal(); };
  el.innerHTML = `
    <div class="modal-box" style="max-width:380px;text-align:center">
      <div class="modal-header">
        <h3>📷 Quét mã QR Check-in</h3>
        <button class="modal-close" onclick="closeQrScanModal()">✕</button>
      </div>
      <div class="modal-body" style="padding:16px 20px">
        <div style="position:relative;border-radius:14px;overflow:hidden;background:#000;margin-bottom:12px">
          <video id="qrVideo" style="width:100%;display:block;border-radius:14px" playsinline autoplay muted></video>
          <canvas id="qrVideoCanvas" style="display:none"></canvas>
          <!-- Khung ngắm -->
          <div style="position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center">
            <div style="width:160px;height:160px;border:3px solid #5AB800;border-radius:12px;box-shadow:0 0 0 2000px rgba(0,0,0,0.4)"></div>
          </div>
        </div>
        <div id="qrScanStatus" style="font-size:13px;color:var(--c-text-3);margin-bottom:12px">
          📍 Hướng camera vào mã QR tại văn phòng...
        </div>
        <button class="btn btn-cancel" style="width:100%" onclick="closeQrScanModal()">✕ Hủy</button>
      </div>
    </div>`;
  document.body.appendChild(el);

  startQrCamera();
}

async function startQrCamera() {
  try {
    _qrStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
    });
    const video = document.getElementById('qrVideo');
    if (video) {
      video.srcObject = _qrStream;
      video.play();
      // Bat dau scan sau khi camera san sang
      video.onloadedmetadata = () => startQrScan(video);
    }
  } catch(err) {
    console.warn('Camera error:', err);
    const status = document.getElementById('qrScanStatus');
    if (status) status.innerHTML = `
      <span style="color:#EF4444">❌ Không thể mở camera</span><br>
      <span style="font-size:12px">Vui lòng cấp quyền camera cho trình duyệt</span>`;
  }
}

function startQrScan(video) {
  const canvas = document.getElementById('qrVideoCanvas');
  if (!canvas || !window.jsQR) {
    // jsQR chua load — thu lai sau 500ms
    setTimeout(() => startQrScan(video), 500);
    return;
  }
  const ctx = canvas.getContext('2d');

  if (_qrScanInterval) clearInterval(_qrScanInterval);
  _qrScanInterval = setInterval(() => {
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code) {
      clearInterval(_qrScanInterval);
      handleQrResult(code.data);
    }
  }, 300);
}

function handleQrResult(payload) {
  closeQrScanModal();

  if (verifyQrPayload(payload)) {
    // QR hop le — check-in
    doCheckIn(false, null, true);
  } else {
    showToast('❌ Mã QR không hợp lệ hoặc đã hết hạn! Liên hệ Admin để lấy mã mới.', 'error');
  }
}

function closeQrScanModal() {
  if (_qrScanInterval) { clearInterval(_qrScanInterval); _qrScanInterval = null; }
  if (_qrStream) { _qrStream.getTracks().forEach(t => t.stop()); _qrStream = null; }
  document.getElementById('qrScanModal')?.remove();
}

// ============ ADMIN: CAI DAT TOA DO VP ============

/** Admin cập nhật tọa độ văn phòng bằng GPS thực */
async function updateOfficeLocation() {
  if (currentUser?.role !== 'admin') return;
  try {
    showToast('📍 Đang lấy vị trí hiện tại...', 'info');
    const gps = await getCurrentGPS();
    ATT_CONFIG.office.lat = gps.lat;
    ATT_CONFIG.office.lng = gps.lng;

    // Luu vao localStorage
    localStorage.setItem('viwork_office_location', JSON.stringify({
      lat: gps.lat, lng: gps.lng, updatedAt: new Date().toISOString()
    }));

    showToast(`✅ Đã cập nhật tọa độ văn phòng!\nLat: ${gps.lat.toFixed(6)}, Lng: ${gps.lng.toFixed(6)} (±${Math.round(gps.acc)}m)`, 'success');
  } catch(e) {
    showToast('❌ Không lấy được GPS. Vui lòng bật GPS và thử lại.', 'error');
  }
}

/** Load tọa độ đã lưu */
function loadOfficeLocation() {
  try {
    const saved = localStorage.getItem('viwork_office_location');
    if (saved) {
      const loc = JSON.parse(saved);
      ATT_CONFIG.office.lat = loc.lat;
      ATT_CONFIG.office.lng = loc.lng;
      console.log(`[VIWORK] Office GPS: ${loc.lat}, ${loc.lng}`);
    }
  } catch(e) {}
}

// Gọi khi app khởi động
loadOfficeLocation();

console.log('[⚡ VIWORK] QR Check-in Module loaded');
