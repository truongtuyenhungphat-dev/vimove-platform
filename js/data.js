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
const DATA_VERSION = 'viwork_v2.5';

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
  { id: 'u002', name: 'Nguyễn Thị Thanh Ngân',  role: 'admin',   avatar: 'NTN',  department: 'Quản trị & Phê duyệt',      kpi: 100, revenue: 0, tasks: 0 },
  { id: 'u001', name: 'Trương Ngọc Tuyền',      role: 'admin',   avatar: 'TNT',  department: 'Digital & Hỗ trợ kỹ thuật', kpi: 95,  revenue: 0, tasks: 0 },
  { id: 'u013', name: 'Trịnh Linh Chi',         role: 'admin',   avatar: 'TL',   department: 'HR',                        kpi: 0,   revenue: 0, tasks: 0 },
  // QUẢN LÝ
  { id: 'u003', name: 'Nguyễn Thị Quỳnh Trang', role: 'manager', avatar: 'NQT',  department: 'HR & MKT & Sale',           kpi: 85,  revenue: 0, tasks: 0 },
  { id: 'u005', name: 'Hoàng Quỳnh Phương',      role: 'manager', avatar: 'HQP',  department: 'Content Lead',              kpi: 88,  revenue: 0, tasks: 0 },
  { id: 'u006', name: 'Trương Xuân Dũng',        role: 'manager', avatar: 'TXD',  department: 'Lead Sản phẩm',             kpi: 82,  revenue: 0, tasks: 0 },
  { id: 'u007', name: 'Vũ Phương Hạnh',          role: 'manager', avatar: 'VPH',  department: 'Lead Sản phẩm',             kpi: 79,  revenue: 0, tasks: 0 },
  { id: 'u008', name: 'Nguyễn Văn Lợi',          role: 'manager', avatar: 'NV',   department: 'Kênh cá nhân',              kpi: 72,  revenue: 0, tasks: 0 },
  // NHÂN VIÊN

  { id: 'u010', name: 'Lê Thị Anh Thái',         role: 'staff',   avatar: 'LTAT', department: 'Content',                   kpi: 75,  revenue: 0, tasks: 0 },
  { id: 'u011', name: 'Phạm Thanh Mai',          role: 'staff',   avatar: 'PTM',  department: 'Thiết kế',                  kpi: 85,  revenue: 0, tasks: 0 },
  { id: 'u012', name: 'Khuất Thị Dung',          role: 'staff',   avatar: 'KT',   department: 'Design',                    kpi: 83,  revenue: 0, tasks: 0 },
  { id: 'u014', name: 'Phạm Mỹ Duyên',           role: 'staff',   avatar: 'PM',   department: 'Media',                     kpi: 0,   revenue: 0, tasks: 0 },
  { id: 'u009', name: 'Lê Ngân',                 role: 'staff',   avatar: 'LN',   department: 'Content Marketing',         kpi: 80,  revenue: 0, tasks: 0 },
  { id: 'u015', name: 'Bùi Thị Ngọc Sang',       role: 'staff',   avatar: 'BT',   department: 'Content Marketing',         kpi: 0,   revenue: 0, tasks: 0 },
  { id: 'u016', name: 'Lương Văn Phong',         role: 'staff',   avatar: 'LV',   department: 'Media',                     kpi: 0,   revenue: 0, tasks: 0 },
  { id: 'u017', name: 'Lý Việt Bắc',             role: 'staff',   avatar: 'LV',   department: 'Content Marketing',         kpi: 0,   revenue: 0, tasks: 0 },
];

/* ========================================================
   POSITIONS — Vị trí & KPI & Thu nhập Vimove 2026
   ======================================================== */
