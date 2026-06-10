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
const DATA_VERSION = 'viwork_v3.0_clean';

// ============ STAGES (Giai đoạn luồng CVC) ============
const STAGES = [
  { id: 'idea',       name: 'Lên kế hoạch',   color: '#94A3B8', icon: '💡', order: 0 },
  { id: 'inprogress', name: 'Đang triển khai', color: '#3B82F6', icon: '⚡', order: 1 },
  { id: 'done',       name: 'Hoàn thành',      color: '#10B981', icon: '✅', order: 2 },
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
   Primary Admin: ngan@vimove.net / ngan123  (⇒ Phê duyệt, quản trị)
   Tech Admin:    tuyen@vimove.net / tuyen123 (⇒ Hỗ trợ kỹ thuật)
   ======================================================== */
const DEMO_USERS = {
  // ===== PRIMARY ADMIN =====
  'ngan@vimove.net': { id: 'u002', name: 'Nguyễn Thị Thanh Ngân', role: 'admin', password: 'ngan123', avatar: 'NTN', department: 'Quản trị & Phê duyệt' },
  'tuyen@vimove.net': { id: 'u001', name: 'Trương Ngọc Tuyền', role: 'admin', password: 'tuyen123', avatar: 'TNT', department: 'Digital & Hỗ trợ kỹ thuật' },
  'chi@vimove.net': { id: 'u013', name: 'Trịnh Linh Chi', role: 'admin', password: 'chi123', avatar: 'TL', department: 'HR' },
  
  // ===== MANAGER =====
  'trang@vimove.net': { id: 'u003', name: 'Nguyễn Thị Quỳnh Trang', role: 'manager', password: 'trang123', avatar: 'NQT', department: 'HR & MKT & Sale' },
  'phuong@vimove.net': { id: 'u005', name: 'Hoàng Quỳnh Phương', role: 'manager', password: 'phuong123', avatar: 'HQP', department: 'Content Lead' },
  'dung.tx@vimove.net': { id: 'u006', name: 'Trương Xuân Dũng', role: 'manager', password: 'dung123', avatar: 'TXD', department: 'Lead Sản phẩm' },
  'hanh@vimove.net': { id: 'u007', name: 'Vũ Phương Hạnh', role: 'manager', password: 'hanh123', avatar: 'VPH', department: 'Lead Sản phẩm' },
  'loi@vimove.net': { id: 'u008', name: 'Nguyễn Văn Lợi', role: 'manager', password: 'loi123', avatar: 'NV', department: 'Kênh cá nhân' },
  
  // ===== STAFF =====

  'thai@vimove.net': { id: 'u010', name: 'Lê Thị Anh Thái', role: 'staff', password: 'thai123', avatar: 'LTAT', department: 'Content' },
  'mai@vimove.net': { id: 'u011', name: 'Phạm Thanh Mai', role: 'staff', password: 'mai123', avatar: 'PTM', department: 'Thiết kế' },
  'dung.kt@vimove.net': { id: 'u012', name: 'Khuất Thị Dung', role: 'staff', password: 'dung456', avatar: 'KT', department: 'Design' },
  'duyen@vimove.net': { id: 'u014', name: 'Phạm Mỹ Duyên', role: 'staff', password: 'duyen123', avatar: 'PM', department: 'Media' },
  'ngan.le@vimove.net': { id: 'u009', name: 'Lê Ngân', role: 'staff', password: 'nganle123', avatar: 'LN', department: 'Content Marketing' },
  'sang@vimove.net': { id: 'u015', name: 'Bùi Thị Ngọc Sang', role: 'staff', password: 'sang123', avatar: 'BT', department: 'Content Marketing' },
  'phong@vimove.net': { id: 'u016', name: 'Lương Văn Phong', role: 'staff', password: 'phong123', avatar: 'LV', department: 'Media' },
  'bac@vimove.net': { id: 'u017', name: 'Lý Việt Bắc', role: 'staff', password: 'bac123', avatar: 'LV', department: 'Content Marketing' },
};

/* ========================================================
   TEAM MEMBERS — Danh sách đội ngũ Vimove 2026
   TNA: Inhouse 8 người + Team mới 11 người
   ======================================================== */
const TEAM_MEMBERS = [
  // BAN LÃNH ĐẠO
  { id: 'u002', name: 'Nguyễn Thị Thanh Ngân',  role: 'admin',   avatar: 'NTN',  department: 'Quản trị & Phê duyệt',      kpi: 0, revenue: 0, tasks: 0 },
  { id: 'u001', name: 'Trương Ngọc Tuyền',      role: 'admin',   avatar: 'TNT',  department: 'Digital & Hỗ trợ kỹ thuật', kpi: 0, revenue: 0, tasks: 0 },
  { id: 'u013', name: 'Trịnh Linh Chi',         role: 'admin',   avatar: 'TL',   department: 'HR',                        kpi: 0, revenue: 0, tasks: 0 },
  // QUẢN LÝ
  { id: 'u003', name: 'Nguyễn Thị Quỳnh Trang', role: 'manager', avatar: 'NQT',  department: 'HR & MKT & Sale',           kpi: 0, revenue: 0, tasks: 0 },
  { id: 'u005', name: 'Hoàng Quỳnh Phương',      role: 'manager', avatar: 'HQP',  department: 'Content Lead',              kpi: 0, revenue: 0, tasks: 0 },
  { id: 'u006', name: 'Trương Xuân Dũng',        role: 'manager', avatar: 'TXD',  department: 'Lead Sản phẩm',             kpi: 0, revenue: 0, tasks: 0 },
  { id: 'u007', name: 'Vũ Phương Hạnh',          role: 'manager', avatar: 'VPH',  department: 'Lead Sản phẩm',             kpi: 0, revenue: 0, tasks: 0 },
  { id: 'u008', name: 'Nguyễn Văn Lợi',          role: 'manager', avatar: 'NV',   department: 'Kênh cá nhân',              kpi: 0, revenue: 0, tasks: 0 },
  // NHÂN VIÊN
  { id: 'u010', name: 'Lê Thị Anh Thái',         role: 'staff',   avatar: 'LTAT', department: 'Content',                   kpi: 0, revenue: 0, tasks: 0 },
  { id: 'u011', name: 'Phạm Thanh Mai',          role: 'staff',   avatar: 'PTM',  department: 'Thiết kế',                  kpi: 0, revenue: 0, tasks: 0 },
  { id: 'u012', name: 'Khuất Thị Dung',          role: 'staff',   avatar: 'KT',   department: 'Design',                    kpi: 0, revenue: 0, tasks: 0 },
  { id: 'u014', name: 'Phạm Mỹ Duyên',           role: 'staff',   avatar: 'PM',   department: 'Media',                     kpi: 0, revenue: 0, tasks: 0 },
  { id: 'u009', name: 'Lê Ngân',                 role: 'staff',   avatar: 'LN',   department: 'Content Marketing',         kpi: 0, revenue: 0, tasks: 0 },
  { id: 'u015', name: 'Bùi Thị Ngọc Sang',       role: 'staff',   avatar: 'BT',   department: 'Content Marketing',         kpi: 0, revenue: 0, tasks: 0 },
  { id: 'u016', name: 'Lương Văn Phong',         role: 'staff',   avatar: 'LV',   department: 'Media',                     kpi: 0, revenue: 0, tasks: 0 },
  { id: 'u017', name: 'Lý Việt Bắc',             role: 'staff',   avatar: 'LV',   department: 'Content Marketing',         kpi: 0, revenue: 0, tasks: 0 },
];

/* ========================================================
   POSITIONS — Vị trí & KPI & Thu nhập Vimove 2026
   ======================================================== */
let POSITIONS = [
  {
    id: 'pos_ceo',
    name: 'GĐ Vận hành',
    level: 0,
    reportsTo: null,
    icon: '👑',
    color: '#5AB800',
    description: 'Chịu trách nhiệm cao nhất về tăng trưởng GMV bền vững trên sàn TMĐT, xây dựng đội ngũ xuất sắc và vận hành tổ chức hiệu quả.',
    members: ['u002'],
    taskTemplates: [
      { title: 'Chủ trì họp ban giám đốc hàng tuần', category: 'ops', priority: 'high' },
      { title: 'Review GMV, ROAS, issues và ra quyết định', category: 'marketing', priority: 'urgent' },
      { title: 'Thiết lập và review hệ thống KPI toàn công ty', category: 'hr', priority: 'high' },
      { title: 'Phê duyệt ngân sách marketing & đầu tư', category: 'finance', priority: 'high' },
      { title: 'Làm việc với đối tác (AM sàn, NCC)', category: 'ops', priority: 'medium' },
      { title: 'Xây dựng và phát triển đội ngũ C-suite', category: 'hr', priority: 'high' }
    ],
    kpiTargets: [
      { metric: 'revenue', label: 'GMV (Đạt KH năm, tăng trưởng >30%)', target: 100, unit: '%' },
      { metric: 'profit', label: 'EBITDA dương, GP% đạt mục tiêu', target: 100, unit: '%' },
      { metric: 'team_kpi', label: 'Turnover < 20%, eNPS > 30', target: 100, unit: '%' },
      { metric: 'tasks_done', label: 'KPI chiến lược & Đối tác', target: 100, unit: '%' },
    ],
    salary: { base: 30000000, kpiBonus: 15000000, cvcBonus: 1000000 },
  },
  {
    id: 'pos_tech',
    name: 'Kỹ thuật & Digital',
    level: 0,
    reportsTo: null,
    icon: '💻',
    color: '#3B82F6',
    description: 'Phụ trách toàn bộ hệ thống kỹ thuật số: website, app, công cụ nội bộ, tích hợp thanh toán & vận chuyển, hạ tầng cloud.',
    members: ['u001'],
    taskTemplates: [
      { title: 'Setup website + tích hợp thanh toán', category: 'ops', priority: 'urgent' },
      { title: 'Bảo trì và tối ưu hệ thống', category: 'ops', priority: 'medium' },
      { title: 'Cài đặt pixel & tracking', category: 'marketing', priority: 'high' },
    ],
    kpiTargets: [
      { metric: 'tasks_done', label: 'CVC hoàn thành đúng hạn', target: 90, unit: '%' },
      { metric: 'uptime', label: 'Uptime hệ thống', target: 99, unit: '%' },
      { metric: 'integrations', label: 'Tích hợp triển khai', target: 5, unit: 'hệ thống' },
    ],
    salary: { base: 15000000, kpiBonus: 7000000, cvcBonus: 400000 },
  },
  {
    id: 'pos_hr_mkt',
    name: 'Lead HR & MKT & Sale',
    level: 1,
    reportsTo: 'pos_ceo',
    icon: '🎯',
    color: '#F59E0B',
    description: 'Quản lý nhân sự, chiến lược marketing tổng thể và hoạt động bán hàng. Điều phối giữa các phòng ban và đối ngoại.',
    members: ['u003'],
    taskTemplates: [
      { title: 'Lên kế hoạch tuyển dụng tháng', category: 'hr', priority: 'high' },
      { title: 'Xây dựng chiến lược marketing quý', category: 'marketing', priority: 'high' },
      { title: 'Theo dõi doanh số bán hàng tuần', category: 'sales', priority: 'medium' },
      { title: 'Đào tạo và onboarding nhân viên mới', category: 'hr', priority: 'medium' },
    ],
    kpiTargets: [
      { metric: 'leads', label: 'Leads mới/tháng', target: 100, unit: 'leads' },
      { metric: 'conversion', label: 'Tỷ lệ chốt đơn', target: 35, unit: '%' },
      { metric: 'team_kpi', label: 'KPI đội ngũ quản lý', target: 80, unit: '%' },
    ],
    salary: { base: 12000000, kpiBonus: 5000000, cvcBonus: 300000 },
  },
  {
    id: 'pos_content_lead',
    name: 'Lead Content',
    level: 1,
    reportsTo: 'pos_ceo',
    icon: '✍️',
    color: '#8B5CF6',
    description: 'Quản lý đội content, lên kế hoạch nội dung, review và duyệt bài, đảm bảo chất lượng & số lượng nội dung trên tất cả kênh.',
    members: ['u005'],
    taskTemplates: [
      { title: 'Lên kế hoạch nội dung tháng', category: 'marketing', priority: 'high' },
      { title: 'Review & duyệt bài viết team', category: 'marketing', priority: 'high' },
      { title: 'Báo cáo hiệu suất content hàng tuần', category: 'marketing', priority: 'medium' },
      { title: 'Phối hợp với Digital chạy quảng cáo', category: 'marketing', priority: 'medium' },
    ],
    kpiTargets: [
      { metric: 'posts', label: 'Bài viết/tháng', target: 20, unit: 'bài' },
      { metric: 'videos', label: 'Video/tháng', target: 8, unit: 'video' },
      { metric: 'engagement', label: 'Tương tác trung bình', target: 1000, unit: 'lượt/post' },
      { metric: 'tasks_done', label: 'CVC hoàn thành', target: 90, unit: '%' },
    ],
    salary: { base: 10000000, kpiBonus: 4000000, cvcBonus: 250000 },
  },
  {
    id: 'pos_product_lead',
    name: 'Lead Sản phẩm',
    level: 1,
    reportsTo: 'pos_ceo',
    icon: '📦',
    color: '#EC4899',
    description: 'Phụ trách phát triển và quản lý bộ sản phẩm Vimove: từ concept, thiết kế đến ra mắt. Điều phối với đội thiết kế và nhà cung cấp.',
    members: ['u006', 'u007'],
    taskTemplates: [
      { title: 'Phát triển bộ sản phẩm mới', category: 'ops', priority: 'urgent' },
      { title: 'Quản lý nhà cung cấp & đặt hàng', category: 'ops', priority: 'high' },
      { title: 'Kiểm tra chất lượng sản phẩm mẫu', category: 'ops', priority: 'high' },
      { title: 'Cập nhật catalog sản phẩm', category: 'marketing', priority: 'medium' },
    ],
    kpiTargets: [
      { metric: 'products', label: 'SKU ra mắt/quý', target: 5, unit: 'SKU' },
      { metric: 'quality', label: 'Tỷ lệ đạt chuẩn chất lượng', target: 95, unit: '%' },
      { metric: 'tasks_done', label: 'CVC hoàn thành đúng hạn', target: 85, unit: '%' },
    ],
    salary: { base: 10000000, kpiBonus: 4000000, cvcBonus: 250000 },
  },
  {
    id: 'pos_digital',
    name: 'Nhân viên Digital',
    level: 2,
    reportsTo: 'pos_tech',
    icon: '📱',
    color: '#14B8A6',
    description: 'Vận hành các kênh digital: Facebook, TikTok, Zalo. Chạy quảng cáo, quản lý pixel, theo dõi số liệu và tối ưu chiến dịch.',
    members: ['u004'],
    taskTemplates: [
      { title: 'Chạy và tối ưu quảng cáo Facebook/TikTok', category: 'marketing', priority: 'high' },
      { title: 'Báo cáo số liệu quảng cáo hàng tuần', category: 'marketing', priority: 'medium' },
      { title: 'Setup Pixel & retargeting', category: 'marketing', priority: 'high' },
    ],
    kpiTargets: [
      { metric: 'roas', label: 'ROAS quảng cáo', target: 3, unit: 'x' },
      { metric: 'leads', label: 'Leads/tháng', target: 50, unit: 'leads' },
      { metric: 'tasks_done', label: 'CVC hoàn thành', target: 85, unit: '%' },
    ],
    salary: { base: 7000000, kpiBonus: 2500000, cvcBonus: 150000 },
  },
  {
    id: 'pos_content',
    name: 'Nhân viên Content',
    level: 2,
    reportsTo: 'pos_content_lead',
    icon: '📝',
    color: '#6366F1',
    description: 'Sáng tạo nội dung đa kênh: viết bài blog, caption, kịch bản video, script livestream. Đảm bảo số lượng và chất lượng theo kế hoạch.',
    members: ['u009', 'u010'],
    taskTemplates: [
      { title: 'Viết bài blog/caption tháng', category: 'marketing', priority: 'high' },
      { title: 'Lên kịch bản video TikTok', category: 'marketing', priority: 'high' },
      { title: 'Script livestream tuần', category: 'marketing', priority: 'medium' },
    ],
    kpiTargets: [
      { metric: 'posts', label: 'Bài viết/tháng', target: 12, unit: 'bài' },
      { metric: 'videos', label: 'Kịch bản video/tháng', target: 6, unit: 'video' },
      { metric: 'tasks_done', label: 'CVC hoàn thành', target: 85, unit: '%' },
    ],
    salary: { base: 6000000, kpiBonus: 2000000, cvcBonus: 100000 },
  },
  {
    id: 'pos_design',
    name: 'Nhân viên Thiết kế',
    level: 2,
    reportsTo: 'pos_content_lead',
    icon: '🎨',
    color: '#F97316',
    description: 'Thiết kế visual cho tất cả kênh: hình ảnh sản phẩm, banner quảng cáo, bộ nhận diện thương hiệu, packaging, charm mascot.',
    members: ['u011', 'u012'],
    taskTemplates: [
      { title: 'Thiết kế banner/ảnh sản phẩm tháng', category: 'marketing', priority: 'high' },
      { title: 'Update bộ Brand Identity', category: 'marketing', priority: 'medium' },
      { title: 'Thiết kế packaging & charm', category: 'ops', priority: 'high' },
    ],
    kpiTargets: [
      { metric: 'designs', label: 'Thiết kế hoàn thành/tháng', target: 20, unit: 'file' },
      { metric: 'revision', label: 'Tỷ lệ duyệt lần 1', target: 80, unit: '%' },
      { metric: 'tasks_done', label: 'CVC hoàn thành đúng hạn', target: 85, unit: '%' },
    ],
    salary: { base: 6500000, kpiBonus: 2500000, cvcBonus: 150000 },
  },
  {
    id: 'pos_channel',
    name: 'Nhân viên Kênh cá nhân',
    level: 2,
    reportsTo: 'pos_hr_mkt',
    icon: '🤳',
    color: '#EF4444',
    description: 'Phát triển kênh bán hàng cá nhân (Facebook/Zalo cá nhân, TikTok). Tự build content, chăm sóc khách hàng và chốt đơn qua kênh riêng.',
    members: ['u008'],
    taskTemplates: [
      { title: 'Đăng content kênh cá nhân hàng ngày', category: 'sales', priority: 'high' },
      { title: 'Chốt đơn và chăm sóc khách hàng', category: 'sales', priority: 'high' },
      { title: 'Báo cáo doanh số kênh cá nhân tuần', category: 'sales', priority: 'medium' },
    ],
    kpiTargets: [
      { metric: 'orders', label: 'Đơn hàng/tháng', target: 20, unit: 'đơn' },
      { metric: 'revenue_personal', label: 'Doanh thu kênh cá nhân', target: 20, unit: 'triệu' },
      { metric: 'posts', label: 'Bài đăng/tháng', target: 15, unit: 'bài' },
    ],
    salary: { base: 5000000, kpiBonus: 3000000, cvcBonus: 100000 },
  },
];

/* ========================================================
   SALARY POLICY — Chính sách lương thưởng Vimove
   ======================================================== */
let SALARY_POLICY = {
  version: '1.0',
  effectiveDate: '2026-04-01',
  tiers: [
    { min: 0,   max: 69,  label: 'Cảnh báo',      emoji: '🔴', baseMult: 0.85, bonusMult: 0,    note: 'Lương cứng còn 85%, không có thưởng KPI' },
    { min: 70,  max: 79,  label: 'Cần cải thiện',  emoji: '🟠', baseMult: 1.0,  bonusMult: 0.70, note: 'Đủ lương cứng, thưởng KPI 70%' },
    { min: 80,  max: 89,  label: 'Đạt một phần',   emoji: '🟡', baseMult: 1.0,  bonusMult: 0.85, note: 'Đủ lương cứng, thưởng KPI 85%' },
    { min: 90,  max: 99,  label: 'Đạt KPI',        emoji: '🟢', baseMult: 1.0,  bonusMult: 1.0,  note: 'Đủ lương cứng, thưởng KPI đầy đủ' },
    { min: 100, max: 200, label: 'Xuất sắc',       emoji: '🌟', baseMult: 1.0,  bonusMult: 1.2,  note: 'Đủ lương cứng, thưởng KPI + 20% bonus xuất sắc' },
  ],
  // Thưởng đặc biệt
  specialBonuses: [
    { id: 'referral',    label: 'Giới thiệu nhân viên mới',  amount: 500000  },
    { id: 'longevity6m', label: 'Thâm niên 6 tháng',         amount: 500000  },
    { id: 'longevity1y', label: 'Thâm niên 1 năm',           amount: 1500000 },
    { id: 'longevity2y', label: 'Thâm niên 2 năm',           amount: 3000000 },
    { id: 'project',     label: 'Hoàn thành dự án xuất sắc', amount: 1000000 },
  ],
  // Chính sách chung
  policy: {
    payDay: 10,           // Ngày trả lương hàng tháng
    kpiReviewDay: 5,      // Ngày Admin nhập KPI thực tế (mùng 5 tháng sau)
    probation: 2,         // Tháng thử việc (lương × 85%)
    currency: 'VNĐ',
    note: 'Lương được tính và phê duyệt bởi Admin/Quản trị vào đầu mỗi tháng. Nhân viên chỉ xem được bảng lương của chính mình.',
  },
};

/* ========================================================
   USER ALLOWANCES — Phụ cấp từng người (Admin nhập riêng)
   ======================================================== */
let USER_ALLOWANCES = {
  'u001': { lunch: 1000000, transport: 500000, phone: 500000, housing: 0, other: 0, note: 'Phụ cấp kỹ thuật' },
  'u002': { lunch: 1000000, transport: 500000, phone: 500000, housing: 0, other: 0, note: 'Phụ cấp quản trị' },
  'u003': { lunch: 800000,  transport: 400000, phone: 300000, housing: 0, other: 0, note: '' },
  'u004': { lunch: 800000,  transport: 400000, phone: 300000, housing: 0, other: 0, note: '' },
  'u005': { lunch: 800000,  transport: 400000, phone: 300000, housing: 0, other: 0, note: 'Phụ cấp lead content' },
  'u006': { lunch: 800000,  transport: 400000, phone: 300000, housing: 0, other: 0, note: '' },
  'u007': { lunch: 800000,  transport: 400000, phone: 300000, housing: 0, other: 0, note: '' },
  'u008': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0, other: 0, note: '' },
  'u009': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0, other: 0, note: '' },
  'u010': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0, other: 0, note: '' },
  'u011': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0, other: 0, note: '' },
  'u012': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0, other: 0, note: '' },
  'u013': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0, other: 0, note: '' },
  'u014': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0, other: 0, note: '' },
  'u015': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0, other: 0, note: '' },
  'u016': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0, other: 0, note: '' },
  'u017': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0, other: 0, note: '' },
};

