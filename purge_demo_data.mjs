/**
 * Xóa toàn bộ data demo trên Firebase Firestore
 * Giữ nguyên: viwork_users (tài khoản)
 * Xóa sạch: viwork_tasks, viwork_leads, viwork_assignments, viwork_requests
 *
 * Chạy: node purge_demo_data.mjs
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';

const PROJECT_ID = 'vimove-platform';
const API_KEY    = 'AIzaSyBpJ512Nbq4rkNlMItbV8opOY4i15EwtyI';

const COLLECTIONS_TO_DELETE = [
  'viwork_tasks',
  'viwork_leads',
  'viwork_assignments',
  'viwork_requests',
];

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function listDocs(collection) {
  const url = `${BASE_URL}/${collection}?key=${API_KEY}&pageSize=300`;
  const res  = await fetch(url);
  const json = await res.json();
  return json.documents || [];
}

async function deleteDoc(name) {
  const url = `https://firestore.googleapis.com/v1/${name}?key=${API_KEY}`;
  const res  = await fetch(url, { method: 'DELETE' });
  return res.ok;
}

async function main() {
  console.log('🗑️  Bắt đầu xóa data demo khỏi Firebase...\n');

  for (const col of COLLECTIONS_TO_DELETE) {
    process.stdout.write(`📂 Collection: ${col} ... `);
    const docs = await listDocs(col);
    if (docs.length === 0) {
      console.log('✅ Đã trống');
      continue;
    }
    let deleted = 0;
    for (const doc of docs) {
      const ok = await deleteDoc(doc.name);
      if (ok) deleted++;
    }
    console.log(`🗑️  Đã xóa ${deleted}/${docs.length} documents`);
  }

  console.log('\n✅ Xong! Tài khoản (viwork_users) được giữ nguyên.');
  console.log('👉 Reload app để bắt đầu nhập data thật.');
}

main().catch(console.error);
