function renderTraining() {
  const container = document.getElementById('trainingContainer');
  if (!container) return;

  if (typeof TRAINING_DATA === 'undefined') {
    container.innerHTML = '<div class="empty-state">Chưa có dữ liệu đào tạo.</div>';
    return;
  }

  const { competencies, courses, checklists } = TRAINING_DATA;

  let compHtml = '';
  if (competencies && competencies.length > 0) {
    compHtml = `
      <div class="card" style="margin-bottom: 24px;">
        <h3 style="margin-bottom: 16px; border-bottom: 1px solid var(--c-border); padding-bottom: 8px;">🎯 Khung năng lực</h3>
        <div style="overflow-x: auto;">
          <table class="data-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: var(--c-surface-2);">
                <th style="padding: 12px; text-align: left; border: 1px solid var(--c-border);">Tiêu chí</th>
                <th style="padding: 12px; text-align: left; border: 1px solid var(--c-border);">Cấp 1 ❌</th>
                <th style="padding: 12px; text-align: left; border: 1px solid var(--c-border);">Cấp 2 ⚠️</th>
                <th style="padding: 12px; text-align: left; border: 1px solid var(--c-border);">Cấp 3 ✅</th>
                <th style="padding: 12px; text-align: left; border: 1px solid var(--c-border);">Cấp 4 ⭐</th>
              </tr>
            </thead>
            <tbody>
              ${competencies.map(c => `
                <tr>
                  <td style="padding: 12px; border: 1px solid var(--c-border); font-weight: 600;">${c.code}: ${c.name}</td>
                  <td style="padding: 12px; border: 1px solid var(--c-border); font-size: 13px;">${c.level1}</td>
                  <td style="padding: 12px; border: 1px solid var(--c-border); font-size: 13px;">${c.level2}</td>
                  <td style="padding: 12px; border: 1px solid var(--c-border); font-size: 13px; background: rgba(16, 185, 129, 0.1);">${c.level3}</td>
                  <td style="padding: 12px; border: 1px solid var(--c-border); font-size: 13px; background: rgba(245, 158, 11, 0.1);">${c.level4}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  let courseHtml = '';
  if (courses && courses.length > 0) {
    courseHtml = `
      <div class="card" style="margin-bottom: 24px;">
        <h3 style="margin-bottom: 16px; border-bottom: 1px solid var(--c-border); padding-bottom: 8px;">📚 Chương trình đào tạo & Khóa học</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
          ${courses.map(c => `
            <div style="border: 1px solid var(--c-border); border-radius: 8px; padding: 16px; background: var(--c-surface-1);">
              <div style="font-weight: 700; color: var(--c-primary); margin-bottom: 8px;">${c.module || 'Khóa học'}</div>
              <div style="font-weight: 600; margin-bottom: 8px;">${c.name}</div>
              <div style="font-size: 13px; color: var(--c-text-2); margin-bottom: 12px;">${c.desc}</div>
              <div style="font-size: 12px; font-weight: 600;">⏱ Thời lượng: ${c.duration}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  let chkHtml = '';
  if (checklists && checklists.ceo_daily) {
    chkHtml = `
      <div class="card" style="margin-bottom: 24px;">
        <h3 style="margin-bottom: 16px; border-bottom: 1px solid var(--c-border); padding-bottom: 8px;">✅ Checklist Vận hành</h3>
        <ul style="list-style: none; padding: 0;">
          ${checklists.ceo_daily.map(chk => `
            <li style="margin-bottom: 12px; padding: 12px; border: 1px solid var(--c-border); border-radius: 6px; display: flex; gap: 12px;">
              <input type="checkbox" style="width: 20px; height: 20px; accent-color: var(--c-primary);" />
              <div>
                <div style="font-weight: 600; font-size: 14px;">${chk.task}</div>
                <div style="font-size: 13px; color: var(--c-text-2); margin-top: 4px;">Tần suất: <strong>${chk.freq}</strong> &nbsp;|&nbsp; Hành động: ${chk.action}</div>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="margin-bottom: 24px; padding: 16px; background: var(--c-surface-2); border-radius: 8px; border: 1px solid var(--c-border);">
      <h2 style="margin-bottom: 8px; color: var(--c-primary);">Xin chào, ${currentUser?.name}</h2>
      <p style="color: var(--c-text-2); margin: 0;">Dưới đây là Khung năng lực, Checklist và Lộ trình đào tạo phù hợp với vai trò của bạn.</p>
    </div>
    ${compHtml}
    ${courseHtml}
    ${chkHtml}
  `;
}

// Hook into app.js router if needed. It will be called when user clicks on Training nav item.
// Add function to global scope so showModule can call it.
window.renderTraining = renderTraining;
