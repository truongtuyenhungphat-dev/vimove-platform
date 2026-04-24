/* ================================================
   VIWORK — Data Store (Mock database)
   Simulates Firebase Firestore data locally
   ================================================ */

// ============ CONFIG ============
const APP_CONFIG = {
  companyName: 'Vimove',
  revenueTarget: 150,
  opMonths: 17,
  startDate: new Date('2025-01-01'),
  version: '2.0.0'
};

// Tăng số này mỗi khi muốn xóa data cũ trong browser
const DATA_VERSION = 'viwork_v2.4';

// ============ STAGES (Giai đoạn luồng CVC) ============
const STAGES = [
  { id: 'idea',       name: 'Lên kế hoạch',   color: '#94A3B8', icon: '💡', order: 0 },
  { id: 'inprogress', name: 'Đang triển khai', color: '#3B82F6', icon: '⚡', order: 1 },
  { id: 'review',     name: 'Chờ duyệt',       color: '#F59E0B', icon: '👁', order: 2 },
  { id: 'blocked',    name: 'Bị chặn',         color: '#EF4444', icon: '🔴', order: 3 },
  { id: 'done',       name: 'Hoàn thành',      color: '#10B981', icon: '✅', order: 4 },
];

// ============ CATEGORIES ============
const CATEGORIES = {
  sales:     { name: 'Bán hàng',  icon: '🛒', cssClass: 'cat-sales'     },
  marketing: { name: 'Marketing', icon: '📣', cssClass: 'cat-marketing' },
  ops:       { name: 'Vận hành',  icon: '⚙️', cssClass: 'cat-ops'       },
  hr:        { name: 'Nhân sự',   icon: '👥', cssClass: 'cat-hr'        },
  finance:   { name: 'Tài chính', icon: '💰', cssClass: 'cat-finance'   },
};

// ============ PRIORITY ============
const PRIORITIES = {
  low:    { name: 'Thấp',       color: '#10B981', icon: '🟢' },
  medium: { name: 'Trung bình', color: '#F59E0B', icon: '🟡' },
  high:   { name: 'Cao',        color: '#EF4444', icon: '🔴' },
  urgent: { name: 'Khẩn cấp',   color: '#DC2626', icon: '🚨' },
};

// ============ CHANNELS ============
const CHANNELS = {
  facebook:  { name: 'Facebook',  icon: '📘', cssClass: 'ch-facebook'  },
  zalo:      { name: 'Zalo',      icon: '💬', cssClass: 'ch-zalo'      },
  tiktok:    { name: 'TikTok',    icon: '🎵', cssClass: 'ch-tiktok'    },
  instagram: { name: 'Instagram', icon: '📸', cssClass: 'ch-instagram' },
  shopee:    { name: 'Shopee',    icon: '🛍️', cssClass: 'ch-shopee'    },
  referral:  { name: 'Giới thiệu',icon: '🤝', cssClass: 'ch-referral'  },
};

// ============ DEMO ACCOUNTS ============
/* ========================================================
   DEMO USERS — Nhân viên thật Vimove (v2.2)
   Primary Admin: ngan@vimove.vn / ngan123  (⇒ Phê duyệt, quản trị)
   Tech Admin:    tuyen@vimove.vn / tuyen123 (⇒ Hỗ trợ kỹ thuật)
   ======================================================== */