/* ========================================================
   KPI_ACTUALS — Số liệu KPI thực tế từng tháng (Admin nhập)
   key: 'userId_YYYY-MM'
   ======================================================== */
const KPI_ACTUALS = {};

/* ============ INITIAL DATA — Đã xóa toàn bộ demo data ============
   App lấy toàn bộ tasks, leads, assignments từ Firebase Firestore.
   Không có seed data — mọi dữ liệu là thực tế do team tạo.
*/
const INITIAL_TASKS       = [];
const INITIAL_LEADS       = [];
const INITIAL_ASSIGNMENTS = [];

// ============ CRM STAGES ============
const CRM_STAGES = [
  { id: 'new',       name: 'Khách mới',       color: '#94A3B8' },
  { id: 'contacted', name: 'Đã tiếp cận',     color: '#3B82F6' },
  { id: 'nurturing', name: 'Đang nuôi dưỡng', color: '#F59E0B' },
  { id: 'closing',   name: 'Sắp chốt',        color: '#8B5CF6' },
  { id: 'won',       name: 'Đã chốt ✅',      color: '#10B981' },
];

// ============ REVENUE DATA (Monthly) ============
// Dữ liệu doanh thu được tính động từ tasks thực tế (stage=done, value>0)
// Không dùng số cứng nữa
const MONTHLY_REVENUE = [
  { month: 'T1', target: 8.8, actual: null },
  { month: 'T2', target: 8.8, actual: null },
  { month: 'T3', target: 8.8, actual: null },
  { month: 'T4', target: 8.8, actual: null },
  { month: 'T5', target: 8.8, actual: null },
  { month: 'T6', target: 8.8, actual: null },
  { month: 'T7', target: 8.8, actual: null },
  { month: 'T8', target: 8.8, actual: null },
  { month: 'T9', target: 8.8, actual: null },
  { month: 'T10', target: 8.8, actual: null },
  { month: 'T11', target: 8.8, actual: null },
  { month: 'T12', target: 8.8, actual: null },
];

