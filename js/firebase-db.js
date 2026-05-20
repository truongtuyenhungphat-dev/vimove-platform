// Lấy instance DB chung
const getDB = () => window.firebaseDB;

// ============ VIWORK_TASKS ============
window.fbCheckAndSeed = async () => {
  // First, sync any remaining .vn emails to .net across devices.
  await window.fbSyncEmailDomains?.();
  const db = getDB();
  const snap = await db.collection('viwork_users').limit(1).get();
  if (snap.empty) {
    console.log('[⚡ VIWORK] Khởi tạo hạt giống (Seed Data) lên Cloud...');
    await window.fbSeedUsers(DEMO_USERS);
    await window.fbSeedTasks(INITIAL_TASKS);
    await window.fbSeedLeads(INITIAL_LEADS);
    if(typeof INITIAL_REQUESTS !== 'undefined') await window.fbSeedRequests(INITIAL_REQUESTS);
    if(typeof INITIAL_ASSIGNMENTS !== 'undefined') await window.fbSeedAssignments(INITIAL_ASSIGNMENTS);
    console.log('[⚡ VIWORK] Đã đẩy Data gốc lên Cloud thành công!');
  } else {
    // Collection có data rồi — chỉ bổ sung những user còn thiếu
    await window.fbEnsureAllUsers();
  }
};

/**
 * Đảm bảo tất cả hardcoded users đều có mặt trên Firebase.
 * Chỉ seed những user chưa tồn tại, không ghi đè user đã có.
 */
window.fbEnsureAllUsers = async () => {
  const db = getDB();
  // Dung _deletedUserIds global (da load tu Firestore truoc); fallback localStorage
  const deletedIds = (typeof _deletedUserIds !== 'undefined' && _deletedUserIds.size > 0)
    ? _deletedUserIds
    : new Set(JSON.parse(localStorage.getItem('viwork_deleted_ids') || '[]'));

  const promises = [];
  for (const email in DEMO_USERS) {
    const u = DEMO_USERS[email];
    if (deletedIds.has(u.id)) continue; // Da bi xoa — KHONG seed lai
    const docId = email.replace(/[@.]/g, '_');
    const ref   = db.collection('viwork_users').doc(docId);
    promises.push(
      ref.get().then(snap => {
        if (!snap.exists) {
          console.log(`[VIWORK] Seed missing user: ${u.name} (${email})`);
          return ref.catch(e => console.warn('[FB Set]', e));
        } else {
          const existing = snap.data();
          if (existing.password !== u.password || existing.name !== u.name || existing.role !== u.role) {
            return ref.update({ password: u.password, name: u.name, role: u.role,
              department: u.department, avatar: u.avatar, id: u.id, email });
          }
        }
      })
    );
  }
  await Promise.all(promises);
};
window.fbSeedTasks = async (tasksArray) => {
  const db = getDB();
  const batch = db.batch();
  for (const t of tasksArray) {
    batch.catch(e => console.warn('[FB Set]', e));
  }
  await batch.commit();
};

window.fbSaveTask = async (taskObj) => {
  return getDB().collection('viwork_tasks').doc(taskObj.id).catch(e => console.warn('[FB Set]', e));
};

window.fbDeleteTask = async (taskId) => {
  return getDB().collection('viwork_tasks').doc(taskId).catch(e => console.warn('[FB Delete]', e));
};

// ============ VIWORK_LEADS ============
window.fbSeedLeads = async (leadsArray) => {
  const db = getDB();
  const batch = db.batch();
  for (const l of leadsArray) {
    batch.catch(e => console.warn('[FB Set]', e));
  }
  await batch.commit();
};

window.fbSaveLead = async (leadObj) => {
  return getDB().collection('viwork_leads').doc(leadObj.id).catch(e => console.warn('[FB Set]', e));
};

window.fbDeleteLead = async (leadId) => {
  return getDB().collection('viwork_leads').doc(leadId).catch(e => console.warn('[FB Delete]', e));
};

// ============ VIWORK_USERS ============
window.fbSeedUsers = async (usersObj) => {
  const db = getDB();
  const batch = db.batch();
  for (const email in usersObj) {
    const docId = email.replace(/[@.]/g,'_');
    // Đảm bảo field 'email' có trong document để fbListenUsers đọc được
    batch.catch(e => console.warn('[FB Set]', e));
  }
  await batch.commit();
};