const DEMO_USERS = {
  // ===== PRIMARY ADMIN — Phê duyệt & Quản trị =====
  'ngan@vimove.vn': {
    id: 'u002', name: 'Nguyễn Thị Thanh Ngân', role: 'admin',
    password: 'ngan123', avatar: 'NTN',
    department: 'Quản trị & Phê duyệt'
  },
  // ===== TECH ADMIN — Hỗ trợ kỹ thuật =====
  'tuyen@vimove.vn': {
    id: 'u001', name: 'Trương Ngọc Tuyền', role: 'admin',
    password: 'tuyen123', avatar: 'TNT',
    department: 'Digital & Hỗ trợ kỹ thuật'
  },
  // ===== MANAGER =====
  'trang@vimove.vn': {
    id: 'u003', name: 'Nguyễn Thị Quỳnh Trang', role: 'manager',
    password: 'trang123', avatar: 'NQT',
    department: 'HR & MKT & Sale'
  },
  // ===== STAFF =====
  'duc@vimove.vn': {
    id: 'u004', name: 'Dương Minh Đức', role: 'staff',
    password: 'duc123', avatar: 'DMD',
    department: 'Digital'
  },
  'phuong@vimove.vn': {
    id: 'u005', name: 'Hoàng Quỳnh Phương', role: 'manager',
    password: 'phuong123', avatar: 'HQP',
    department: 'Content Lead'
  },
  'dung.tx@vimove.vn': {
    id: 'u006', name: 'Trương Xuân Dũng', role: 'manager',
    password: 'dung123', avatar: 'TXD',
    department: 'Lead Sản phẩm'
  },
  'hanh@vimove.vn': {
    id: 'u007', name: 'Vũ Phương Hạnh', role: 'manager',
    password: 'hanh123', avatar: 'VPH',
    department: 'Lead Sản phẩm'
  },
  'loi@vimove.vn': {
    id: 'u008', name: 'Nguyễn Văn Lợi', role: 'staff',
    password: 'loi123', avatar: 'NVL',
    department: 'Kênh cá nhân'
  },
  'ngan.le@vimove.vn': {
    id: 'u009', name: 'Lê Thị Ngân', role: 'staff',
    password: 'nganle123', avatar: 'LTN',
    department: 'Content'
  },
  'thai@vimove.vn': {
    id: 'u010', name: 'Lê Thị Anh Thái', role: 'staff',
    password: 'thai123', avatar: 'LTAT',
    department: 'Content'
  },
  'mai@vimove.vn': {
    id: 'u011', name: 'Phạm Thanh Mai', role: 'staff',
    password: 'mai123', avatar: 'PTM',
    department: 'Thiết kế'
  },
  'dung.kt@vimove.vn': {
    id: 'u012', name: 'Khuất Thị Dung', role: 'staff',
    password: 'dung456', avatar: 'KTD',
    department: 'Thiết kế'
  },
  // ===== Legacy quick-login aliases =====
  'admin@vimove.vn':   { id: 'u002', name: 'Nguyễn Thị Thanh Ngân',  role: 'admin',   password: 'admin123',   avatar: 'NTN',  department: 'Quản trị & Phê duyệt' },
  'manager@vimove.vn': { id: 'u001', name: 'Trương Ngọc Tuyền',      role: 'admin',   password: 'manager123', avatar: 'TNT',  department: 'Digital & Hỗ trợ kỹ thuật' },
  'staff@vimove.vn':   { id: 'u003', name: 'Nguyễn Thị Quỳnh Trang', role: 'manager', password: 'staff123',   avatar: 'NQT',  department: 'HR & MKT & Sale' },
};

/* ========================================================
   TEAM MEMBERS — Danh sách đội ngũ Vimove 2026
   TNA: Inhouse 8 người + Team mới 11 người
   ======================================================== */
const TEAM_MEMBERS = [
  // BAN LÃNH ĐẠO
  { id: 'u002', name: 'Nguyễn Thị Thanh Ngân',  role: 'admin',   avatar: 'NTN',  department: 'Quản trị & Phê duyệt',      kpi: 100, revenue: 0, tasks: 0 },
  { id: 'u001', name: 'Trương Ngọc Tuyền',      role: 'admin',   avatar: 'TNT',  department: 'Digital & Hỗ trợ kỹ thuật', kpi: 95,  revenue: 0, tasks: 0 },
  // HR MKT SALE
  { id: 'u003', name: 'Nguyễn Thị Quỳnh Trang', role: 'manager', avatar: 'NQT',  department: 'HR & MKT & Sale',           kpi: 85,  revenue: 0, tasks: 0 },
  // DIGITAL
  { id: 'u004', name: 'Dương Minh Đức',          role: 'staff',   avatar: 'DMD',  department: 'Digital',                   kpi: 78,  revenue: 0, tasks: 0 },
  // CONTENT
  { id: 'u005', name: 'Hoàng Quỳnh Phương',      role: 'manager', avatar: 'HQP',  department: 'Lead Content',              kpi: 88,  revenue: 0, tasks: 0 },
  { id: 'u009', name: 'Lê Thị Ngân',             role: 'staff',   avatar: 'LTN',  department: 'Content',                   kpi: 80,  revenue: 0, tasks: 0 },
  { id: 'u010', name: 'Lê Thị Anh Thái',         role: 'staff',   avatar: 'LTAT', department: 'Content',                   kpi: 75,  revenue: 0, tasks: 0 },
  // PHÁT TRIỂN SẢN PHẨM
  { id: 'u006', name: 'Trương Xuân Dũng',        role: 'manager', avatar: 'TXD',  department: 'Lead Sản phẩm',             kpi: 82,  revenue: 0, tasks: 0 },
  { id: 'u007', name: 'Vũ Phương Hạnh',          role: 'manager', avatar: 'VPH',  department: 'Lead Sản phẩm',             kpi: 79,  revenue: 0, tasks: 0 },
  // KÊNH CÁ NHÂN
  { id: 'u008', name: 'Nguyễn Văn Lợi',          role: 'staff',   avatar: 'NVL',  department: 'Kênh cá nhân',             kpi: 72,  revenue: 0, tasks: 0 },
  // THIẾT KẾ
  { id: 'u011', name: 'Phạm Thanh Mai',          role: 'staff',   avatar: 'PTM',  department: 'Thiết kế',                  kpi: 85,  revenue: 0, tasks: 0 },
  { id: 'u012', name: 'Khuất Thị Dung',          role: 'staff',   avatar: 'KTD',  department: 'Thiết kế',                  kpi: 83,  revenue: 0, tasks: 0 },
];