const TOTAL_ACTUAL_REVENUE_STATIC = 0;

// ============ DYNAMIC REVENUE (tính từ tasks thực tế) ============

/**
 * Tính doanh thu theo tháng dựa trên tasks đã hoàn thành (stage='done')
 * task.value đơn vị: triệu đồng → chia 1000 = tỷ
 */
function getDynamicRevenue() {
  const monthlyMap = {};
  (appState.tasks || [])
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
      : null  // null = chưa có data, không dùng số giả
  }));
}

/**
 * Tổng doanh thu thực tế — chỉ từ tasks, không fallback về số cứng nữa
 */
function getTotalActualRevenue() {
  return (appState.tasks || [])
    .filter(t => t.stage === 'done' && t.value > 0)
    .reduce((sum, t) => sum + t.value / 1000, 0);
}

let TOTAL_ACTUAL_REVENUE = 0; // Backward compat — luôn = 0 cho đến khi có tasks done có value

// ============ CHANNEL PERFORMANCE ============
// Tính động từ CRM leads thực tế, không dùng số cứng
function getChannelPerformance() {
  const perf = {};
  Object.keys(CHANNELS).forEach(ch => {
    perf[ch] = { leads: 0, orders: 0, revenue: 0 };
  });
  (appState.leads || []).forEach(lead => {
    const ch = lead.channel;
    if (!ch || !perf[ch]) return;
    perf[ch].leads++;
    if (lead.stage === 'won') {
      perf[ch].orders++;
      perf[ch].revenue += (lead.dealValue || 0) / 1000; // triệu → tỷ
    }
  });
  return perf;
}

