// Lấy instance DB chung
const getDB = () => window.firebaseDB;

// ============ PURGE PERMANENTLY DELETED ACCOUNTS ============
// Danh sach tai khoan bi xoa vinh vien (khong the phuc hoi)
const PURGED_ACCOUNTS = [
  { email: 'duc@vimove.net', id: 'u004' },
];

window.fbPurgeDeletedAccounts = async () => {
  const db = getDB();
  if (!db) return;
  for (const acc of PURGED_ACCOUNTS) {
    const docId = acc.email.replace(/[@.]/g, '_');
    try {
      await db.collection('viwork_users').doc(docId).delete();
      // Ghi vao deleted_users config de tat ca thiet bi nhan biet
      await db.collection('viwork_config').doc('deleted_users').set(
        { ids: window.firebase?.firestore?.FieldValue?.arrayUnion?.(acc.id) || [acc.id] },
        { merge: true }
      );
    } catch(e) { /* doc khong ton tai thi bo qua */ }
  }
};

// ============ VIWORK_TASKS ============
window.fbCheckAndSeed = async () => {
  // Xoa cac tai khoan bi purge truoc tien
  await window.fbPurgeDeletedAccounts();
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
  return getDB().collection('viwork_tasks').doc(taskObj.id).set(taskObj, { merge: true });
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
  return getDB().collection('viwork_leads').doc(leadObj.id).set(leadObj, { merge: true });
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
  return getDB().collection('viwork_users').doc(userObj.email.replace(/[@.]/g,'_')).set(userObj, { merge: true });
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
  return getDB().collection('viwork_requests').doc(reqObj.id).set(reqObj, { merge: true });
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
  return getDB().collection('viwork_assignments').doc(asgnObj.id).set(asgnObj, { merge: true });
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

window.fbCleanupAttendanceDuplicates = async (records) => {
  const db = getDB();
  if (!db) return records;
  const map = {};
  const toDelete = [];
  const validRecords = [];

  records.forEach(r => {
    // Nếu r không có id (dữ liệu lỗi cũ), bỏ qua không đưa vào map hay validRecords
    const recordId = r.id;
    if (!recordId) {
      console.warn('[ATT] Found record without ID, skipping:', r);
      return; 
    }

    const key = r.userId + '_' + r.date;
    if (!map[key]) {
      map[key] = r;
      validRecords.push(r);
    } else {
      const existing = map[key];
      if (r.checkIn && !existing.checkIn) {
        toDelete.push(existing.id);
        Object.assign(existing, r); // Update in place to keep the reference in validRecords
      } else if (!r.checkIn && existing.checkIn) {
        toDelete.push(recordId);
      } else {
        toDelete.push(recordId);
      }
    }
  });

  if (toDelete.length > 0) {
    console.log('[ATT] Found duplicates, cleaning up...', toDelete);
    try {
      const batch = db.batch();
      toDelete.forEach(id => {
        if (id) batch.delete(db.collection('viwork_attendance').doc(id));
      });
      await batch.commit();
      console.log('[ATT] Cleaned up ' + toDelete.length + ' duplicates');
    } catch (e) {
      console.warn('[ATT] Failed to cleanup duplicates', e);
    }
  }
  return validRecords;
};

window.fbListenAttendance = (callback, errorHandler) => {
  return getDB().collection('viwork_attendance').onSnapshot(
    async snapshot => {
      try {
        const arr = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (!data.id) data.id = doc.id; // Fallback nếu trong document thiếu trường id
          arr.push(data);
        });
        const cleanedArr = await window.fbCleanupAttendanceDuplicates(arr);
        // Cache FULL history to localStorage for offline fallback
        try { localStorage.setItem('viwork_attendance_full_cache', JSON.stringify(cleanedArr)); } catch(e) {}
        callback(cleanedArr);
      } catch (err) {
        console.error('[ATT] Error processing snapshot:', err);
        // Fallback: send the raw array if cleanup fails so UI doesn't break
        const raw = [];
        snapshot.forEach(doc => raw.push(doc.data()));
        try { localStorage.setItem('viwork_attendance_full_cache', JSON.stringify(raw)); } catch(e) {}
        callback(raw);
      }
    },
    err => {
      console.warn('[FB] viwork_attendance onSnapshot error:', err);
      if (errorHandler) errorHandler(err);
    }
  );
};

// ============ LISTENERS ============
window.fbListenTasks = (callback) => {
  return getDB().collection('viwork_tasks').onSnapshot(
    snapshot => {
    const arr = [];
    snapshot.forEach(doc => arr.push(doc.data()));
    callback(arr);
  },
    err => console.warn('[FB] onSnapshot error:', err)
  );
};

window.fbListenLeads = (callback) => {
  return getDB().collection('viwork_leads').onSnapshot(
    snapshot => {
    const arr = [];
    snapshot.forEach(doc => arr.push(doc.data()));
    callback(arr);
  },
    err => console.warn('[FB] onSnapshot error:', err)
  );
};

window.fbListenUsers = (callback) => {
  return getDB().collection('viwork_users').onSnapshot(
    snapshot => {
      const obj = {};
      snapshot.forEach(doc => {
        // Dữ liệu trong document chứa email thực
        const data = doc.data();
        if (data && data.email) obj[data.email] = data;
      });
      callback(obj);
    },
    err => console.warn('[FB] fbListenUsers onSnapshot error:', err)
  );
};

window.fbListenRequests = (callback) => {
  return getDB().collection('viwork_requests').onSnapshot(
    snapshot => {
    const arr = [];
    snapshot.forEach(doc => arr.push(doc.data()));
    callback(arr);
  },
    err => console.warn('[FB] onSnapshot error:', err)
  );
};

window.fbListenAssignments = (callback) => {
  return getDB().collection('viwork_assignments').onSnapshot(
    snapshot => {
    const arr = [];
    snapshot.forEach(doc => arr.push(doc.data()));
    callback(arr);
  },
    err => console.warn('[FB] onSnapshot error:', err)
  );
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
// ============ TRAINING COURSES ============
window.fbSaveCourse = async (course) => {
  const db = getDB(); if (!db) return;
  await db.collection('viwork_courses').doc(course.id).set(course, { merge: true });
};

window.fbDeleteCourse = async (courseId) => {
  const db = getDB(); if (!db) return;
  await db.collection('viwork_courses').doc(courseId).delete();
};

window.fbLoadCourses = async () => {
  const db = getDB(); if (!db) return null;
  try {
    const snap = await db.collection('viwork_courses').get();
    if (snap.empty) return null;
    const courses = [];
    snap.forEach(doc => courses.push(doc.data()));
    return courses;
  } catch(e) {
    console.warn('[FB] fbLoadCourses error:', e);
    return null;
  }
};

window.fbListenCourses = (callback) => {
  const db = getDB(); if (!db) return;
  return db.collection('viwork_courses').onSnapshot(
    snap => {
      const courses = [];
      snap.forEach(doc => courses.push(doc.data()));
      callback(courses);
    },
    err => console.warn('[FB] fbListenCourses error:', err)
  );
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