/* ============ INITIAL TASKS — Từ TNA Vimove 2026 (GĐ 1: Setup 01/04 - 30/06) ============ */
const INITIAL_TASKS = [

  // ===== VP / HẠ TẦNG =====
  {
    id: 't001',
    title: 'Setup cơ sở vật chất & trang thiết bị văn phòng',
    desc: 'Hoàn thiện cơ sở, loa, màn hình, phòng live, máy tính, camera. Tạo môi trường làm việc chuẩn cho team.',
    category: 'ops',
    stage: 'inprogress',
    priority: 'urgent',
    assigneeId: 'u002',
    deadline: getFutureDate(7),
    createDate: getPastDate(20),
    stageEnteredAt: getPastDate(15) + 'T08:00:00.000Z',
    value: 0,
    channels: [],
    checklist: [
      { text: 'Hoàn thiện phòng live stream', done: false, addedBy: 'u002' },
      { text: 'Lắp đặt màn hình & camera', done: true, addedBy: 'u002', doneBy: 'u002', doneAt: getPastDate(5) },
      { text: 'Test âm thanh, ánh sáng phòng quay', done: false, addedBy: 'u002' },
      { text: 'Mua sắm thiết bị còn thiếu', done: false, addedBy: 'u002' },
    ],
    subtasks: [],
    comments: [{ author: 'u002', text: 'Phòng live đang hoàn thiện, dự kiến xong trong tuần này.', date: getPastDate(2) }]
  },

  // ===== BRAND =====
  {
    id: 't002',
    title: 'Xây dựng bộ Brand Identity Vimove',
    desc: 'Hoàn thiện bộ nhận diện thương hiệu: logo, mascot, packaging, brand guideline, tone of voice. Deadline 15/05.',
    category: 'marketing',
    stage: 'inprogress',
    priority: 'urgent',
    assigneeId: 'u011',
    deadline: '2026-05-15',
    createDate: getPastDate(18),
    stageEnteredAt: getPastDate(10) + 'T08:00:00.000Z',
    value: 0,
    channels: [],
    checklist: [
      { text: 'Hoàn thiện logo chính thức', done: true, addedBy: 'u011', doneBy: 'u011', doneAt: getPastDate(8) },
      { text: 'Thiết kế mascot Travelking', done: false, addedBy: 'u011' },
      { text: 'Packaging và nhãn hiệu sản phẩm', done: false, addedBy: 'u011' },
      { text: 'Brand guideline đầy đủ (màu sắc, font, ngôn ngữ)', done: false, addedBy: 'u011' },
      { text: 'Mẫu bao bì & quà tặng', done: false, addedBy: 'u012' },
    ],
    subtasks: [
      { id: 'sub001', name: 'Thiết kế bộ charm giới thiệu SP', assigneeId: 'u012', stage: 'inprogress', createdAt: getPastDate(5) },
    ],
    comments: [{ author: 'u011', text: 'Logo đã được duyệt, đang vào giai đoạn mascot và packaging.', date: getPastDate(3) }]
  },

  // ===== SẢN PHẨM =====
  {
    id: 't003',
    title: 'Phát triển bộ sản phẩm Vimove (Basic + Signature + Charm)',
    desc: 'Xây dựng bộ sản phẩm phễu: vali Basic, Signature Line, bộ charm mascot, bộ phụ kiện, bộ quà tặng. Deadline 08/05.',
    category: 'ops',
    stage: 'inprogress',
    priority: 'urgent',
    assigneeId: 'u006',
    deadline: '2026-05-08',
    createDate: getPastDate(15),
    stageEnteredAt: getPastDate(12) + 'T09:00:00.000Z',
    value: 0,
    channels: [],
    checklist: [
      { text: 'Chốt bộ sản phẩm phễu, sp chủ lực', done: true, addedBy: 'u006', doneBy: 'u006', doneAt: getPastDate(10) },
      { text: 'Phát triển bộ charm: mascot, sticker', done: false, addedBy: 'u006' },
      { text: 'Bộ quà tặng kèm sản phẩm', done: false, addedBy: 'u007' },
      { text: 'Packaging đồng bộ toàn bộ dòng', done: false, addedBy: 'u006' },
      { text: 'Mẫu sản phẩm hoàn chỉnh để chụp ảnh', done: false, addedBy: 'u007' },
    ],
    subtasks: [
      { id: 'sub002', name: 'Thiết kế bộ phụ kiện hành lý', assigneeId: 'u007', stage: 'inprogress', createdAt: getPastDate(8) },
    ],
    comments: [{ author: 'u006', text: 'Sản phẩm chủ lực đã chốt, đang làm mẫu bộ charm và quà tặng.', date: getPastDate(4) }]
  },

  // ===== DIGITAL / WEBSITE =====
  {
    id: 't004',
    title: 'Setup Website Vimove + tích hợp thanh toán & vận chuyển',
    desc: 'Thiết kế & phát triển website bán hàng Vimove: landing page, tích hợp 4 cổng thanh toán, kết nối API vận chuyển GHN/J&T, SEO. Deadline 15/06.',
    category: 'ops',
    stage: 'inprogress',
    priority: 'high',
    assigneeId: 'u001',
    deadline: '2026-06-15',
    createDate: getPastDate(12),
    stageEnteredAt: getPastDate(8) + 'T08:00:00.000Z',
    value: 0,
    channels: [],
    checklist: [
      { text: 'Xây dựng cấu trúc website', done: true, addedBy: 'u001', doneBy: 'u001', doneAt: getPastDate(7) },
      { text: 'Thiết kế UI/UX landing page', done: false, addedBy: 'u001' },
      { text: 'Tích hợp Zalo chat + Meta Pixel + TikTok Pixel', done: false, addedBy: 'u001' },
      { text: 'Cài 4 cổng thanh toán: ZaloPay, VNPay, MoMo, COD', done: false, addedBy: 'u001' },
      { text: 'Kết nối API vận chuyển GHN / J&T', done: false, addedBy: 'u001' },
      { text: 'SEO technical + on-page + submit sitemap', done: false, addedBy: 'u001' },
      { text: 'Test toàn diện 20 điểm → Launch chính thức', done: false, addedBy: 'u001' },
    ],
    subtasks: [
      { id: 'sub003', name: 'Setup TikTok Pixel & Meta Pixel', assigneeId: 'u004', stage: 'idea', createdAt: getPastDate(5) },
    ],
    comments: [{ author: 'u001', text: 'Cấu trúc website đã xong, đang vào giai đoạn UI và tích hợp payment.', date: getPastDate(2) }]
  },

  // ===== NỀN TẢNG KÊNH =====
  {
    id: 't005',
    title: 'Setup TikTok Shop + @travelking.official',
    desc: 'Mở TikTok Shop, kết nối kho, upload sản phẩm. Tối ưu @travelking.official: bio, avatar, link, ghim video. Test live đầu tiên. Deadline 31/05.',
    category: 'ops',
    stage: 'inprogress',
    priority: 'urgent',
    assigneeId: 'u001',
    deadline: '2026-05-31',
    createDate: getPastDate(10),
    stageEnteredAt: getPastDate(7) + 'T09:00:00.000Z',
    value: 0,
    channels: ['tiktok'],
    checklist: [
      { text: 'Đăng ký TikTok Shop Business', done: true, addedBy: 'u001', doneBy: 'u001', doneAt: getPastDate(6) },
      { text: 'Upload sản phẩm đầu tiên lên Shop', done: false, addedBy: 'u001' },
      { text: 'Kết nối kho hàng tự động', done: false, addedBy: 'u001' },
      { text: 'Tối ưu @travelking.official (bio, avatar, link)', done: false, addedBy: 'u005' },
      { text: 'Test phiên Live đầu tiên', done: false, addedBy: 'u004' },
    ],
    subtasks: [],
    comments: [{ author: 'u001', text: 'TikTok Shop đã được duyệt, đang upload sản phẩm.', date: getPastDate(3) }]
  },
  {
    id: 't006',
    title: 'Setup Facebook Fanpage + Instagram Vimove',
    desc: 'Tạo và tối ưu Fanpage Facebook: cover, CTA, thông tin. Setup Instagram, sync FB, tối ưu bio + link in bio. Deadline 31/05.',
    category: 'marketing',
    stage: 'inprogress',
    priority: 'high',
    assigneeId: 'u005',
    deadline: '2026-05-31',
    createDate: getPastDate(8),
    stageEnteredAt: getPastDate(5) + 'T08:00:00.000Z',
    value: 0,
    channels: ['facebook', 'instagram'],
    checklist: [
      { text: 'Tạo Fanpage và hoàn thiện thông tin', done: true, addedBy: 'u005', doneBy: 'u005', doneAt: getPastDate(4) },
      { text: 'Upload cover, avatar đúng brand', done: false, addedBy: 'u005' },
      { text: 'Setup Instagram & sync với FB', done: false, addedBy: 'u005' },
      { text: 'Lên lịch content tuần đầu', done: false, addedBy: 'u005' },
    ],
    subtasks: [],
    comments: []
  },
  {
    id: 't007',
    title: 'Setup Shopee Mall Vimove',
    desc: 'Mở gian hàng Shopee Mall, tối ưu sản phẩm, setup Shopee Ads ngân sách 100M/tháng. Deadline 31/05.',
    category: 'ops',
    stage: 'idea',
    priority: 'high',
    assigneeId: 'u001',
    deadline: '2026-05-31',
    createDate: getPastDate(5),
    stageEnteredAt: getPastDate(5) + 'T09:00:00.000Z',
    value: 0,
    channels: ['shopee'],
    checklist: [
      { text: 'Đăng ký Shopee Mall', done: false, addedBy: 'u001' },
      { text: 'Upload sản phẩm và mô tả chuẩn SEO Shopee', done: false, addedBy: 'u001' },
      { text: 'Setup Shopee Ads 100M/tháng', done: false, addedBy: 'u004' },
    ],
    subtasks: [],
    comments: []
  },

  // ===== CONTENT =====
  {
    id: 't008',
    title: 'Xây dựng Content Strategy tổng thể Vimove',
    desc: 'Định hướng nội dung 3 tháng: pillar content, tone of voice, content mix (edu/entertain/convert), tần suất đăng mỗi kênh. Phụ trách: Phương.',
    category: 'marketing',
    stage: 'inprogress',
    priority: 'urgent',
    assigneeId: 'u005',
    deadline: getFutureDate(5),
    createDate: getPastDate(7),
    stageEnteredAt: getPastDate(5) + 'T08:00:00.000Z',
    value: 0,
    channels: ['tiktok', 'facebook', 'instagram'],
    checklist: [
      { text: 'Xây dựng Content Strategy tổng thể', done: true, addedBy: 'u005', doneBy: 'u005', doneAt: getPastDate(3) },
      { text: 'Lên Content Calendar T5-T6', done: false, addedBy: 'u005' },
      { text: 'Xác định Content Pillar (4-5 trụ cột)', done: true, addedBy: 'u005', doneBy: 'u005', doneAt: getPastDate(2) },
      { text: 'Phối hợp hoàn thiện Brand Guideline', done: false, addedBy: 'u005' },
      { text: 'Brief & giám sát chụp ảnh sản phẩm', done: false, addedBy: 'u005' },
    ],
    subtasks: [
      { id: 'sub004', name: 'Viết bản mô tả Tone of Voice', assigneeId: 'u005', stage: 'done', createdAt: getPastDate(4) },
    ],
    comments: [{ author: 'u005', text: 'Content Strategy đã xây dựng xong, đang bước vào lập Content Calendar.', date: getPastDate(1) }]
  },
  {
    id: 't009',
    title: 'Sản xuất video khởi đầu kênh @travelking.official',
    desc: 'Quay Brand Story Video (60-90s TikTok), Factory Tour. Setup 3 kênh AI dùng VEO 3. Tạo bài hát thương hiệu Suno. 5-7 bài Soft Launch teaser.',
    category: 'marketing',
    stage: 'idea',
    priority: 'high',
    assigneeId: 'u005',
    deadline: getFutureDate(14),
    createDate: getPastDate(4),
    stageEnteredAt: getPastDate(4) + 'T09:00:00.000Z',
    value: 0,
    channels: ['tiktok', 'facebook'],
    checklist: [
      { text: 'Lên script Brand Story Video', done: false, addedBy: 'u005' },
      { text: 'Quay Factory Tour tại nhà máy', done: false, addedBy: 'u005' },
      { text: '10 video đầu tiên kênh Anh Chú Vali', done: false, addedBy: 'u005' },
      { text: 'Setup 3 kênh AI (dùng VEO 3)', done: false, addedBy: 'u005' },
      { text: 'Tạo bài hát thương hiệu (dùng Suno)', done: false, addedBy: 'u005' },
      { text: '5-7 bài content Soft Launch', done: false, addedBy: 'u005' },
    ],
    subtasks: [
      { id: 'sub005', name: 'Quay & dựng 10 video Anh Chú Vali', assigneeId: 'u008', stage: 'idea', createdAt: getPastDate(2) },
    ],
    comments: []
  },

  // ===== KÊNH CÁ NHÂN =====
  {
    id: 't010',
    title: 'Xây kênh cá nhân @anhchuvali (Nguyễn Văn Lợi)',
    desc: "Xây dựng persona 'Anh Chú Vali' - chuyên gia vali/du lịch. Kế hoạch 2 ngày quay cho 1 tuần, mỗi ngày 2 video đăng kênh.",
    category: 'marketing',
    stage: 'idea',
    priority: 'high',
    assigneeId: 'u008',
    deadline: getFutureDate(21),
    createDate: getPastDate(3),
    stageEnteredAt: getPastDate(3) + 'T09:00:00.000Z',
    value: 0,
    channels: ['tiktok'],
    checklist: [
      { text: 'Tạo kênh & setup thông tin', done: false, addedBy: 'u008' },
      { text: 'Lên kịch bản 10 video đầu tiên (theo style Taki)', done: false, addedBy: 'u008' },
      { text: 'Quay & dựng video đầu tiên', done: false, addedBy: 'u008' },
      { text: 'Nghiên cứu bộ hashtag cho kênh', done: false, addedBy: 'u008' },
      { text: 'Set lịch đăng mấy ngày/tuần', done: false, addedBy: 'u008' },
    ],
    subtasks: [],
    comments: []
  },

  // ===== HR / TUYỂN DỤNG =====
  {
    id: 't011',
    title: 'Tuyển dụng & đào tạo team mới (11 người)',
    desc: 'Tuyển team mới: 1 CTV nhân sự, 1 content, 2 TTS content xây kênh, 2 media, 1 digital, 4 nhân viên livestream. Lộ trình đào tạo AI, sản phẩm, Ads.',
    category: 'hr',
    stage: 'inprogress',
    priority: 'urgent',
    assigneeId: 'u003',
    deadline: getFutureDate(14),
    createDate: getPastDate(14),
    stageEnteredAt: getPastDate(10) + 'T09:00:00.000Z',
    value: 0,
    channels: ['facebook'],
    checklist: [
      { text: 'Đăng tin tuyển dụng trên FB Groups', done: true, addedBy: 'u003', doneBy: 'u003', doneAt: getPastDate(10) },
      { text: 'Phỏng vấn & chọn nhân viên livestream (4)', done: false, addedBy: 'u003' },
      { text: 'Tuyển 2 TTS content xây kênh', done: false, addedBy: 'u003' },
      { text: 'Lên lộ trình đào tạo AI & sản phẩm', done: false, addedBy: 'u003' },
      { text: 'Onboard & phân công team', done: false, addedBy: 'u003' },
    ],
    subtasks: [
      { id: 'sub006', name: 'Soạn tài liệu training nội bộ', assigneeId: 'u003', stage: 'inprogress', createdAt: getPastDate(7) },
    ],
    comments: [{ author: 'u003', text: 'Đã đăng tin tuyển dụng, đang phỏng vấn. Kế hoạch có đủ team trước 15/5.', date: getPastDate(3) }]
  },

  // ===== EVENTS / LAUNCH =====
  {
    id: 't012',
    title: 'Soft Launch + Unboxing Day: 100 PR Kit cho KOL/KOC',
    desc: "T5: Gửi 100 PR kit KOL/KOC. Campaign 'Người đầu tiên' - 1.000 KH đầu tiên: giá + quà đặc biệt. KPI: 1.5 tỷ doanh số, 1.500+ đơn, TikTok 15K followers, FB 10K likes.",
    category: 'marketing',
    stage: 'idea',
    priority: 'high',
    assigneeId: 'u002',
    deadline: '2026-05-31',
    createDate: getPastDate(6),
    stageEnteredAt: getPastDate(6) + 'T08:00:00.000Z',
    value: 1500,
    channels: ['tiktok', 'facebook', 'instagram'],
    checklist: [
      { text: 'Lập danh sách 50 KOL/KOC phù hợp', done: false, addedBy: 'u003' },
      { text: 'Soạn brief + bộ PR kit gửi KOL', done: false, addedBy: 'u005' },
      { text: 'Chuẩn bị gift box & packaging đặc biệt', done: false, addedBy: 'u006' },
      { text: "Thiết lập campaign 'Người đầu tiên'", done: false, addedBy: 'u003' },
      { text: 'Setup đơn hàng & voucher ưu đãi', done: false, addedBy: 'u001' },
    ],
    subtasks: [
      { id: 'sub007', name: 'Đơn hàng KOL gift box (50 hộp)', assigneeId: 'u007', stage: 'idea', createdAt: getPastDate(3) },
    ],
    comments: []
  },

  // ===== VẬN HÀNH =====
  {
    id: 't013',
    title: 'Setup quy trình vận hành đơn hàng hàng ngày',
    desc: 'SOP xử lý đơn: tiếp nhận + xác nhận từ Pancake, đặt đơn Bravo, phối hợp kho + vận chuyển GHN/J&T, xử lý hoàn, chăm sóc KH và báo cáo daily.',
    category: 'ops',
    stage: 'idea',
    priority: 'high',
    assigneeId: 'u007',
    deadline: '2026-06-15',
    createDate: getPastDate(5),
    stageEnteredAt: getPastDate(5) + 'T08:00:00.000Z',
    value: 0,
    channels: [],
    checklist: [
      { text: 'Xây SOP quy trình xử lý đơn hàng', done: false, addedBy: 'u007' },
      { text: 'Setup Pancake để tập trung quản lý đơn', done: false, addedBy: 'u001' },
      { text: 'Phối hợp kho + vận chuyển GHN/J&T', done: false, addedBy: 'u007' },
      { text: 'Quy trình xử lý hàng hoàn', done: false, addedBy: 'u007' },
      { text: 'Báo cáo daily trên Bravo', done: false, addedBy: 'u007' },
    ],
    subtasks: [],
    comments: []
  },
];