const POSITIONS = [
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
const SALARY_POLICY = {
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
const USER_ALLOWANCES = {
  'u001': { lunch: 1000000, transport: 500000, phone: 500000, housing: 0,       other: 0,       note: 'Phụ cấp kỹ thuật' },
  'u002': { lunch: 1000000, transport: 500000, phone: 500000, housing: 0,       other: 0,       note: 'Phụ cấp quản trị' },
  'u003': { lunch: 800000,  transport: 400000, phone: 300000, housing: 0,       other: 0,       note: '' },
  'u004': { lunch: 800000,  transport: 400000, phone: 300000, housing: 0,       other: 0,       note: '' },
  'u005': { lunch: 800000,  transport: 400000, phone: 300000, housing: 0,       other: 0,       note: 'Phụ cấp lead content' },
  'u006': { lunch: 800000,  transport: 400000, phone: 300000, housing: 0,       other: 0,       note: '' },
  'u007': { lunch: 800000,  transport: 400000, phone: 300000, housing: 0,       other: 0,       note: '' },
  'u008': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0,       other: 0,       note: '' },
  'u009': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0,       other: 0,       note: '' },
  'u010': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0,       other: 0,       note: '' },
  'u011': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0,       other: 0,       note: '' },
  'u012': { lunch: 700000,  transport: 300000, phone: 200000, housing: 0,       other: 0,       note: '' },
};

/* ========================================================
   KPI_ACTUALS — Số liệu KPI thực tế từng tháng (Admin nhập)
   key: 'userId_YYYY-MM'
   ======================================================== */
const KPI_ACTUALS = {
  // Ví dụ cấu trúc — Admin nhập qua form trong app
  // 'u005_2026-04': { posts: 18, videos: 7, tasks_done: 88, approved: true, approvedBy: 'u002', approvedAt: '2026-05-05' }
};

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

