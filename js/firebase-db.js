// Lấy instance DB chung
const getDB = () => window.firebaseDB;

// ============ VIWORK_TASKS ============
window.fbCheckAndSeed = async () => {
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
  const deletedIds = new Set(JSON.parse(localStorage.getItem('viwork_deleted_ids') || '[]'));
  const promises = [];
  for (const email in DEMO_USERS) {
    const u = DEMO_USERS[email];
    if (deletedIds.has(u.id)) continue;
    const docId = email.replace(/[@.]/g, '_');
    const ref   = db.collection('viwork_users').doc(docId);
    promises.push(
      ref.get().then(snap => {
        if (!snap.exists) {
          // Chua co — tao moi
          console.log(`[VIWORK] Seed missing user: ${u.name} (${email})`);
          return ref.set({ ...u, email });
        } else {
          // Da co — cap nhat password + thong tin chinh de tranh dung password cu sai
          const existing = snap.data();
          const needsUpdate =
            existing.password !== u.password ||
            existing.name !== u.name ||
            existing.role !== u.role;
          if (needsUpdate) {
            console.log(`[VIWORK] Fix user data: ${u.name} (${email})`);
            return ref.update({
              password: u.password,
              name: u.name,
              role: u.role,
              department: u.department,
              avatar: u.avatar,
              id: u.id,
              email,
            });
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

window.fbListenAttendance = (callback) => {
  return getDB().collection('viwork_attendance').onSnapshot(snapshot => {
    const arr = [];
    snapshot.forEach(doc => arr.push(doc.data()));
    callback(arr);
  });
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