// ============ CRM LEADS ============
const CRM_STAGES = [
  { id: 'new',       name: 'Khách mới',       color: '#94A3B8' },
  { id: 'contacted', name: 'Đã tiếp cận',     color: '#3B82F6' },
  { id: 'nurturing', name: 'Đang nuôi dưỡng', color: '#F59E0B' },
  { id: 'closing',   name: 'Sắp chốt',        color: '#8B5CF6' },
  { id: 'won',       name: 'Đã chốt ✅',      color: '#10B981' },
];

const INITIAL_LEADS = [
  { id: 'l001', name: 'Chị Hoa Nguyễn', phone: '0901234567', email: 'hoa@gmail.com', channel: 'facebook', product: 'Gói Premium', stage: 'nurturing', note: 'Quan tâm sp, hỏi thêm về chính sách', date: getPastDate(3), followUpDate: getFutureDate(1), dealValue: 15, assigneeId: 'u002', contactHistory: [{ note: 'Đã gọi điện lần 1, hẹn gọi lại', date: getPastDate(2), by: 'u002' }], tags: ['hot'] },
  { id: 'l002', name: 'Anh Tuấn Phạm', phone: '0912345678', email: '', channel: 'zalo', product: 'Gói VIP', stage: 'closing', note: 'Sắp quyết định mua, cần thêm ưu đãi', date: getPastDate(1), followUpDate: getFutureDate(0), dealValue: 25, assigneeId: 'u003', contactHistory: [{ note: 'Gửi báo giá chi tiết', date: getPastDate(1), by: 'u003' }], tags: ['vip', 'hot'] },
  { id: 'l003', name: 'Em Lan Trần', phone: '0923456789', email: '', channel: 'tiktok', product: 'Gói Basic', stage: 'new', note: 'Comment trên TikTok, chưa nhắn tin', date: getPastDate(0), followUpDate: getFutureDate(2), dealValue: 5, assigneeId: 'u003', contactHistory: [], tags: [] },
  { id: 'l004', name: 'Chị Mai Lê', phone: '0934567890', email: 'mai@company.vn', channel: 'referral', product: 'Gói Premium', stage: 'won', note: 'Đã chốt 2 sp, KH thân thiết', date: getPastDate(5), followUpDate: null, dealValue: 30, assigneeId: 'u002', contactHistory: [{ note: 'Hoàn tất hợp đồng, chuyển khoản đủ', date: getPastDate(3), by: 'u002' }], tags: ['vip'] },
  { id: 'l005', name: 'Anh Hùng Võ', phone: '0945678901', email: '', channel: 'facebook', product: 'Gói VIP', stage: 'contacted', note: 'Đã gửi brochure, chờ phản hồi', date: getPastDate(2), followUpDate: getFutureDate(1), dealValue: 20, assigneeId: 'u002', contactHistory: [], tags: [] },
  { id: 'l006', name: 'Chị Nga Bùi', phone: '0956789012', email: '', channel: 'instagram', product: 'Gói Basic', stage: 'nurturing', note: 'Follow IG, like nhiều bài', date: getPastDate(4), followUpDate: getPastDate(1), dealValue: 8, assigneeId: 'u003', contactHistory: [], tags: ['cold'] },
];

