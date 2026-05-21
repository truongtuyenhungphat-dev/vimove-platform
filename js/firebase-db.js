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
          return ref.set({ ...u, email });
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
    batch.set(db.collection('viwork_tasks').doc(t.id), t);
  }
  await batch.commit();
};

window.fbSaveTask = async (taskObj) => {
  return getDB().collection('viwork_tasks').doc(taskObj.id).set(taskObj);
};

window.fbDeleteTask = async (taskId) => {
  return getDB().collection('viwork_tasks').doc(taskId).delete();
};

// ============ VIWORK_LEADS ============
window.fbSeedLeads = async (leadsArray) => {
  const db = getDB();
  const batch = db.batch();
  for (const l of leadsArray) {
    batch.set(db.collection('viwork_leads').doc(l.id), l);
  }
  await batch.commit();
};

window.fbSaveLead = async (leadObj) => {
  return getDB().collection('viwork_leads').doc(leadObj.id).set(leadObj);
};

window.fbDeleteLead = async (leadId) => {
  return getDB().collection('viwork_leads').doc(leadId).delete();
};

// ============ VIWORK_USERS ============
window.fbSeedUsers = async (usersObj) => {
  const db = getDB();
  const batch = db.batch();
  for (const email in usersObj) {
    const docId = email.replace(/[@.]/g,'_');
    // Đảm bảo field 'email' có trong document để fbListenUsers đọc được
    batch.set(db.collection('viwork_users').doc(docId), { ...usersObj[email], email });
  }
  await batch.commit();
};

window.fbSaveUser = async (userObj) => {
  return getDB().collection('viwork_users').doc(userObj.email.replace(/[@.]/g,'_')).set(userObj);
};

window.fbDeleteUser = async (email) => {
  return getDB().collection('viwork_users').doc(email.replace(/[@.]/g,'_')).delete();
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
      await db.collection('viwork_config').doc('deleted_users').set({ ids: existing });
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
    batch.set(db.collection('viwork_requests').doc(r.id), r);
  }
  await batch.commit();
};

window.fbSaveRequest = async (reqObj) => {
  return getDB().collection('viwork_requests').doc(reqObj.id).set(reqObj);
};

window.fbDeleteRequest = async (reqId) => {
  return getDB().collection('viwork_requests').doc(reqId).delete();
};

// ============ VIWORK_ASSIGNMENTS ============
window.fbSeedAssignments = async (asgnArray) => {
  const db = getDB();
  const batch = db.batch();
  for (const a of asgnArray) {
    batch.set(db.collection('viwork_assignments').doc(a.id), a);
  }
  await batch.commit();
};

window.fbSaveAssignment = async (asgnObj) => {
  return getDB().collection('viwork_assignments').doc(asgnObj.id).set(asgnObj);
};

window.fbDeleteAssignment = async (asgnId) => {
  return getDB().collection('viwork_assignments').doc(asgnId).delete();
};

// ============ VIWORK_ATTENDANCE ============
window.fbSaveAttendance = async (record) => {
  return getDB().collection('viwork_attendance').doc(record.id).set(record);
};

window.fbDeleteAttendance = async (recordId) => {
  return getDB().collection('viwork_attendance').doc(recordId).delete();
};

window.fbSeedAttendance = async (arr) => {
  const db = getDB();
  const batch = db.batch();
  for (const r of arr) {
    batch.set(db.collection('viwork_attendance').doc(r.id), r);
  }
  await batch.commit();
};

window.fbListenAttendance = (callback, errorHandler) => {
  return getDB().collection('viwork_attendance').onSnapshot(
    snapshot => {
      const arr = [];
      snapshot.forEach(doc => arr.push(doc.data()));
      callback(arr);
    },
    err => {
      console.warn('[FB] viwork_attendance onSnapshot error:', err);
      if (errorHandler) errorHandler(err);
    }
  );
};

// ============ LISTENERS ============
window.fbListenTasks = (callback) => {
  return getDB().collection('viwork_tasks').onSnapshot(snapshot => {
    const arr = [];
    snapshot.forEach(doc => arr.push(doc.data()));
    callback(arr);
  });
};