window.fbSaveUser = async (userObj) => {
  return getDB().collection('viwork_users').doc(userObj.email.replace(/[@.]/g,'_')).catch(e => console.warn('[FB Set]', e));
};

window.fbDeleteUser = async (email) => {
  return getDB().collection('viwork_users').doc(email.replace(/[@.]/g,'_')).catch(e => console.warn('[FB Delete]', e));
};

/**
 * Ghi userId vào Firestore viwork_config/deleted_users
 * để tất cả máy khác biết và xóa user đó khỏi local state.
 */
window.fbMarkUserDeleted = async (userId) => {
  const db = getDB();
  if (!db) return;
  try {
    await db.collection('viwork_config').doc('deleted_users').set(
      { ids: firebase.firestore.FieldValue.arrayUnion(userId) },
      { merge: true }
    );
    console.log('[VIWORK] Marked deleted on cloud:', userId);
  } catch(e) {
    // Fallback nếu FieldValue chưa load: dùng get + set
    try {
      const snap = await db.collection('viwork_config').doc('deleted_users').get();
      const existing = snap.exists ? (snap.data().ids || []) : [];
      if (!existing.includes(userId)) existing.push(userId);
      await db.collection('viwork_config').doc('deleted_users').catch(e => console.warn('[FB Set]', e));
    } catch(e2) { console.warn('[fbMarkUserDeleted]', e2); }
  }
};

/**
 * Lắng nghe Firestore deleted_users — khi có máy khác xóa user,
 * tự động xóa user đó khỏi TEAM_MEMBERS + DEMO_USERS trên máy này.
 */
window.fbListenDeletedUsers = () => {
  const db = getDB();
  if (!db) return;
  db.collection('viwork_config').doc('deleted_users').onSnapshot(snap => {
    if (!snap.exists) return;
    const ids = snap.data()?.ids || [];
    if (ids.length === 0) return;

    let changed = false;
    ids.forEach(userId => {
      // Aggiorna il set globale
      if (typeof _deletedUserIds !== 'undefined') _deletedUserIds.add(userId);

      // Xoa khoi TEAM_MEMBERS
      const idx = TEAM_MEMBERS.findIndex(m => m.id === userId);
      if (idx > -1) { TEAM_MEMBERS.splice(idx, 1); changed = true; }

      // Xoa khoi DEMO_USERS
      Object.keys(DEMO_USERS).forEach(em => {
        if (DEMO_USERS[em]?.id === userId) { delete DEMO_USERS[em]; changed = true; }
      });

      // Luu vao localStorage
      try {
        const local = JSON.parse(localStorage.getItem('viwork_deleted_ids') || '[]');
        if (!local.includes(userId)) {
          local.push(userId);
          localStorage.setItem('viwork_deleted_ids', JSON.stringify(local));
        }
      } catch(e) {}
    });

    if (changed) {
      try { if (typeof renderTeamPage === 'function') renderTeamPage(); } catch(e) {}
      try { if (typeof renderTeam === 'function') renderTeam(); } catch(e) {}
      try { if (typeof renderUserManager === 'function') renderUserManager(); } catch(e) {}
      console.log('[VIWORK] Cross-device delete applied:', ids);
    }
  }, err => console.warn('[fbListenDeletedUsers]', err));
};

// ============ VIWORK_REQUESTS ============
window.fbSeedRequests = async (reqArray) => {
  const db = getDB();
  const batch = db.batch();
  for (const r of reqArray) {
    batch.catch(e => console.warn('[FB Set]', e));
  }
  await batch.commit();
};

window.fbSaveRequest = async (reqObj) => {
  return getDB().collection('viwork_requests').doc(reqObj.id).catch(e => console.warn('[FB Set]', e));
};

window.fbDeleteRequest = async (reqId) => {
  return getDB().collection('viwork_requests').doc(reqId).catch(e => console.warn('[FB Delete]', e));
};

// ============ VIWORK_ASSIGNMENTS ============
window.fbSeedAssignments = async (asgnArray) => {
  const db = getDB();
  const batch = db.batch();
  for (const a of asgnArray) {
    batch.catch(e => console.warn('[FB Set]', e));
  }
  await batch.commit();
};

window.fbSaveAssignment = async (asgnObj) => {
  return getDB().collection('viwork_assignments').doc(asgnObj.id).catch(e => console.warn('[FB Set]', e));
};