// ============ REVENUE DATA (Monthly) ============
const MONTHLY_REVENUE = [
  { month: 'T1', target: 8.8, actual: 7.2  },
  { month: 'T2', target: 8.8, actual: 9.1  },
  { month: 'T3', target: 8.8, actual: 8.5  },
  { month: 'T4', target: 8.8, actual: 10.2 },
  { month: 'T5', target: 8.8, actual: null  },
  { month: 'T6', target: 8.8, actual: null  },
];

// Chỉ tính các tháng đã có doanh thu thực tế (T1 - T4)
const TOTAL_ACTUAL_REVENUE_STATIC = MONTHLY_REVENUE.filter(m => m.actual !== null).reduce((s,m) => s + m.actual, 0);

// ============ DYNAMIC REVENUE (tính từ tasks thực tế) ============

/**
 * Tính doanh thu theo tháng dựa trên tasks đã hoàn thành (stage='done')
 * task.value đơn vị: triệu đồng → chia 1000 = tỷ
 */
function getDynamicRevenue() {
  const monthlyMap = {};
  appState.tasks
    .filter(t => t.stage === 'done' && t.value > 0)
    .forEach(t => {
      const doneDate = new Date(t.stageEnteredAt || t.deadline || t.createDate || Date.now());
      const key = 'T' + (doneDate.getMonth() + 1);
      monthlyMap[key] = (monthlyMap[key] || 0) + (t.value / 1000);
    });

  return MONTHLY_REVENUE.map(m => ({
    ...m,
    actual: monthlyMap[m.month] !== undefined
      ? parseFloat(monthlyMap[m.month].toFixed(2))
      : m.actual
  }));
}

