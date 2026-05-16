/* ================================================
   VIWORK — Training & Development Module
   Sprint 7: L&D — Lộ trình, E-learning, Quiz
   ================================================ */

// ============ STATE ============
const trainingState = {
  tab: 'path',         // path | catalog | progress
  courseId: null,      // Khóa đang xem
  lessonIdx: 0,        // Bài đang xem trong khóa
  quizState: null,     // { answers:[], submitted:false, score:0 }
};

// ============ ENROLLMENTS (local cache, synced to Firebase) ============
let TRAINING_ENROLLMENTS = {}; // userId -> { courseId -> enrollment }

// ============ INIT ============
function initTraining() {
  // Load enrollments from localStorage fallback
  try {
    const saved = JSON.parse(localStorage.getItem('viwork_training') || '{}');
    TRAINING_ENROLLMENTS = saved;
  } catch(e) {}
}

// ============ MAIN RENDER ============
function renderTraining() {
  initTraining();
  const page = document.getElementById('page-training');
  if (!page) return;

  const tabs = [
    { id: 'path',     icon: '🗺️', label: 'Lộ trình của tôi' },
    { id: 'catalog',  icon: '📚', label: 'Khóa học' },
    { id: 'progress', icon: '📊', label: 'Tiến độ đội nhóm',
      hidden: currentUser?.role === 'staff' },
    { id: 'manage',   icon: '⚙️', label: 'Quản lý khóa học',
      hidden: currentUser?.role !== 'admin' },
  ];

  page.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-h1">🎓 Đào tạo & Phát triển</h1>
        <p class="page-sub">Lộ trình học tập · E-learning · Bài kiểm tra · Theo dõi tiến độ</p>
      </div>
    </div>
    <div class="training-tabs">
      ${tabs.filter(t => !t.hidden).map(t =>
        `<button class="training-tab ${trainingState.tab===t.id?'active':''}"
          onclick="switchTrainingTab('${t.id}')">${t.icon} ${t.label}</button>`
      ).join('')}
    </div>
    <div id="trainingBody"></div>
  `;

  renderTrainingBody();
}

function switchTrainingTab(tab) {
  trainingState.tab = tab;
  trainingState.courseId = null;
  trainingState.lessonIdx = 0;
  renderTrainingBody();
  document.querySelectorAll('.training-tab').forEach(b => b.classList.remove('active'));
  ['path','catalog','progress','manage'].filter(t => {
    if (t==='progress' && currentUser?.role==='staff') return false;
    if (t==='manage'   && currentUser?.role!=='admin') return false;
    return true;
  }).indexOf(tab);
  document.querySelectorAll('.training-tab').forEach(b => {
    if (b.textContent.includes(tab==='path'?'Lộ':tab==='catalog'?'Khóa':tab==='progress'?'Tiến':'&')) {}
  });
  // Simpler: re-render whole training page to reset active tabs
  renderTraining();
}

function renderTrainingBody() {
  const el = document.getElementById('trainingBody');
  if (!el) return;
  if (trainingState.courseId && trainingState.tab !== 'manage') { renderCourseDetail(el); return; }
  switch(trainingState.tab) {
    case 'path':     renderMyPath(el);         break;
    case 'catalog':  renderCatalog(el);        break;
    case 'progress': renderProgressDash(el);   break;
    case 'manage':   renderManageCourses(el);  break;
  }
}

// ============ TAB 1: LỘ TRÌNH CỦA TÔI ============
function renderMyPath(el) {
  const uid  = currentUser?.id;
  const pos  = currentUser?.positionId || '';

  // Lọc lộ trình phù hợp: Onboarding (everyone) + gắn vị trí + được chỉ định trực tiếp
  const myPaths = (TRAINING_COURSES || []).filter(c =>
    c.pathIds?.includes('onboarding') ||
    (c.positionIds?.length === 0 && (!c.assignedUserIds || c.assignedUserIds.length === 0)) ||
    (pos && c.positionIds?.includes(pos)) ||
    (c.assignedUserIds?.includes(uid))
  );

  // Tính overall progress
  const totalLessons = myPaths.reduce((s,c) => s + (c.lessons?.length||0), 0);
  const doneLessons  = myPaths.reduce((s,c) => {
    const enr = getEnrollment(uid, c.id);
    return s + (enr?.completedLessons?.length || 0);
  }, 0);
  const overallPct = totalLessons > 0 ? Math.round(doneLessons/totalLessons*100) : 0;

  const completedCourses = myPaths.filter(c => getEnrollment(uid,c.id)?.status==='completed').length;

  el.innerHTML = `
    <!-- Hero -->
    <div class="lp-hero">
      <div class="lp-hero-icon">🎓</div>
      <div class="lp-hero-info" style="flex:1">
        <h2>Lộ trình đào tạo của ${currentUser?.name?.split(' ').pop()}</h2>
        <p>${completedCourses}/${myPaths.length} khóa hoàn thành · ${doneLessons}/${totalLessons} bài học</p>
        <div class="lp-progress-bar-wrap">
          <div class="lp-progress-bar-bg">
            <div class="lp-progress-bar-fill" style="width:${overallPct}%"></div>
          </div>
          <div class="lp-progress-pct">${overallPct}%</div>
        </div>
      </div>
      <!-- Huy hiệu -->
      <div>
        ${renderMyBadges(uid, myPaths)}
      </div>
    </div>

    <!-- Danh sách các bước lộ trình -->
    <div class="roadmap-steps">
      ${myPaths.map((c, i) => {
        const enr = getEnrollment(uid, c.id);
        const pct = getCourseProgress(uid, c.id, c);
        const isDone   = enr?.status === 'completed';
        const isActive = !isDone && (i === 0 || getEnrollment(uid, myPaths[i-1]?.id)?.status === 'completed');
        const isLocked = !isDone && !isActive;
        return `
        <div class="roadmap-step ${isDone?'completed':''} ${isActive?'active':''} ${isLocked?'locked':''}"
          onclick="${isLocked ? '' : `openCourse('${c.id}')`}">
          <div class="step-num">${isDone ? '✓' : i+1}</div>
          <div class="step-body">
            <div class="step-title">${c.thumbnail} ${c.title}</div>
            <div class="step-meta">
              <span>⏱ ${c.durationMins} phút</span>
              <span>📖 ${c.lessons?.length||0} bài học</span>
              ${pct > 0 && !isDone ? `<span style="color:var(--c-primary-light)">▶ ${pct}% hoàn thành</span>` : ''}
            </div>
          </div>
          <div class="step-badge ${isDone?'done':isActive?'active':'locked'}">
            ${isDone ? '✅ Xong' : isActive ? '▶ Đang học' : '🔒 Chưa mở'}
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

function renderMyBadges(uid, paths) {
  const completedCount = paths.filter(c => getEnrollment(uid,c.id)?.status==='completed').length;
  const badges = [
    { icon:'🌱', name:'Khởi đầu',  earned: completedCount >= 1 },
    { icon:'⚡', name:'Tiến bộ',   earned: completedCount >= 2 },
    { icon:'🏆', name:'Xuất sắc',  earned: completedCount >= 3 },
    { icon:'🎓', name:'Chuyên gia',earned: completedCount >= paths.length && paths.length > 0 },
  ];
  return `<div class="badge-grid">
    ${badges.map(b => `
      <div class="achievement-badge ${b.earned?'earned':'locked'}" title="${b.name}">
        <div class="badge-icon">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
      </div>`).join('')}
  </div>`;
}

// ============ TAB 2: CATALOG ============
function renderCatalog(el) {
  const courses = TRAINING_COURSES || [];
  const uid = currentUser?.id;
  const pos = currentUser?.positionId || '';
  const isAdminUser = currentUser?.role === 'admin';

  // Admin thấy tất cả, còn lại chỉ thấy khóa phù hợp
  const visible = isAdminUser ? courses : courses.filter(c =>
    c.pathIds?.includes('onboarding') ||
    (c.positionIds?.length === 0 && (!c.assignedUserIds || c.assignedUserIds.length === 0)) ||
    (pos && c.positionIds?.includes(pos)) ||
    c.assignedUserIds?.includes(uid)
  );

  const audienceBadges = c => {
    let badges = '';
    if (c.pathIds?.includes('onboarding'))
      badges += '<span style="font-size:10px;padding:2px 8px;border-radius:20px;background:rgba(245,158,11,0.15);color:#F59E0B;font-weight:700">🔗 Onboarding</span>';
    (c.positionIds||[]).forEach(pid => {
      const p = (POSITIONS||[]).find(x => x.id === pid);
      if (p) badges += `<span style="font-size:10px;padding:2px 8px;border-radius:20px;background:rgba(59,130,246,0.12);color:#3B82F6;font-weight:700">${p.icon} ${p.name}</span>`;
    });
    (c.assignedUserIds||[]).slice(0,3).forEach(uid2 => {
      const m = TEAM_MEMBERS.find(x => x.id === uid2);
      if (m) badges += `<span style="font-size:10px;padding:2px 8px;border-radius:20px;background:rgba(16,185,129,0.12);color:#10B981;font-weight:700">👤 ${m.name.split(' ').pop()}</span>`;
    });
    if ((c.assignedUserIds||[]).length > 3)
      badges += `<span style="font-size:10px;color:var(--c-text-3)">+${c.assignedUserIds.length - 3}</span>`;
    return badges;
  };

  el.innerHTML = `
    <div class="course-grid">
      ${visible.map(c => {
        const pct = getCourseProgress(uid, c.id, c);
        const enr = getEnrollment(uid, c.id);
        const isDone = enr?.status === 'completed';
        const bg = c.color || 'rgba(90,184,0,0.1)';
        const badges = audienceBadges(c);
        return `
        <div class="course-card" onclick="openCourse('${c.id}')">
          <div class="course-card-thumb" style="background:${bg}">${c.thumbnail}</div>
          <div class="course-card-body">
            <div class="course-card-title">${c.title}</div>
            <div class="course-card-desc">${c.description}</div>
            ${badges ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">${badges}</div>` : ''}
            <div class="course-card-meta">
              <span class="course-level level-${c.level}">${{beginner:'Cơ bản',intermediate:'Trung cấp',advanced:'Nâng cao'}[c.level]||c.level}</span>
              <span style="font-size:11px;color:var(--c-text-3)">⏱ ${c.durationMins} phút</span>
              <span style="font-size:11px;color:var(--c-text-3)">📖 ${c.lessons?.length||0} bài</span>
            </div>
          </div>
          <div class="course-card-footer">
            <div class="course-progress-mini">
              <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
              <div class="pct">${pct}%</div>
            </div>
            <span style="font-size:11px;font-weight:700;color:${isDone?'#10B981':'var(--c-primary-light)'}">
              ${isDone ? '✅ Hoàn thành' : pct > 0 ? '▶ Tiếp tục' : '▶ Bắt đầu'}
            </span>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

// ============ MỞ KHÓA HỌC ============
function openCourse(courseId) {
  trainingState.courseId = courseId;
  trainingState.lessonIdx = 0;
  trainingState.quizState = null;
  renderTrainingBody();
}

function closeCourse() {
  trainingState.courseId = null;
  trainingState.lessonIdx = 0;
  trainingState.quizState = null;
  renderTrainingBody();
}

function renderCourseDetail(el) {
  const course = (TRAINING_COURSES||[]).find(c => c.id === trainingState.courseId);
  if (!course) { closeCourse(); return; }
  const uid = currentUser?.id;
  const enr = getEnrollment(uid, course.id) || {};
  const completed = enr.completedLessons || [];
  const pct = getCourseProgress(uid, course.id, course);
  const lessonIdx = trainingState.lessonIdx;
  const lesson = course.lessons?.[lessonIdx];

  el.innerHTML = `
    <div class="back-btn" onclick="closeCourse()">← Quay lại</div>
    <div class="course-detail-layout">
      <!-- Trình xem bài học -->
      <div>
        ${lesson ? renderLessonViewer(lesson, lessonIdx, course, completed) : '<div class="col-empty">Chưa có bài học</div>'}
      </div>
      <!-- Sidebar: danh sách bài học -->
      <div>
        <div style="background:var(--c-surface);border:1px solid var(--c-border-subtle);border-radius:var(--r-xl);overflow:hidden">
          <div style="padding:16px 18px;border-bottom:1px solid var(--c-border-subtle)">
            <div style="font-size:16px;font-weight:800;margin-bottom:4px">${course.thumbnail} ${course.title}</div>
            <div class="course-progress-mini" style="margin-top:8px">
              <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
              <div class="pct">${pct}%</div>
            </div>
          </div>
          <div class="lesson-list" style="padding:10px">
            ${(course.lessons||[]).map((l, i) => {
              const isDone   = completed.includes(l.id);
              const isActive = i === lessonIdx;
              const isLocked = i > 0 && !completed.includes(course.lessons[i-1]?.id);
              const typeIcon = {text:'📄', video:'🎬', link:'🔗'}[l.type] || '📄';
              return `
              <div class="lesson-item ${isDone?'done':''} ${isActive?'active':''} ${isLocked?'locked':''}"
                onclick="${isLocked ? '' : `selectLesson(${i})`}">
                <div class="lesson-icon">${typeIcon}</div>
                <div class="lesson-title">${l.title}</div>
                <div class="lesson-dur">${l.durationMins}ph</div>
                <div class="lesson-check">${isDone ? '✅' : isLocked ? '🔒' : ''}</div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function selectLesson(idx) {
  trainingState.lessonIdx = idx;
  trainingState.quizState = null;
  renderTrainingBody();
}

// ============ LESSON VIEWER ============
function renderLessonViewer(lesson, idx, course, completed) {
  const uid = currentUser?.id;
  const isDone = completed.includes(lesson.id);
  const isLast = idx === (course.lessons?.length||1) - 1;
  const qs = trainingState.quizState;

  let bodyHtml = '';
  if (qs) {
    bodyHtml = renderQuizUI(lesson, course);
  } else {
    if (lesson.type === 'video') {
      const embedUrl = convertYouTubeUrl(lesson.content);
      bodyHtml = `<div class="lesson-video-wrap">
        <iframe src="${embedUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
      </div><div>${lesson.notes || ''}</div>`;
    } else if (lesson.type === 'link') {
      bodyHtml = `
        <a class="lesson-link-card" href="${lesson.content}" target="_blank" rel="noopener">
          <div class="lesson-link-icon">🔗</div>
          <div class="lesson-link-info">
            <div class="link-title">${lesson.linkTitle || 'Mở tài liệu'}</div>
            <div class="link-url">${lesson.content}</div>
          </div>
          <span>→</span>
        </a>
        <div>${lesson.notes || ''}</div>`;
    } else {
      bodyHtml = `<div>${(lesson.content||'').replace(/\n/g,'<br>')}</div>`;
    }
  }

  return `
    <div class="lesson-viewer">
      <div class="lesson-viewer-header">
        <span style="font-size:20px">{{${lesson.type==='video'?'🎬':lesson.type==='link'?'🔗':'📄'}}}</span>
        <h3>${lesson.title}</h3>
        ${isDone ? '<span style="color:#10B981;font-weight:700">✅ Đã hoàn thành</span>' : ''}
      </div>
      <div class="lesson-viewer-body">${bodyHtml}</div>
      <div class="lesson-viewer-footer">
        <div style="display:flex;gap:8px">
          ${idx > 0 ? `<button class="btn-outline sm" onclick="selectLesson(${idx-1})">← Trước</button>` : ''}
        </div>
        <div style="display:flex;gap:8px">
          ${lesson.quiz && !qs && !isDone
            ? `<button class="btn-primary" onclick="startQuiz()">📝 Làm bài kiểm tra</button>`
            : !isDone && !qs
              ? `<button class="btn-primary" onclick="markLessonDone('${lesson.id}','${course.id}')">✅ Đánh dấu hoàn thành</button>`
              : ''}
          ${isDone && !isLast
            ? `<button class="btn-primary" onclick="selectLesson(${idx+1})">Bài tiếp → </button>`
            : ''}
        </div>
      </div>
    </div>`;
}

function convertYouTubeUrl(url) {
  if (!url) return '';
  const m = url.match(/(?:youtu\.be\/|watch\?v=|embed\/)([^&\s?]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : url;
}

// ============ MARK LESSON DONE ============
function markLessonDone(lessonId, courseId) {
  const uid = currentUser?.id;
  const course = (TRAINING_COURSES||[]).find(c => c.id === courseId);
  if (!course) return;
  let enr = getEnrollment(uid, courseId) || {
    userId: uid, courseId,
    enrolledAt: new Date().toISOString(),
    status: 'in_progress',
    completedLessons: [], quizResults: {}, overallProgress: 0, completedAt: null
  };
  if (!enr.completedLessons.includes(lessonId)) enr.completedLessons.push(lessonId);
  const pct = Math.round(enr.completedLessons.length / (course.lessons?.length||1) * 100);
  enr.overallProgress = pct;
  if (pct >= 100) { enr.status = 'completed'; enr.completedAt = new Date().toISOString(); }
  else enr.status = 'in_progress';

  saveEnrollment(uid, courseId, enr);
  showToast(pct >= 100 ? `🎉 Hoàn thành khóa "${course.title}"!` : '✅ Bài học đã hoàn thành!', 'success');

  // Move to next lesson
  const nextIdx = trainingState.lessonIdx + 1;
  if (nextIdx < (course.lessons?.length||0)) {
    trainingState.lessonIdx = nextIdx;
  }
  trainingState.quizState = null;
  renderTrainingBody();
}

// ============ QUIZ ============
function startQuiz() {
  trainingState.quizState = { answers: [], submitted: false, score: 0 };
  renderTrainingBody();
}

function renderQuizUI(lesson, course) {
  const qs = trainingState.quizState;
  const questions = lesson.quiz?.questions || [];

  if (qs.submitted) {
    const pass = qs.score >= (course.passingScore || 70);
    return `
      <div class="quiz-result">
        <div class="quiz-result-score ${pass?'pass':'fail'}">${qs.score}%</div>
        <div class="quiz-result-label">${pass ? '🎉 Vượt qua!' : '😢 Chưa đạt'}</div>
        <div class="quiz-result-sub">${pass
          ? 'Xuất sắc! Bạn đã vượt qua bài kiểm tra.'
          : `Điểm tối thiểu: ${course.passingScore||70}%. Hãy học lại và thử tiếp.`}</div>
        ${pass
          ? `<button class="btn-primary" onclick="markLessonDone('${lesson.id}','${course.id}')">✅ Hoàn thành & tiếp tục</button>`
          : `<button class="btn-outline" onclick="startQuiz()">🔄 Làm lại</button>`}
      </div>`;
  }

  return `
    <div class="quiz-wrap">
      <div style="font-size:15px;font-weight:700;margin-bottom:16px">📝 Bài kiểm tra — ${lesson.title}</div>
      ${questions.map((q, qi) => `
        <div class="quiz-question-count">Câu ${qi+1}/${questions.length}</div>
        <div class="quiz-question">${q.q}</div>
        <div class="quiz-options">
          ${['A','B','C','D'].slice(0, q.options.length).map((key, oi) => `
            <div class="quiz-option ${qs.answers[qi]===oi?'selected':''}"
              onclick="selectAnswer(${qi},${oi})">
              <div class="quiz-option-key">${key}</div>
              <div>${q.options[oi]}</div>
            </div>`).join('')}
        </div>`).join('')}
      <button class="btn-primary"
        style="${qs.answers.length < questions.length ? 'opacity:0.5;pointer-events:none' : ''}"
        onclick="submitQuiz('${lesson.id}','${course.id}')">
        Nộp bài →
      </button>
    </div>`;
}

function selectAnswer(qi, oi) {
  if (!trainingState.quizState || trainingState.quizState.submitted) return;
  trainingState.quizState.answers[qi] = oi;
  renderTrainingBody();
}

function submitQuiz(lessonId, courseId) {
  const qs = trainingState.quizState;
  if (!qs) return;
  const course  = (TRAINING_COURSES||[]).find(c => c.id === courseId);
  const lesson  = course?.lessons?.find(l => l.id === lessonId);
  const questions = lesson?.quiz?.questions || [];
  let correct = 0;
  questions.forEach((q, qi) => { if (qs.answers[qi] === q.answer) correct++; });
  qs.score = questions.length > 0 ? Math.round(correct/questions.length*100) : 100;
  qs.submitted = true;

  // Lưu kết quả
  const uid = currentUser?.id;
  let enr = getEnrollment(uid, courseId) || { userId:uid, courseId, enrolledAt:new Date().toISOString(), status:'in_progress', completedLessons:[], quizResults:{}, overallProgress:0, completedAt:null };
  enr.quizResults = enr.quizResults || {};
  enr.quizResults[lessonId] = { score: qs.score, attempts: (enr.quizResults[lessonId]?.attempts||0)+1, date: new Date().toISOString() };
  saveEnrollment(uid, courseId, enr);

  renderTrainingBody();
}

// ============ TAB 3: TIẾN ĐỘ ĐỘI NHÓM (Admin/Manager) ============
function renderProgressDash(el) {
  const courses = TRAINING_COURSES || [];
  const members = TEAM_MEMBERS.filter(m => {
    if (currentUser?.role === 'admin') return true;
    return m.department === currentUser?.department;
  });

  const totalEnr = members.reduce((s,m) => {
    return s + courses.filter(c => getEnrollment(m.id, c.id)?.status === 'completed').length;
  }, 0);
  const avgPct = members.length > 0
    ? Math.round(members.reduce((s,m) => {
        const pts = courses.map(c => getCourseProgress(m.id, c.id, c));
        return s + (pts.reduce((a,b)=>a+b,0)/(pts.length||1));
      }, 0) / members.length)
    : 0;

  el.innerHTML = `
    <div class="progress-overview-grid">
      <div class="progress-stat">
        <div class="progress-stat-val" style="color:var(--c-primary-light)">${members.length}</div>
        <div class="progress-stat-lbl">👥 Nhân sự đang học</div>
      </div>
      <div class="progress-stat">
        <div class="progress-stat-val" style="color:#10B981">${totalEnr}</div>
        <div class="progress-stat-lbl">✅ Khóa đã hoàn thành (tổng)</div>
      </div>
      <div class="progress-stat">
        <div class="progress-stat-val" style="color:#3B82F6">${avgPct}%</div>
        <div class="progress-stat-lbl">📊 Tiến độ trung bình đội</div>
      </div>
      <div class="progress-stat">
        <div class="progress-stat-val" style="color:#F59E0B">${courses.length}</div>
        <div class="progress-stat-lbl">📚 Khóa học hiện có</div>
      </div>
    </div>

    <div style="background:var(--c-surface);border:1px solid var(--c-border-subtle);border-radius:var(--r-xl);overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid var(--c-border-subtle);font-weight:700">
        📋 Tiến độ từng nhân sự
      </div>
      <div style="overflow-x:auto">
        <table class="team-progress-table">
          <thead>
            <tr>
              <th>Nhân sự</th>
              ${courses.map(c => `<th title="${c.title}">${c.thumbnail} ${c.title.substring(0,14)}…</th>`).join('')}
              <th>Tổng tiến độ</th>
            </tr>
          </thead>
          <tbody>
            ${members.map(m => {
              const perCourse = courses.map(c => getCourseProgress(m.id, c.id, c));
              const avg = perCourse.length > 0 ? Math.round(perCourse.reduce((a,b)=>a+b,0)/perCourse.length) : 0;
              return `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="avatar-sm" style="font-size:11px">${m.avatar||'??'}</div>
                    <span>${m.name.split(' ').slice(-2).join(' ')}</span>
                  </div>
                </td>
                ${courses.map(c => {
                  const pct = getCourseProgress(m.id, c.id, c);
                  const done = getEnrollment(m.id, c.id)?.status === 'completed';
                  return `<td>
                    <div class="progress-bar-sm" title="${pct}%">
                      <div class="progress-bar-sm-fill" style="width:${pct}%;background:${done?'#10B981':''}"></div>
                    </div>
                    <div style="font-size:10px;margin-top:3px;color:var(--c-text-3)">${done?'✅':pct>0?pct+'%':'—'}</div>
                  </td>`;
                }).join('')}
                <td>
                  <div style="font-size:15px;font-weight:800;color:${avg>=80?'#10B981':avg>=50?'#F59E0B':'var(--c-text-2)'}">${avg}%</div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============ HELPERS ============
function getEnrollment(uid, courseId) {
  return TRAINING_ENROLLMENTS[uid]?.[courseId] || null;
}

function saveEnrollment(uid, courseId, enr) {
  if (!TRAINING_ENROLLMENTS[uid]) TRAINING_ENROLLMENTS[uid] = {};
  TRAINING_ENROLLMENTS[uid][courseId] = enr;
  try { localStorage.setItem('viwork_training', JSON.stringify(TRAINING_ENROLLMENTS)); } catch(e) {}
  if (window.fbSaveEnrollment) window.fbSaveEnrollment(uid, courseId, enr).catch(()=>{});
}

function getCourseProgress(uid, courseId, course) {
  const enr = getEnrollment(uid, courseId);
  if (!enr) return 0;
  const total = course?.lessons?.length || 1;
  return Math.round((enr.completedLessons?.length||0) / total * 100);
}

// ============ ADMIN: QUẢN LÝ KHÓA HỌC ============
function renderManageCourses(el) {
  const courses = TRAINING_COURSES || [];
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div style="font-size:16px;font-weight:800">⚙️ Quản lý khóa học (ⵂ{courses.length} khóa)</div>
      <button class="btn-primary" onclick="openAdminCourseEdit(null)">➕ Tạo khóa học mới</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${courses.map(c => `
        <div style="background:var(--c-surface);border:1px solid var(--c-border-subtle);border-radius:var(--r-lg);padding:16px 20px;display:flex;align-items:center;gap:16px">
          <div style="font-size:36px;width:52px;text-align:center">${c.thumbnail}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:15px;font-weight:700">${c.title}</div>
            <div style="font-size:12px;color:var(--c-text-3);margin-top:4px">
              <span class="course-level level-${c.level}">${{beginner:'Cơ bản',intermediate:'Trung cấp',advanced:'Nâng cao'}[c.level]}</span>
              &nbsp;· ⏱ ${c.durationMins} phút &nbsp;· 📖 ${c.lessons?.length||0} bài học
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <button class="btn-outline sm" onclick="openAdminCourseEdit('${c.id}')">✏️ Sửa</button>
            <button class="btn-danger sm" onclick="deleteAdminCourse('${c.id}')">🗑️ Xóa</button>
          </div>
        </div>`).join('')}
    </div>
  `.replace('ⵂ', courses.length);
}

function openAdminCourseEdit(courseId) {
  const isNew = !courseId;
  const course = isNew ? {
    id: 'course_' + Date.now().toString(36),
    title: '', description: '', thumbnail: '📚',
    color: 'linear-gradient(135deg,rgba(90,184,0,0.15),rgba(90,184,0,0.05))',
    level: 'beginner', durationMins: 60, passingScore: 70,
    positionIds: [], pathIds: [], lessons: []
  } : JSON.parse(JSON.stringify((TRAINING_COURSES||[]).find(c => c.id === courseId)));
  if (!course) return;

  const dlg = document.createElement('div');
  dlg.id = '_dlg_admin_course';
  dlg.className = 'modal-overlay';
  dlg.style.cssText = 'z-index:10000;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto;';

  const lessonRows = () => (course.lessons||[]).map((l,i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--c-bg-3);border-radius:var(--r-md);margin-bottom:6px">
      <span style="width:20px;color:var(--c-text-3);font-size:12px">${i+1}</span>
      <span style="flex:1;font-size:13px;font-weight:600">${l.title}</span>
      <span style="font-size:11px;color:var(--c-text-3)">${{text:'📔',video:'🎬',link:'🔗'}[l.type]||'📔'} ${l.durationMins}ph</span>
      <button onclick="_adminMoveLessonUp(${i})" style="background:none;font-size:14px;cursor:pointer" title="Lên">↑</button>
      <button onclick="_adminMoveLessonDown(${i})" style="background:none;font-size:14px;cursor:pointer" title="Xuống">↓</button>
      <button onclick="_adminEditLesson(${i})" style="background:none;font-size:14px;cursor:pointer" title="Sửa">✏️</button>
      <button onclick="_adminRemoveLesson(${i})" style="background:none;font-size:16px;color:#EF4444;cursor:pointer" title="Xóa">×</button>
    </div>`).join('');

  const render = () => {
    dlg.innerHTML = `
      <div class="modal" style="max-width:640px;width:100%;padding:0">
        <div class="modal-header">
          <h2>${isNew ? '➕ Tạo khóa học mới' : '✏️ Sửa khóa học'}</h2>
          <button onclick="document.getElementById('_dlg_admin_course').remove()" style="background:none;font-size:20px;cursor:pointer;color:var(--c-text-3)">×</button>
        </div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;max-height:70vh;overflow-y:auto">
          <div class="form-group"><label>Tên khóa học *</label>
            <input id="_ac_title" class="form-control" value="${course.title}" placeholder="Nhập tên khóa" /></div>
          <div class="form-group"><label>Mô tả ngắn</label>
            <textarea id="_ac_desc" class="form-control" rows="2" placeholder="Mô tả ngắn về khóa học...">${course.description}</textarea></div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
            <div class="form-group"><label>Icon (emoji)</label>
              <input id="_ac_thumb" class="form-control" value="${course.thumbnail}" maxlength="4" /></div>
            <div class="form-group"><label>Cấp độ</label>
              <select id="_ac_level" class="form-control">
                <option value="beginner" ${course.level==='beginner'?'selected':''}>Cơ bản</option>
                <option value="intermediate" ${course.level==='intermediate'?'selected':''}>Trung cấp</option>
                <option value="advanced" ${course.level==='advanced'?'selected':''}>Nâng cao</option>
              </select></div>
            <div class="form-group"><label>Điểm pass (%)</label>
              <input id="_ac_pass" class="form-control" type="number" min="0" max="100" value="${course.passingScore}" /></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label>Thời lượng (phút)</label>
              <input id="_ac_dur" class="form-control" type="number" min="1" value="${course.durationMins}" /></div>
            <div class="form-group"><label>Onboarding path?</label>
              <select id="_ac_path" class="form-control">
                <option value="" ${!course.pathIds?.includes('onboarding')?'selected':''}>Không</option>
                <option value="onboarding" ${course.pathIds?.includes('onboarding')?'selected':''}>✅ Là khóa Onboarding</option>
              </select></div>
          </div>

          <!-- === ĐỐI TƯỢNG HỌC VIÊN === -->
          <div style="border-top:1px solid var(--c-border-subtle);padding-top:14px">
            <div style="font-weight:700;font-size:13px;margin-bottom:12px">🎯 Đối tượng học viên</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group">
                <label style="margin-bottom:6px;display:block">📋 Vị trí công việc</label>
                <div style="border:1px solid var(--c-border-subtle);border-radius:var(--r-md);padding:8px;max-height:140px;overflow-y:auto;background:var(--c-bg-3)">
                  <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;cursor:pointer">
                    <input type="checkbox" id="_ac_pos_all" ${(!course.positionIds||course.positionIds.length===0)?'checked':''}
                      onchange="if(this.checked){document.querySelectorAll('._ac_pos_cb').forEach(cb=>cb.checked=false)}">
                    <span style="font-weight:600">🌐 Tất cả vị trí</span>
                  </label>
                  ${(POSITIONS||[]).map(p => `
                  <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;cursor:pointer">
                    <input type="checkbox" class="_ac_pos_cb" value="${p.id}" ${(course.positionIds||[]).includes(p.id)?'checked':''}
                      onchange="document.getElementById('_ac_pos_all').checked=false">
                    <span>${p.icon} ${p.name}</span>
                  </label>`).join('')}
                </div>
              </div>
              <div class="form-group">
                <label style="margin-bottom:6px;display:block">👤 Nhân viên cụ thể</label>
                <div style="border:1px solid var(--c-border-subtle);border-radius:var(--r-md);padding:8px;max-height:140px;overflow-y:auto;background:var(--c-bg-3)">
                  <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;cursor:pointer">
                    <input type="checkbox" id="_ac_user_all" ${(!course.assignedUserIds||course.assignedUserIds.length===0)?'checked':''}
                      onchange="if(this.checked){document.querySelectorAll('._ac_user_cb').forEach(cb=>cb.checked=false)}">
                    <span style="font-weight:600">👥 Tất cả nhân viên</span>
                  </label>
                  ${TEAM_MEMBERS.map(m => `
                  <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;cursor:pointer">
                    <input type="checkbox" class="_ac_user_cb" value="${m.id}" ${(course.assignedUserIds||[]).includes(m.id)?'checked':''}
                      onchange="document.getElementById('_ac_user_all').checked=false">
                    <span>${m.avatar} ${m.name.split(' ').slice(-2).join(' ')}</span>
                  </label>`).join('')}
                </div>
              </div>
            </div>
          </div>

            <div style="font-weight:700;font-size:13px;margin-bottom:10px">📖 Bài học (${(course.lessons||[]).length} bài)</div>
            <div id="_ac_lessons">${lessonRows()}</div>
            <button class="btn-outline" style="width:100%;margin-top:8px" onclick="_adminAddLessonForm()">➕ Thêm bài học</button>
            <div id="_ac_lesson_form"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" onclick="document.getElementById('_dlg_admin_course').remove()">Hủy</button>
          <button class="btn-primary" onclick="_adminSaveCourse('${course.id}', ${isNew})">💾 Lưu khóa học</button>
        </div>
      </div>`;
  };

  // Expose course object so nested functions can mutate it
  window._adminEditingCourse = course;
  window._adminRerenderCourseDialog = render;

  document.body.appendChild(dlg);
  render();
}

// ============ QUIZ BUILDER HELPERS ============
// Temporary quiz questions while editing a lesson
window._quizDraft = []; // [{q:'', options:['','','',''], answer:0}]

function _quizBuilderHtml(questions) {
  const qs = questions || [];
  return `
    <div style="border-top:1px solid var(--c-border-subtle);margin-top:12px;padding-top:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-weight:700;font-size:13px">📝 Bài tập / Kiểm tra (${qs.length} câu)</span>
        <button type="button" onclick="_quizAddQuestion()"
          style="font-size:12px;padding:4px 12px;background:var(--grad-primary);color:#fff;border-radius:20px;font-weight:600;cursor:pointer">
          + Thêm câu hỏi
        </button>
      </div>
      <div id="_quiz_qs_list">
        ${qs.map((q, qi) => `
          <div style="background:var(--c-bg-3);border-radius:var(--r-md);padding:10px 12px;margin-bottom:8px">
            <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px">
              <span style="font-size:11px;font-weight:700;color:var(--c-text-3);padding-top:3px">Câu ${qi+1}</span>
              <textarea rows="2" style="flex:1;font-size:13px;padding:6px 8px;border:1px solid var(--c-border-subtle);border-radius:6px;resize:vertical;background:var(--c-surface)"
                id="_qq_text_${qi}" onblur="_quizSyncQuestion(${qi})">${q.q}</textarea>
              <button type="button" onclick="_quizRemoveQuestion(${qi})"
                style="background:none;color:#EF4444;font-size:16px;cursor:pointer;flex-shrink:0">×</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
              ${['A','B','C','D'].map((k,oi) => `
                <div style="display:flex;align-items:center;gap:6px">
                  <input type="radio" name="_q${qi}_ans" value="${oi}" ${q.answer===oi?'checked':''}
                    id="_q${qi}_r${oi}" onchange="_quizSetAnswer(${qi},${oi})">
                  <label for="_q${qi}_r${oi}" style="font-size:11px;font-weight:700;color:var(--c-primary-light);width:14px">${k}</label>
                  <input type="text" style="flex:1;font-size:12px;padding:4px 6px;border:1px solid var(--c-border-subtle);border-radius:5px;background:var(--c-surface)"
                    id="_qq_opt_${qi}_${oi}" value="${(q.options||[])[oi]||''}" placeholder="Đáp án ${k}"
                    onblur="_quizSyncQuestion(${qi})">
                </div>`).join('')}
            </div>
            <div style="font-size:11px;color:#10B981">✅ Đáp án đúng: ${['A','B','C','D'][q.answer]||'A'}</div>
          </div>`).join('')}
      </div>
      <div style="font-size:11px;color:var(--c-text-3);margin-top:4px">
        💡 Chọn radio button để đánh dấu đáp án đúng. Không có câu hỏi = không có bài kiểm tra.
      </div>
    </div>`;
}

window._quizAddQuestion = function() {
  window._quizDraft.push({ q: '', options: ['', '', '', ''], answer: 0 });
  _quizRefreshBuilder();
};

window._quizRemoveQuestion = function(qi) {
  window._quizDraft.splice(qi, 1);
  _quizRefreshBuilder();
};

window._quizSetAnswer = function(qi, oi) {
  if (window._quizDraft[qi]) window._quizDraft[qi].answer = oi;
};

window._quizSyncQuestion = function(qi) {
  const q = window._quizDraft[qi];
  if (!q) return;
  q.q = document.getElementById(`_qq_text_${qi}`)?.value.trim() || q.q;
  for (let oi = 0; oi < 4; oi++) {
    q.options[oi] = document.getElementById(`_qq_opt_${qi}_${oi}`)?.value.trim() || '';
  }
};

function _quizSyncAll() {
  window._quizDraft.forEach((_, qi) => window._quizSyncQuestion(qi));
}

function _quizRefreshBuilder() {
  const el = document.getElementById('_quiz_qs_list');
  if (!el) return;
  const wrapper = el.closest('[id]');
  const container = document.getElementById('_quiz_builder_wrap');
  if (container) container.innerHTML = _quizBuilderHtml(window._quizDraft);
}

// ============ ADD LESSON FORM ============
window._adminAddLessonForm = function() {
  window._quizDraft = [];
  const form = document.getElementById('_ac_lesson_form');
  if (!form) return;
  form.innerHTML = `
    <div style="background:var(--c-surface);border:1px solid var(--c-border-subtle);border-radius:var(--r-lg);padding:16px;margin-top:10px;display:flex;flex-direction:column;gap:10px">
      <div style="font-weight:700;font-size:13px">➕ Thêm bài học mới</div>
      <div class="form-group"><label>Tên bài *</label><input id="_al_title" class="form-control" placeholder="Tên bài học" /></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Loại nội dung</label>
          <select id="_al_type" class="form-control">
            <option value="text">📔 Văn bản</option>
            <option value="video">🎬 Video YouTube</option>
            <option value="link">🔗 Link tài liệu</option>
          </select></div>
        <div class="form-group"><label>Thời lượng (phút)</label>
          <input id="_al_dur" class="form-control" type="number" min="1" value="15" /></div>
      </div>
      <div class="form-group"><label>Nội dung / URL *</label>
        <textarea id="_al_content" class="form-control" rows="3" placeholder="Nội dung bài học (text) hoặc URL (video/link)"></textarea></div>

      <div id="_quiz_builder_wrap">${_quizBuilderHtml(window._quizDraft)}</div>

      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
        <button class="btn-outline" onclick="document.getElementById('_ac_lesson_form').innerHTML=''">Hủy</button>
        <button class="btn-primary" onclick="_adminSaveLesson()">✅ Lưu bài học</button>
      </div>
    </div>`;
};

window._adminSaveLesson = function() {
  _quizSyncAll();
  const title   = document.getElementById('_al_title')?.value.trim();
  const type    = document.getElementById('_al_type')?.value || 'text';
  const dur     = parseInt(document.getElementById('_al_dur')?.value) || 15;
  const content = document.getElementById('_al_content')?.value.trim();
  if (!title || !content) { showToast('⚠️ Nhập tên và nội dung bài!', 'error'); return; }

  const validQuestions = (window._quizDraft || []).filter(q =>
    q.q && q.options.filter(o => o).length >= 2
  );

  const c = window._adminEditingCourse;
  if (!c.lessons) c.lessons = [];
  c.lessons.push({
    id: 'l_' + Date.now().toString(36), title, type, durationMins: dur, content,
    quiz: validQuestions.length > 0 ? { questions: validQuestions } : undefined
  });
  window._quizDraft = [];
  window._adminRerenderCourseDialog?.();
};

window._adminRemoveLesson = function(idx) {
  const c = window._adminEditingCourse;
  if (!c?.lessons) return;
  c.lessons.splice(idx, 1);
  window._adminRerenderCourseDialog?.();
};

window._adminMoveLessonUp = function(idx) {
  const c = window._adminEditingCourse;
  if (!c?.lessons || idx <= 0) return;
  [c.lessons[idx-1], c.lessons[idx]] = [c.lessons[idx], c.lessons[idx-1]];
  window._adminRerenderCourseDialog?.();
};

window._adminMoveLessonDown = function(idx) {
  const c = window._adminEditingCourse;
  if (!c?.lessons || idx >= c.lessons.length-1) return;
  [c.lessons[idx], c.lessons[idx+1]] = [c.lessons[idx+1], c.lessons[idx]];
  window._adminRerenderCourseDialog?.();
};

// ============ EDIT LESSON FORM ============
window._adminEditLesson = function(idx) {
  const c = window._adminEditingCourse;
  const l = c?.lessons?.[idx];
  if (!l) return;
  // Load existing quiz into draft
  window._quizDraft = JSON.parse(JSON.stringify(l.quiz?.questions || []));

  const form = document.getElementById('_ac_lesson_form');
  if (!form) return;
  form.innerHTML = `
    <div style="background:var(--c-surface);border:1.5px solid var(--c-primary);border-radius:var(--r-lg);padding:16px;margin-top:10px;display:flex;flex-direction:column;gap:10px">
      <div style="font-weight:700;font-size:13px">✏️ Sửa bài học #${idx+1}</div>
      <div class="form-group"><label>Tên bài *</label>
        <input id="_al_title" class="form-control" value="${l.title}" /></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Loại nội dung</label>
          <select id="_al_type" class="form-control">
            <option value="text" ${l.type==='text'?'selected':''}>📔 Văn bản</option>
            <option value="video" ${l.type==='video'?'selected':''}>🎬 Video YouTube</option>
            <option value="link" ${l.type==='link'?'selected':''}>🔗 Link tài liệu</option>
          </select></div>
        <div class="form-group"><label>Thời lượng (phút)</label>
          <input id="_al_dur" class="form-control" type="number" min="1" value="${l.durationMins}" /></div>
      </div>
      <div class="form-group"><label>Nội dung / URL</label>
        <textarea id="_al_content" class="form-control" rows="3">${l.content||''}</textarea></div>

      <div id="_quiz_builder_wrap">${_quizBuilderHtml(window._quizDraft)}</div>

      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
        <button class="btn-outline" onclick="document.getElementById('_ac_lesson_form').innerHTML=''">Hủy</button>
        <button class="btn-primary" onclick="_adminUpdateLesson(${idx})">✅ Cập nhật bài học</button>
      </div>
    </div>`;
};

window._adminUpdateLesson = function(idx) {
  _quizSyncAll();
  const c = window._adminEditingCourse;
  if (!c?.lessons?.[idx]) return;
  c.lessons[idx].title        = document.getElementById('_al_title')?.value.trim()   || c.lessons[idx].title;
  c.lessons[idx].type         = document.getElementById('_al_type')?.value           || c.lessons[idx].type;
  c.lessons[idx].durationMins = parseInt(document.getElementById('_al_dur')?.value)  || 15;
  c.lessons[idx].content      = document.getElementById('_al_content')?.value.trim() || c.lessons[idx].content;

  const validQuestions = (window._quizDraft || []).filter(q =>
    q.q && q.options.filter(o => o).length >= 2
  );
  c.lessons[idx].quiz = validQuestions.length > 0 ? { questions: validQuestions } : undefined;
  window._quizDraft = [];
  window._adminRerenderCourseDialog?.();
};

window._adminSaveCourse = function(courseId, isNew) {
  const c = window._adminEditingCourse;
  if (!c) return;
  c.title       = document.getElementById('_ac_title')?.value.trim()  || c.title;
  c.description = document.getElementById('_ac_desc')?.value.trim()   || '';
  c.thumbnail   = document.getElementById('_ac_thumb')?.value.trim()  || '📚';
  c.level       = document.getElementById('_ac_level')?.value         || 'beginner';
  c.passingScore = parseInt(document.getElementById('_ac_pass')?.value) || 70;
  c.durationMins = parseInt(document.getElementById('_ac_dur')?.value)  || 60;
  const pathVal = document.getElementById('_ac_path')?.value;
  c.pathIds = pathVal === 'onboarding' ? ['onboarding'] : [];

  // Đọc vị trí được chọn
  const posAll = document.getElementById('_ac_pos_all')?.checked;
  c.positionIds = posAll ? [] : Array.from(document.querySelectorAll('._ac_pos_cb:checked')).map(cb => cb.value);

  // Đọc nhân viên được chỉ định
  const userAll = document.getElementById('_ac_user_all')?.checked;
  c.assignedUserIds = userAll ? [] : Array.from(document.querySelectorAll('._ac_user_cb:checked')).map(cb => cb.value);

  if (!c.title) { showToast('⚠️ Nhập tên khóa học!', 'error'); return; }

  if (isNew) {
    TRAINING_COURSES.push(c);
  } else {
    const idx = TRAINING_COURSES.findIndex(x => x.id === courseId);
    if (idx > -1) TRAINING_COURSES[idx] = c;
  }
  document.getElementById('_dlg_admin_course')?.remove();
  showToast(`✅ Đã ${isNew ? 'tạo' : 'cập nhật'} khóa học "${c.title}"!`, 'success');
  renderTraining();
};

function deleteAdminCourse(courseId) {
  const course = (TRAINING_COURSES||[]).find(c => c.id === courseId);
  if (!course) return;
  hrConfirm(
    `Xóa khóa học "${course.title}"?`,
    'Dữ liệu tiến độ của nhân viên sẽ không bị ảnh hưởng.',
    () => {
      const idx = TRAINING_COURSES.findIndex(c => c.id === courseId);
      if (idx > -1) TRAINING_COURSES.splice(idx, 1);
      showToast('🗑️ Đã xóa khóa học', 'info');
      renderTraining();
    }
  );
}
