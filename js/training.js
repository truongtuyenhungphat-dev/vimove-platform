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
  // update tab active
  document.querySelectorAll('.training-tab').forEach(b => b.classList.remove('active'));
  const tabs = ['path','catalog','progress'];
  const idx = tabs.indexOf(tab);
  document.querySelectorAll('.training-tab')[idx]?.classList.add('active');
}

function renderTrainingBody() {
  const el = document.getElementById('trainingBody');
  if (!el) return;
  if (trainingState.courseId) { renderCourseDetail(el); return; }
  switch(trainingState.tab) {
    case 'path':     renderMyPath(el);    break;
    case 'catalog':  renderCatalog(el);   break;
    case 'progress': renderProgressDash(el); break;
  }
}

// ============ TAB 1: LỘ TRÌNH CỦA TÔI ============
function renderMyPath(el) {
  const uid  = currentUser?.id;
  const pos  = currentUser?.positionId || '';

  // Lọc lộ trình phù hợp với vị trí + luôn thêm Onboarding
  const myPaths = (TRAINING_COURSES || []).filter(c =>
    c.pathIds?.includes('onboarding') ||
    (c.positionIds?.length === 0) ||
    (pos && c.positionIds?.includes(pos))
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

  el.innerHTML = `
    <div class="course-grid">
      ${courses.map(c => {
        const pct = getCourseProgress(uid, c.id, c);
        const enr = getEnrollment(uid, c.id);
        const isDone = enr?.status === 'completed';
        const bg = c.color || 'rgba(90,184,0,0.1)';
        return `
        <div class="course-card" onclick="openCourse('${c.id}')">
          <div class="course-card-thumb" style="background:${bg}">${c.thumbnail}</div>
          <div class="course-card-body">
            <div class="course-card-title">${c.title}</div>
            <div class="course-card-desc">${c.description}</div>
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