// ============ INITIAL ASSIGNMENTS (Giao việc demo) ============
const INITIAL_ASSIGNMENTS = [
  {
    id: 'asgn001',
    title: 'Thiết kế banner TikTok tuần 18 (Vali Basic)',
    desc: 'Tạo 3 banner ảnh 1080x1920 cho TikTok ra mắt vali Basic. Style trẻ trung, màu xanh Vimove, font Manrope.',
    assignedTo: 'u011',   // Phạm Thanh Mai
    assignedBy: 'u002',   // Ngân
    priority: 'urgent',
    category: 'marketing',
    deadline: getFutureDate(2),
    dueTime: '17:00',
    status: 'accepted',
    note: '',
    createdAt: getPastDate(1) + 'T08:00:00.000Z',
    updatedAt: getPastDate(0) + 'T09:00:00.000Z',
    completedAt: null,
    comments: [
      { author: 'u002', text: 'Việc được giao mới.', date: getPastDate(1) },
      { author: 'u011', text: 'Đã nhận việc, đang lên concept.', date: getPastDate(0) },
    ],
  },
  {
    id: 'asgn002',
    title: 'Lên lịch Content Calendar tháng 5 — TikTok + Facebook',
    desc: 'Lập Content Calendar cho T5/2026: 30 bài TikTok + 20 bài Facebook. Mỗi bài cần có chủ đề, format, CTA rõ ràng.',
    assignedTo: 'u009',   // Lê Thị Ngân
    assignedBy: 'u005',   // Phương
    priority: 'high',
    category: 'marketing',
    deadline: getFutureDate(4),
    dueTime: '18:00',
    status: 'in_progress',
    note: '',
    createdAt: getPastDate(3) + 'T09:00:00.000Z',
    updatedAt: getPastDate(1) + 'T10:00:00.000Z',
    completedAt: null,
    comments: [
      { author: 'u005', text: 'Việc được giao mới.', date: getPastDate(3) },
      { author: 'u009', text: 'Đã bắt đầu lên lịch, khoảng 40% xong.', date: getPastDate(1) },
    ],
  },
  {
    id: 'asgn003',
    title: 'Chụp ảnh sản phẩm vali Basic (bộ ảnh background trắng)',
    desc: 'Chụp full bộ ảnh vali Basic cho website + Shopee: 10 góc khác nhau, background trắng, ảnh chi tiết khóa/bánh xe.',
    assignedTo: 'u012',   // Khuất Thị Dung
    assignedBy: 'u002',   // Ngân
    priority: 'high',
    category: 'ops',
    deadline: getFutureDate(5),
    dueTime: '12:00',
    status: 'pending',
    note: '',
    createdAt: getPastDate(0) + 'T14:00:00.000Z',
    updatedAt: getPastDate(0) + 'T14:00:00.000Z',
    completedAt: null,
    comments: [
      { author: 'u002', text: 'Việc được giao mới.', date: getPastDate(0) },
    ],
  },
  {
    id: 'asgn004',
    title: 'Đăng tin tuyển dụng lên Facebook Groups + JobStreet',
    desc: 'Viết và đăng tin tuyển 2 nhân viên Live TikTok trên các nhóm FB tuyển dụng TPHCM và JobStreet.',
    assignedTo: 'u003',   // Trang
    assignedBy: 'u002',   // Ngân
    priority: 'medium',
    category: 'hr',
    deadline: getFutureDate(1),
    dueTime: '09:00',
    status: 'done',
    note: 'Đã đăng 5 nhóm Facebook + JobStreet, nhận được 12 CV.',
    createdAt: getPastDate(5) + 'T08:00:00.000Z',
    updatedAt: getPastDate(2) + 'T11:00:00.000Z',
    completedAt: getPastDate(2) + 'T11:00:00.000Z',
    comments: [
      { author: 'u002', text: 'Việc được giao mới.', date: getPastDate(5) },
      { author: 'u003', text: 'Đã đăng đầy đủ. Nhận 12 CV, đang sắp xếp phỏng vấn.', date: getPastDate(2) },
    ],
  },
  {
    id: 'asgn005',
    title: 'Viết 5 video script style Taki cho @anhchuvali',
    desc: 'Viết kịch bản 5 video TikTok theo phong cách Taki (kể chuyện, hài hước, có hook đầu mạnh) cho kênh @anhchuvali.',
    assignedTo: 'u010',   // Lê Thị Anh Thái
    assignedBy: 'u005',   // Phương
    priority: 'medium',
    category: 'marketing',
    deadline: getFutureDate(3),
    dueTime: '17:00',
    status: 'accepted',
    note: '',
    createdAt: getPastDate(2) + 'T10:00:00.000Z',
    updatedAt: getPastDate(1) + 'T15:00:00.000Z',
    completedAt: null,
    comments: [
      { author: 'u005', text: 'Việc được giao mới.', date: getPastDate(2) },
      { author: 'u010', text: 'Đã nhận, đang nghiên cứu kênh Taki để lấy cảm hứng.', date: getPastDate(1) },
    ],
  },
  {
    id: 'asgn006',
    title: 'Setup Meta Pixel + TikTok Pixel lên website',
    desc: 'Cài đặt và xác minh Meta Pixel, TikTok Pixel trên website Vimove. Test event: PageView, AddToCart, Purchase.',
    assignedTo: 'u004',   // Dương Minh Đức
    assignedBy: 'u001',   // Tuyền
    priority: 'urgent',
    category: 'ops',
    deadline: getFutureDate(2),
    dueTime: '12:00',
    status: 'in_progress',
    note: '',
    createdAt: getPastDate(2) + 'T08:00:00.000Z',
    updatedAt: getPastDate(0) + 'T08:00:00.000Z',
    completedAt: null,
    comments: [
      { author: 'u001', text: 'Việc được giao mới.', date: getPastDate(2) },
      { author: 'u004', text: 'Đã cài Meta Pixel xong, đang test TikTok Pixel.', date: getPastDate(0) },
    ],
  },
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

    // 6. Lắng nghe Dữ liệu Giao việc (Assignments)
    window.fbListenAssignments(asgns => {
      appState.assignments = asgns;
      if (typeof renderAssignments === 'function' && document.getElementById('page-assignments')?.classList.contains('active')) {
        renderAssignments();
      }
      if (typeof updateAsgnBadge === 'function') updateAsgnBadge();
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