/**
 * Tổng doanh thu thực tế (ưu tiên từ tasks, fallback sang static data)
 */
function getTotalActualRevenue() {
  const fromTasks = appState.tasks
    .filter(t => t.stage === 'done' && t.value > 0)
    .reduce((sum, t) => sum + t.value / 1000, 0);
  // Nếu chưa có tasks nào done có value, fallback sang static
  return fromTasks > 0 ? fromTasks : TOTAL_ACTUAL_REVENUE_STATIC;
}

// Backward compat: giữ tên TOTAL_ACTUAL_REVENUE cho dashboard cũ
let TOTAL_ACTUAL_REVENUE = TOTAL_ACTUAL_REVENUE_STATIC;

// ============ CHANNEL PERFORMANCE ============
const CHANNEL_PERFORMANCE = {
  facebook:  { leads: 145, orders: 38, revenue: 18.5 },
  zalo:      { leads: 89,  orders: 25, revenue: 12.3 },
  tiktok:    { leads: 67,  orders: 19, revenue: 9.8  },
  instagram: { leads: 31,  orders: 8,  revenue: 4.2  },
  shopee:    { leads: 22,  orders: 11, revenue: 5.4  },
  referral:  { leads: 18,  orders: 14, revenue: 7.1  },
};

// ============ STATE ============
let appState = {
  currentUser: null,
  tasks: [],
  leads: [],
  notifications: [],
  currentView: 'kanban',
  currentFilter: 'all',
  currentCategory: 'all',
};

