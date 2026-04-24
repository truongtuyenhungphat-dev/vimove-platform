const firebaseConfig = {
  apiKey: "AIzaSyBpJ512Nbq4rkNlMItbV8opOY4i15EwtyI",
  authDomain: "vimove-platform.firebaseapp.com",
  projectId: "vimove-platform",
  storageBucket: "vimove-platform.firebasestorage.app",
  messagingSenderId: "296976232296",
  appId: "1:296976232296:web:58e2ca622b9535bfd5b0dd"
};

// Khởi tạo Firebase (Sử dụng Compat layer để dùng biến firebase toàn cục)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Xuất db ra toàn cục
window.firebaseDB = db;
console.log('[⚡ VIWORK] Firebase v10 Compat đã khởi tạo và liên kết thành công!');
