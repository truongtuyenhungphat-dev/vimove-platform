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
    console.log('[⚡ VIWORK] Đã đẩy Data gốc lên Cloud thành công!');
  }
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
    batch.set(db.collection('viwork_users').doc(email.replace(/[@.]/g,'_')), usersObj[email]);
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

console.log('[⚡ VIWORK] Firebase Database Services (Compat) loaded!');