// ============ STORAGE KEY ============
const STORAGE_KEY = 'viwork_data';

// Version check: tự động xóa data cũ nếu không đúng phiên bản. Chạy ngay khi load để session bị hủy trước checkSession.
(function checkVersion() {
  const savedVersion = localStorage.getItem('viwork_version');
  if (savedVersion !== DATA_VERSION) {
    localStorage.removeItem('viwork_data');
    localStorage.removeItem('viwork_requests');
    localStorage.removeItem('viwork_users');
    sessionStorage.removeItem('vw_user');
    localStorage.setItem('viwork_version', DATA_VERSION);
    console.log('[⚡ VIWORK] Data auto-reset: upgraded to', DATA_VERSION);
  }
})();

// ============ INIT DATA (CLOUD FIRESTORE) ============
function initData() {
  if (window.firebaseDB) {
    // 1. Kiểm tra và bơm dữ liệu nếu mây rỗng
    window.fbCheckAndSeed();

    // 2. Lắng nghe Dữ liệu Công việc (Tasks)
    window.fbListenTasks(tasks => {
      appState.tasks = tasks;
      appState.tasks.sort((a,b) => b.order - a.order); // Giữ đúng thứ tự Kanban
      if (typeof renderWorkflow === 'function') renderWorkflow();
      if (typeof renderMyTasks === 'function') renderMyTasks();
      if (typeof renderDashboard === 'function') renderDashboard();
      if (typeof updateBadges === 'function') updateBadges();
      generateNotifications();
    });

    // 3. Lắng nghe Dữ liệu CRM (Leads)
    window.fbListenLeads(leads => {
      appState.leads = leads;
      if (typeof renderCRM === 'function') renderCRM();
      if (typeof renderDashboard === 'function') renderDashboard();
    });

    // 4. Lắng nghe Dữ liệu Đề xuất (Requests)
    window.fbListenRequests(reqs => {
      if (typeof requestState !== 'undefined') {
        requestState.requests = reqs;
      }
      if (typeof renderRequests === 'function') renderRequests();
      if (typeof updateRequestBadge === 'function') updateRequestBadge();
    });

    // 5. Lắng nghe Dữ liệu Người dùng (Users)
    window.fbListenUsers(users => {
      // Ghi đè vào biến DEMO_USERS gốc để dùng cho toàn app
      Object.keys(users).forEach(k => DEMO_USERS[k] = users[k]);
      if (typeof renderUserManager === 'function' && document.getElementById('userManager')) {
        renderUserManager();
      }
      if (typeof renderTeam === 'function' && document.getElementById('teamLeaderboard')) {
        renderTeam();
      }
    });
  } else {
    // Dự phòng khi mất kết nối Firebase, sài Data tĩnh
    appState.tasks = [...INITIAL_TASKS];
    appState.leads = [...INITIAL_LEADS];
    generateNotifications();
  }
}