window.fbDeleteAssignment = async (asgnId) => {
  return getDB().collection('viwork_assignments').doc(asgnId).catch(e => console.warn('[FB Delete]', e));
};

// ============ VIWORK_ATTENDANCE ============
window.fbSaveAttendance = async (record) => {
  return getDB().collection('viwork_attendance').doc(record.id).catch(e => console.warn('[FB Set]', e));
};

window.fbDeleteAttendance = async (recordId) => {
  return getDB().collection('viwork_attendance').doc(recordId).catch(e => console.warn('[FB Delete]', e));
};

window.fbSeedAttendance = async (arr) => {
  const db = getDB();
  const batch = db.batch();
  for (const r of arr) {
    batch.catch(e => console.warn('[FB Set]', e));
  }
  await batch.commit();
};

window.fbListenAttendance = (callback) => {
  return getDB().collection('viwork_attendance'), err => console.warn('[FB Listen]', err));
};

// ============ LISTENERS ============
window.fbListenTasks = (callback) => {
  return getDB().collection('viwork_tasks'), err => console.warn('[FB Listen]', err));
};

window.fbListenLeads = (callback) => {
  return getDB().collection('viwork_leads'), err => console.warn('[FB Listen]', err));
};

window.fbListenUsers = (callback) => {
  return getDB().collection('viwork_users'), err => console.warn('[FB Listen]', err));
    callback(obj);
  });
};

window.fbListenRequests = (callback) => {
  return getDB().collection('viwork_requests'), err => console.warn('[FB Listen]', err));
};

window.fbListenAssignments = (callback) => {
  return getDB().collection('viwork_assignments'), err => console.warn('[FB Listen]', err));
};

console.log('[⚡ VIWORK] Firebase Database Services (Compat) loaded — incl. Attendance!');

// -------------------------------------------------
// ==== EMAIL DOMAIN SYNC (vimove.vn -> vimove.net) ====
// -------------------------------------------------
// Renames a user document in Firestore when the email domain changes.
// Uses the same document ID scheme: replace @ and . with '_' .
window.fbRenameUser = async (oldEmail, newEmail) => {
  const db = getDB();
  if (!db) return;
  const oldId = oldEmail.replace(/[@.]/g, '_');
  const newId = newEmail.replace(/[@.]/g, '_');
  try {
    const oldDoc = await db.collection('viwork_users').doc(oldId).get();
    if (!oldDoc.exists) return;
    const data = oldDoc.data();
    // Preserve email field
    data.email = newEmail;
    // Write new doc
    await db.collection('viwork_users').doc(newId).catch(e => console.warn('[FB Set]', e));
    // Delete old doc
    await db.collection('viwork_users').doc(oldId).catch(e => console.warn('[FB Delete]', e));
    console.log(`[VIWORK] Renamed user ${oldEmail} → ${newEmail}`);
  } catch (e) {
    console.warn('[fbRenameUser]', e);
  }
};

// Scan local DEMO_USERS for outdated .vn emails and rename them in Firestore.
window.fbSyncEmailDomains = async () => {
  const db = getDB();
  if (!db) return;
  const promises = [];
  for (const email in DEMO_USERS) {
    if (email.endsWith('@vimove.vn')) {
      const newEmail = email.replace('@vimove.vn', '@vimove.net');
      promises.push(window.fbRenameUser(email, newEmail));
      // Update local structures immediately
      const user = DEMO_USERS[email];
      delete DEMO_USERS[email];
      DEMO_USERS[newEmail] = { ...user, email: newEmail };
    }
  }
  await Promise.all(promises);
  // Refresh UI after rename
  if (typeof renderUserManager === 'function') renderUserManager();
  if (typeof renderTeamPage === 'function') renderTeamPage();
};

// ============ TRAINING ENROLLMENTS ============
window.fbSaveEnrollment = async (userId, courseId, enrollment) => {
  const db = getDB(); if (!db) return;
  const docId = `${userId}_${courseId}`;
  await db.collection('viwork_training').doc(docId).catch(e => console.warn('[FB Set]', e));
};

window.fbListenTraining = (userId, callback) => {
  const db = getDB(); if (!db) return;
  return db.collection('viwork_training')
    .where('userId','==', userId)
    .onSnapshot(snap => {
      const enrollments = {};
      snap.forEach(doc => {
        const d = doc.data();
        if (!enrollments[d.courseId]) enrollments[d.courseId] = d;
      });
      callback(enrollments);
    });
};