window.fbListenLeads = (callback) => {
  return getDB().collection('viwork_leads').onSnapshot(snapshot => {
    const arr = [];
    snapshot.forEach(doc => arr.push(doc.data()));
    callback(arr);
  });
};

window.fbListenUsers = (callback) => {
  return getDB().collection('viwork_users').onSnapshot(snapshot => {
    const obj = {};
    snapshot.forEach(doc => { 
      // Dữ liệu trong document chứa email thực
      const data = doc.data();
      obj[data.email] = data; 
    });
    callback(obj);
  });
};

window.fbListenRequests = (callback) => {
  return getDB().collection('viwork_requests').onSnapshot(snapshot => {
    const arr = [];
    snapshot.forEach(doc => arr.push(doc.data()));
    callback(arr);
  });
};

window.fbListenAssignments = (callback) => {
  return getDB().collection('viwork_assignments').onSnapshot(snapshot => {
    const arr = [];
    snapshot.forEach(doc => arr.push(doc.data()));
    callback(arr);
  });
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
    await db.collection('viwork_users').doc(newId).set(data);
    // Delete old doc
    await db.collection('viwork_users').doc(oldId).delete();
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
  await db.collection('viwork_training').doc(docId).set({ ...enrollment, userId, courseId, updatedAt: new Date().toISOString() });
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
// ============ SYNC LOCAL TO FIREBASE ============
window.syncLocalToFirebase = async () => {
  if (typeof showToast === 'function') showToast('? �ang d?ng b? d? li?u l�n Cloud...', 'info');
  const db = getDB();
  if (!db) {
    if (typeof showToast === 'function') showToast('? Kh�ng k?t n?i du?c Firebase', 'error');
    return;
  }
  
  try {
    const promises = [];
    
    // Sync Tasks
    if (typeof appState !== 'undefined' && appState.tasks) {
      appState.tasks.forEach(t => {
        if (window.fbSaveTask) promises.push(window.fbSaveTask(t));
      });
    }
    // Sync Leads
    if (typeof appState !== 'undefined' && appState.leads) {
      appState.leads.forEach(l => {
        if (window.fbSaveLead) promises.push(window.fbSaveLead(l));
      });
    }
    // Sync Requests
    if (typeof appState !== 'undefined' && appState.requests) {
      appState.requests.forEach(r => {
        if (window.fbSaveRequest) promises.push(window.fbSaveRequest(r));
      });
    }
    // Sync Assignments
    if (typeof appState !== 'undefined' && appState.assignments) {
      appState.assignments.forEach(a => {
        if (window.fbSaveAssignment) promises.push(window.fbSaveAssignment(a));
      });
    }
    // Sync Attendance
    if (typeof ATTENDANCE_RECORDS !== 'undefined') {
      ATTENDANCE_RECORDS.forEach(a => {
        if (window.fbSaveAttendance) promises.push(window.fbSaveAttendance(a));
      });
    }
    // Sync Training Enrollments
    if (typeof TRAINING_ENROLLMENTS !== 'undefined') {
      for (const uid in TRAINING_ENROLLMENTS) {
        for (const cid in TRAINING_ENROLLMENTS[uid]) {
          if (window.fbSaveEnrollment) promises.push(window.fbSaveEnrollment(uid, cid, TRAINING_ENROLLMENTS[uid][cid]));
        }
      }
    }
    // Sync Users (from DEMO_USERS + viwork_users localStorage)
    try {
      const localUsers = JSON.parse(localStorage.getItem('viwork_users') || '[]');
      localUsers.forEach(u => {
        if (window.fbSaveUser && u.email) promises.push(window.fbSaveUser(u));
      });
    } catch(e) {}
    if (typeof DEMO_USERS !== 'undefined') {
      for (const email in DEMO_USERS) {
        if (window.fbSaveUser) promises.push(window.fbSaveUser(Object.assign({}, DEMO_USERS[email], { email })));
      }
    }

    await Promise.allSettled(promises);
    if (typeof showToast === 'function') showToast('? �� d?ng b? ' + promises.length + ' b?n ghi l�n Cloud!', 'success');
  } catch(e) {
    console.error(e);
    if (typeof showToast === 'function') showToast('? L?i khi d?ng b? d? li?u!', 'error');
  }
};