// Backward compat — tự động tính khi được truy cập
const CHANNEL_PERFORMANCE = new Proxy({}, {
  get(_, prop) {
    return getChannelPerformance()[prop] || { leads: 0, orders: 0, revenue: 0 };
  }
});


// ============ STATE ============
let appState = {
  currentUser: null,
  tasks: [],
  leads: [],
  assignments: [],
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

// ===== TẢI CẤU HÌNH TỪ LOCALSTORAGE =====
function loadHrConfig() {
  try {
    const savedPositions = localStorage.getItem('viwork_hr_positions');
    if (savedPositions) {
      POSITIONS = JSON.parse(savedPositions);
    }
    const savedAllowances = localStorage.getItem('viwork_hr_allowances');
    if (savedAllowances) {
      USER_ALLOWANCES = JSON.parse(savedAllowances);
    }
    const savedPolicy = localStorage.getItem('viwork_hr_policy');
    if (savedPolicy) {
      SALARY_POLICY = JSON.parse(savedPolicy);
    }
  } catch (err) {
    console.error('Error loading HR config', err);
  }
}
// Gọi hàm ngay khi file data.js load để ghi đè dữ liệu mặc định
loadHrConfig();

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
      Object.keys(users).forEach(k => {
        DEMO_USERS[k] = users[k];
        // Nếu user hiện tại bị thay đổi thông tin từ thiết bị khác, cập nhật session ngay lập tức
        if (typeof currentUser !== 'undefined' && currentUser && currentUser.id === users[k].id) {
          const oldRole = currentUser.role;
          currentUser = { ...users[k], password: currentUser.password }; // Giữ password session local
          sessionStorage.setItem('vw_user', JSON.stringify(currentUser));
          if (oldRole !== currentUser.role) window.location.reload(); // Reload nếu đổi Role
        }
      });
      if (typeof renderUserManager === 'function' && document.getElementById('userManager')) {
        renderUserManager();
      }
      if (typeof renderTeam === 'function' && document.getElementById('teamLeaderboard')) {
        renderTeam();
      }
    });

    // 6. Lắng nghe Dữ liệu Giao việc (Assignments)
    window.fbListenAssignments(asgns => {
      appState.assignments = asgns;
      // Luôn cập nhật badge
      if (typeof updateAsgnBadge === 'function') updateAsgnBadge();
      // Render nếu đang ở trang assignments
      if (typeof renderAssignments === 'function') {
        const pgAsgn = document.getElementById('page-assignments');
        if (pgAsgn && pgAsgn.classList.contains('active')) renderAssignments();
      }
      // Cập nhật việc của tôi ở trang chủ
      if (typeof renderMyTasks === 'function') {
        const pgHome = document.getElementById('page-home');
        if (pgHome && pgHome.classList.contains('active')) renderMyTasks();
      }
    });
  } else {
    // Dự phòng khi mất kết nối Firebase, sài Data tĩnh
    appState.tasks = [...INITIAL_TASKS];
    appState.leads = [...INITIAL_LEADS];
    appState.assignments = typeof INITIAL_ASSIGNMENTS !== 'undefined' ? [...INITIAL_ASSIGNMENTS] : [];
    generateNotifications();
  }
}