function resetAllData() {
  if (!confirm('Vùng nguy hiểm: Tính năng Xóa Cloud chưa được mở.')) return;
}

// Bỏ saveData local
function saveData() {
  // Không làm gì nữa vì Firebase tự động xử lý write ở hàm riêng (fbSaveTask)
}

function generateNotifications() {
  const today = new Date();
  today.setHours(0,0,0,0);
  appState.notifications = [];
  appState.tasks.forEach(t => {
    if (!t.deadline || t.stage === 'done') return;
    const dl = new Date(t.deadline);
    const diff = Math.ceil((dl - today) / 86400000);
    if (diff < 0) {
      appState.notifications.push({ id: 'n_'+t.id, type: 'overdue', task: t, text: `CVC "${t.title}" đã trễ ${Math.abs(diff)} ngày!` });
    } else if (diff <= 2) {
      appState.notifications.push({ id: 'n2_'+t.id, type: 'due_soon', task: t, text: `CVC "${t.title}" sắp đến hạn trong ${diff} ngày.` });
    }
  });
}

// ============ HELPER FUNCTIONS ============
function getPastDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function getFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateRelative(dateStr) {
  if (!dateStr) return '—';
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr);
  const diff = Math.ceil((d - today) / 86400000);
  if (diff < 0) return `Trễ ${Math.abs(diff)} ngày`;
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Ngày mai';
  if (diff <= 7) return `${diff} ngày nữa`;
  return formatDate(dateStr);
}

function getDeadlineClass(dateStr, stage) {
  if (!dateStr || stage === 'done') return 'deadline-normal';
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr);
  const diff = Math.ceil((d - today) / 86400000);
  if (diff < 0) return 'deadline-overdue';
  if (diff <= 3) return 'deadline-soon';
  return 'deadline-normal';
}

function isOverdue(task) {
  if (!task.deadline || task.stage === 'done') return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(task.deadline) < today;
}

function getUserById(id) {
  return TEAM_MEMBERS.find(m => m.id === id) || { name: 'Unknown', avatar: '??' };
}

function getStageById(id) {
  return STAGES.find(s => s.id === id) || STAGES[0];
}

function generateId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2,4);
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0,2);
}

function formatCurrency(val) {
  if (!val) return '—';
  if (val >= 1000) return (val/1000).toFixed(1) + ' tỷ';
  return val.toLocaleString('vi-VN') + ' triệu';
}