function resetAllData() {
  if (!confirm('Vùng nguy hiểm: Tính năng Xóa Cloud chưa được mở.')) return;
}

/**
 * Xóa TOÀN BỘ tasks, leads, assignments demo trên Firebase
 * Chỉ Admin mới có quyền gọi hàm này
 */
async function purgeAllFirebaseData() {
  if (currentUser?.role !== 'admin') {
    showToast('⛔ Chỉ Admin mới có quyền xóa dữ liệu!', 'error');
    return;
  }
  if (!confirm('⚠️ CẢNH BÁO: Hành động này sẽ XÓA VĨNH VIỄN toàn bộ CVC, Leads và Giao việc khỏi Firebase.

Chỉ thực hiện khi muốn bắt đầu lại với data thật.

Bạn chắc chắn muốn tiếp tục?')) return;
  if (!confirm('⚠️ LẦN CUỐI XÁC NHẬN: Dữ liệu sẽ KHÔNG thể khôi phục. Tiếp tục?')) return;

  const db = window.firebaseDB;
  if (!db) { showToast('⚠️ Không kết nối Firebase!', 'error'); return; }

  showToast('🗑️ Đang xóa dữ liệu cũ khỏi Cloud...', 'info');

  try {
    const collections = ['viwork_tasks', 'viwork_leads', 'viwork_assignments', 'viwork_requests'];
    let totalDeleted = 0;

    for (const col of collections) {
      const snap = await db.collection(col).get();
      if (snap.empty) continue;
      const batch = db.batch();
      snap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      totalDeleted += snap.size;
      console.log('[PURGE] Deleted', snap.size, 'docs from', col);
    }

    showToast('✅ Đã xóa ' + totalDeleted + ' bản ghi cũ! App sẽ bắt đầu với data thật.', 'success');
    setTimeout(() => window.location.reload(), 2500);
  } catch(e) {
    console.error('[PURGE] Error:', e);
    showToast('⚠️ Lỗi khi xóa: ' + e.message, 'error');
  }
}


async function cleanupZombieUsers() {
  if (!confirm('⚠️ Hành động này sẽ QUÉT Firebase và XÓA VĨNH VIỄN các tài khoản rác (không nằm trong danh sách chuẩn 16 người).\nBạn có chắc chắn muốn dọn dẹp?')) return;
  
  const db = window.firebaseDB;
  if (!db) {
    showToast('⚠️ Không kết nối được Firebase.', 'error');
    return;
  }

  // Danh sách email chuẩn của 16 tài khoản gốc
  const approvedEmails = [
    'ngan@vimove.net', 'tuyen@vimove.net', 'chi@vimove.net', 'trang@vimove.net',
    'phuong@vimove.net', 'dung.tx@vimove.net', 'hanh@vimove.net', 'loi@vimove.net',
    'thai@vimove.net', 'mai@vimove.net', 'dung.kt@vimove.net', 'duyen@vimove.net',
    'ngan.le@vimove.net', 'sang@vimove.net', 'phong@vimove.net', 'bac@vimove.net'
  ];

  try {
    const snap = await db.collection('viwork_users').get();
    let deletedCount = 0;
    
    // Tạo mảng hứa hẹn để đợi tất cả thao tác xóa xong
    const deletePromises = [];
    
    snap.forEach(doc => {
      const u = doc.data();
      // Xóa nếu email không nằm trong danh sách được phê duyệt ở trên
      if (u.email && !approvedEmails.includes(u.email)) {
        console.log('[CLEANUP] Deleting zombie:', u.email, u.name);
        deletePromises.push(db.collection('viwork_users').doc(doc.id).delete());
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await Promise.all(deletePromises);
      showToast(`✅ Đã xóa vĩnh viễn ${deletedCount} tài khoản rác khỏi Cloud!`, 'success');
      setTimeout(() => window.location.reload(), 2000);
    } else {
      showToast('✨ Không có tài khoản rác nào cần xóa.', 'info');
    }
  } catch(e) {
    console.error('Cleanup error:', e);
    showToast('⚠️ Lỗi khi quét Firebase.', 'error');
  }
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
  return TEAM_MEMBERS.find(m => m.id === id) || { name: 'Người dùng', avatar: '👤' };
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

// ============ TRAINING COURSES (Sprint 7: L&D) ============
const TRAINING_COURSES = [
  {
    id: 'course_ceo',
    title: 'Chương trình đào tạo GĐ Vận hành (CEO)',
    description: 'Chương trình 21 module đào tạo thực chiến: 8 module chung, 8 module đặc thù, 5 module bên ngoài dành riêng cho Giám đốc điều hành.',
    thumbnail: '👑',
    color: 'linear-gradient(135deg,rgba(90,184,0,0.15),rgba(90,184,0,0.05))',
    level: 'advanced',
    durationMins: 1200,
    passingScore: 80,
    positionIds: ['pos_ceo'],
    pathIds: [],
    lessons: [
      { id: 'l_ceo_1', title: 'Vai trò & Bức tranh Vimove (M1)', type: 'text', durationMins: 60, content: 'Mô hình kinh doanh TMĐT vali. Vai trò từng phòng. Cách các phòng kết nối tạo ra GMV. KPI cascade toàn công ty. CEO là người chia sẻ tầm nhìn.' },
      { id: 'l_ceo_2', title: 'Vận hành sàn & Thuật toán ranking (M2)', type: 'text', durationMins: 60, content: 'Shopee algorithm: listing quality score, conversion, CTR, review, SLA. TikTok: watch time, engagement, affiliate seeding. Cách detect thay đổi sớm.' },
      { id: 'l_ceo_3', title: 'Data TMĐT & Dashboard CEO (M3)', type: 'text', durationMins: 90, content: 'Shopee Business Insights, TikTok Seller Center analytics. KPI quan trọng: GMV, CTR, conversion, ROAS, CAC, LTV. CEO đọc data -> ra quyết định.' },
      { id: 'l_ceo_4', title: 'Ads & ROAS Management (M4)', type: 'text', durationMins: 60, content: 'Shopee Ads (Search, Product Ads). TikTok Ads (In-Feed, Spark). Facebook/Meta Shopping. ROAS optimization, A/B testing concept.' },
      { id: 'l_ceo_5', title: 'P&L & Tài chính TMĐT (M5)', type: 'text', durationMins: 90, content: 'Đọc P&L TMĐT: GMV -> doanh thu thuần -> GP% -> chi phí -> EBITDA. Working capital TMDT. Phân bổ ngân sách marketing theo ROI.' },
      { id: 'l_ceo_6', title: 'Lãnh đạo trong môi trường TMĐT (M6)', type: 'text', durationMins: 60, content: 'Coaching GĐ trong startup TMDT tốc độ cao. Xây OKR có chất lượng. Ra quyết định với thông tin không đầy đủ.' },
      { id: 'l_ceo_7', title: 'Quan hệ đối tác & Đàm phán (M7)', type: 'text', durationMins: 60, content: 'Đàm phán với AM sàn (Shopee/TikTok/Lazada): xin priority campaign, spotlight, credit ads. Đàm phán với NCC: exclusivity, MOQ.' },
      { id: 'l_ceo_8', title: 'Module đặc thù & Ngoại khóa (M8-M21)', type: 'text', durationMins: 720, content: 'Executive Coach, Mini MBA thực chiến, Shopee Academy Masterclass. War room simulation xử lý khủng hoảng truyền thông/logistics.' }
    ],
    quiz: {
      questions: [
        { q: 'Theo framework của Vimove, yếu tố nào quan trọng nhất trong P&L TMĐT ảnh hưởng đến ngân sách Marketing?', options: ['GMV', 'GP%', 'Chi phí cố định', 'Số lượng đơn hàng'], answer: 1 },
        { q: 'Chỉ số đo lường độ hài lòng và gắn kết của đội ngũ là gì?', options: ['Turnover Rate', 'eNPS', 'KPI', 'ROI'], answer: 1 }
      ]
    }
  },
  {
    id: 'course_onboard',
    title: 'Onboarding Nhân viên mới',
    description: 'Tổng quan về Vimove, văn hóa công ty, quy trình làm việc và các công cụ hàng ngày.',
    thumbnail: '🚀',
    color: 'linear-gradient(135deg,rgba(90,184,0,0.15),rgba(90,184,0,0.05))',
    level: 'beginner',
    durationMins: 60,
    passingScore: 70,
    positionIds: [],
    pathIds: ['onboarding'],
    lessons: [
      {
        id: 'ob_l1', title: 'Chào mừng đến Vimove', type: 'text', durationMins: 10,
        content: 'Chào mừng bạn gia nhập Vimove!\n\nVimove là nền tảng thương mại điện tử thế hệ mới với sứ mệnh đưa thương mại Việt Nam lên tầm cao mới.\n\n**Sứ mệnh:** Kết nối người bán và người mua thông qua công nghệ thông minh.\n\n**Giá trị cốt lõi:**\n- Tốc độ: Hành động nhanh, học hỏi nhanh\n- Chất lượng: Mọi sản phẩm đều có giá trị thực\n- Đội nhóm: Cùng nhau phát triển\n\n**Cấu trúc tổ chức:**\nBan Giám đốc → Quản lý phòng ban → Nhân viên\n\nHãy đọc kỹ tài liệu nội bộ và đặt câu hỏi cho quản lý của bạn!',
        quiz: {
          questions: [
            { q: 'Giá trị cốt lõi nào sau đây KHÔNG thuộc Vimove?', options: ['Tốc độ','Chất lượng','Cạnh tranh bằng mọi giá','Đội nhóm'], answer: 2 },
            { q: 'Vimove là nền tảng thuộc lĩnh vực nào?', options: ['Logistics','Thương mại điện tử','Fintech','Edtech'], answer: 1 }
          ]
        }
      },
      {
        id: 'ob_l2', title: 'Quy trình làm việc & VIWORK', type: 'text', durationMins: 15,
        content: 'VIWORK là hệ thống quản lý nội bộ của Vimove.\n\n**Các module chính:**\n- **Command Center:** Tổng quan KPI, doanh thu theo thời gian thực\n- **Workflow Board:** Quản lý CVC (Chiến dịch Vận hành Chính)\n- **Giao việc:** Nhận và theo dõi nhiệm vụ từ quản lý\n- **Chấm công:** Check-in bằng GPS hoặc QR tại văn phòng\n- **Đào tạo:** Học và phát triển kỹ năng\n\n**Quy tắc sử dụng:**\n- Cập nhật trạng thái nhiệm vụ mỗi ngày\n- Check-in đúng giờ (8:00 AM)\n- Báo cáo tiến độ hàng tuần qua comment trong task',
        quiz: {
          questions: [
            { q: 'Module nào dùng để check-in hàng ngày?', options: ['Command Center','Workflow Board','Chấm công','CRM'], answer: 2 },
            { q: 'CVC viết tắt của cụm từ nào?', options: ['Công Việc Cần làm','Chiến dịch Vận hành Chính','Chỉ Tiêu Cá nhân','Không có đáp án đúng'], answer: 1 }
          ]
        }
      },
      {
        id: 'ob_l3', title: 'Chính sách lương & KPI', type: 'text', durationMins: 20,
        content: 'Hệ thống lương tại Vimove gồm 2 phần chính:\n\n**1. Lương cứng (Base Salary)**\nThanh toán vào ngày 5 hàng tháng. Được xác định theo vị trí.\n\n**2. Thưởng KPI**\nTính theo % hoàn thành mục tiêu:\n- Dưới 70%: Không có thưởng\n- 70-99%: Thưởng theo tỷ lệ\n- 100%+: Thưởng đầy đủ + bonus xuất sắc 20%\n\n**Phụ cấp:**\n- Ăn trưa, đi lại, điện thoại tùy vị trí\n\n**Theo dõi KPI:** Vào module HR > Thu nhập để xem chi tiết phiếu lương hàng tháng.',
        quiz: {
          questions: [
            { q: 'Lương được thanh toán vào ngày mấy hàng tháng?', options: ['Ngày 1','Ngày 5','Ngày 10','Ngày 15'], answer: 1 },
            { q: 'Đạt bao nhiêu % KPI mới được nhận thưởng?', options: ['50%','60%','70%','80%'], answer: 2 }
          ]
        }
      }
    ]
  },
  {
    id: 'course_sales',
    title: 'Kỹ năng Bán hàng Vimove',
    description: 'Quy trình bán hàng chuẩn, kỹ năng tư vấn, xử lý từ chối và chốt đơn hiệu quả trên các kênh.',
    thumbnail: '🛒',
    color: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(99,102,241,0.05))',
    level: 'intermediate',
    durationMins: 90,
    passingScore: 75,
    positionIds: ['pos_sales'],
    pathIds: [],
    lessons: [
      {
        id: 'sales_l1', title: 'Hiểu nhu cầu khách hàng', type: 'text', durationMins: 20,
        content: '**Nguyên tắc vàng: Nghe trước, bán sau**\n\nKhách hàng không mua sản phẩm — họ mua giải pháp cho vấn đề của mình.\n\n**Mô hình SPIN Selling:**\n- **S**ituation (Tình huống): Khách đang ở đâu?\n- **P**roblem (Vấn đề): Họ đang gặp khó khăn gì?\n- **I**mplication (Ảnh hưởng): Vấn đề đó ảnh hưởng thế nào?\n- **N**eed-payoff (Giải pháp): Sản phẩm giải quyết được không?\n\n**Kỹ thuật lắng nghe tích cực:**\n1. Dừng suy nghĩ về câu trả lời khi khách đang nói\n2. Gật đầu, xác nhận (à, vâng, tôi hiểu...)\n3. Đặt câu hỏi mở: "Bạn có thể kể thêm về...?"\n4. Tóm tắt lại những gì khách nói',
        quiz: {
          questions: [
            { q: 'SPIN Selling — chữ "I" đại diện cho điều gì?', options: ['Idea','Implication','Innovation','Impact'], answer: 1 },
            { q: 'Trong kỹ thuật lắng nghe tích cực, bạn nên làm gì khi khách đang nói?', options: ['Chuẩn bị câu trả lời','Dừng suy nghĩ về câu trả lời','Kiểm tra điện thoại','Ghi chép thật nhiều'], answer: 1 }
          ]
        }
      },
      {
        id: 'sales_l2', title: 'Xử lý từ chối & phản đối', type: 'text', durationMins: 25,
        content: '**Từ chối KHÔNG phải là thất bại — đó là cơ hội!**\n\nCác loại từ chối phổ biến:\n\n**1. "Giá cao quá"**\n→ Không giảm giá ngay! Hỏi: "So với điều gì ạ?"\n→ Nhấn mạnh giá trị, không phải giá tiền\n→ Chia nhỏ: "Chỉ X đồng/ngày"\n\n**2. "Tôi cần nghĩ thêm"**\n→ "Bạn đang cân nhắc điều gì cụ thể?" \n→ Xác định phần chưa chắc chắn\n→ Đặt lịch follow-up cụ thể\n\n**3. "Tôi đang dùng của bên khác"**\n→ Hỏi về trải nghiệm hiện tại\n→ Đề xuất dùng thử song song\n→ Không chỉ trích đối thủ\n\n**Công thức: Acknowledge → Clarify → Respond → Confirm**',
        quiz: {
          questions: [
            { q: 'Khi khách nói "giá cao quá", phản ứng đúng là gì?', options: ['Giảm giá ngay','Kết thúc cuộc gọi','Hỏi so với điều gì','Im lặng'], answer: 2 },
            { q: 'Công thức xử lý từ chối là gì?', options: ['Ask-Listen-Respond','Acknowledge-Clarify-Respond-Confirm','Agree-Disagree-Close','None of above'], answer: 1 }
          ]
        }
      },
      {
        id: 'sales_l3', title: 'Chốt đơn & Follow-up', type: 'video', durationMins: 30,
        content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        linkTitle: 'Video: Kỹ thuật chốt đơn hiệu quả',
        notes: 'Sau khi xem video, hãy ghi nhớ 3 kỹ thuật chốt đơn: Assumptive Close, Alternative Close, và Urgency Close.',
        quiz: {
          questions: [
            { q: 'Assumptive Close là kỹ thuật gì?', options: ['Giả định khách đã đồng ý mua','Tạo áp lực thời gian','Đưa ra 2 lựa chọn','Giảm giá cuối cùng'], answer: 0 },
            { q: 'Follow-up lý tưởng nên thực hiện trong vòng bao lâu?', options: ['1 tuần','24-48 giờ','1 tháng','Chờ khách gọi lại'], answer: 1 }
          ]
        }
      }
    ]
  },
  {
    id: 'course_marketing',
    title: 'Marketing Digital Vimove',
    description: 'Facebook Ads, TikTok content, SEO cơ bản và cách đo lường hiệu quả chiến dịch marketing.',
    thumbnail: '📣',
    color: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))',
    level: 'intermediate',
    durationMins: 100,
    passingScore: 70,
    positionIds: ['pos_marketing'],
    pathIds: [],
    lessons: [
      {
        id: 'mkt_l1', title: 'Facebook Ads — Cơ bản', type: 'text', durationMins: 30,
        content: '**Facebook Ads — 3 cấp độ:**\n\n**1. Campaign (Chiến dịch)**\n- Mục tiêu: Awareness / Traffic / Conversion / Sales\n- Chọn mục tiêu phù hợp với giai đoạn funnel\n\n**2. Ad Set (Nhóm quảng cáo)**\n- Target audience: tuổi, giới tính, sở thích, hành vi\n- Ngân sách & lịch chạy\n- Placement: Feed, Stories, Reels\n\n**3. Ad (Mẫu quảng cáo)**\n- Creative: ảnh, video, carousel\n- Copy: Headline + Body + CTA\n\n**Chỉ số quan trọng:**\n- **CTR** (Click-Through Rate): > 1% là tốt\n- **CPC** (Cost Per Click): Càng thấp càng tốt\n- **ROAS** (Return on Ad Spend): Mục tiêu > 3x\n- **CPM** (Cost Per 1000 Impressions): Benchmark thị trường VN ~30-50k',
        quiz: {
          questions: [
            { q: 'ROAS là viết tắt của gì?', options: ['Rate of Ad Spending','Return on Ad Spend','Revenue of Ad Sales','Result of Ad Strategy'], answer: 1 },
            { q: 'CTR tốt trên Facebook thường là bao nhiêu?', options: ['> 0.1%','> 1%','> 10%','> 50%'], answer: 1 }
          ]
        }
      },
      {
        id: 'mkt_l2', title: 'TikTok Content & Viral', type: 'link', durationMins: 25,
        content: 'https://docs.google.com/document/d/vimove-tiktok-guide',
        linkTitle: 'Tài liệu: Hướng dẫn tạo content TikTok Vimove',
        notes: '**Công thức video TikTok viral:**\n\n- **3 giây đầu tiên:** Hook mạnh — câu hỏi, shock value, hoặc câu hỏi tò mò\n- **Giữ người xem:** Pacing nhanh, chuyển cảnh liên tục\n- **CTA cuối:** Like, Follow, Comment\n- **Hashtag:** 3-5 hashtag liên quan + 1 trending\n\n**Lịch đăng content Vimove:** Thứ 3, 5, 7 lúc 8h và 20h',
        quiz: {
          questions: [
            { q: 'Lịch đăng TikTok của Vimove là ngày nào?', options: ['Thứ 2,4,6','Thứ 3,5,7','Mỗi ngày','Cuối tuần'], answer: 1 },
            { q: 'Hook trong 3 giây đầu video nhằm mục đích gì?', options: ['Giới thiệu sản phẩm','Giữ người xem không bỏ qua','Bán hàng ngay','Tăng follower'], answer: 1 }
          ]
        }
      },
      {
        id: 'mkt_l3', title: 'Đo lường & Báo cáo Marketing', type: 'text', durationMins: 20,
        content: '**Vòng đời đo lường chiến dịch:**\n\n**1. Thiết lập KPI trước khi chạy**\n- Mục tiêu cụ thể: bao nhiêu leads, bao nhiêu đơn hàng\n- Ngân sách tối đa CPA (Cost Per Acquisition)\n\n**2. Theo dõi trong chiến dịch**\n- Kiểm tra số liệu mỗi 24h\n- Tắt ad không hiệu quả (CTR < 0.5% sau 3 ngày)\n- Scale ad hiệu quả (tăng ngân sách 20%/ngày)\n\n**3. Báo cáo kết quả**\n- So sánh với KPI ban đầu\n- Bài học rút ra\n- Kế hoạch tháng tiếp theo\n\n**Template báo cáo Vimove:**\nSpend → Reach → Click → Lead → Order → Revenue → ROAS',
        quiz: {
          questions: [
            { q: 'Nên tắt ad khi CTR dưới bao nhiêu sau 3 ngày?', options: ['0.1%','0.5%','1%','2%'], answer: 1 },
            { q: 'CPA viết tắt của gì?', options: ['Content Per Ad','Cost Per Acquisition','Click Per Action','Customer Per Ad'], answer: 1 }
          ]
        }
      }
    ]
  }
];

// ============ HTML ESCAPE (primary location — also in workflow.js as fallback) ============
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
