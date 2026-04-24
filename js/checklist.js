/* ================================================
   VIWORK Sprint 1 — Checklist & Sub-tasks Module
   ================================================ */

// ============ CHECKLIST FUNCTIONS ============

/**
 * Tính % hoàn thành checklist
 */
function getChecklistProgress(task) {
  const cl = task.checklist || [];
  if (cl.length === 0) return null;
  const done = cl.filter(i => i.done).length;
  return { done, total: cl.length, pct: Math.round((done / cl.length) * 100) };
}

/**
 * Render mini progress bar trên kanban card
 */
function renderChecklistMini(task) {
  const prog = getChecklistProgress(task);
  if (!prog) return '';
  const isDone = prog.done === prog.total;
  return `
    <div class="tc-checklist-progress" title="Checklist: ${prog.done}/${prog.total}">
      <span>📋</span>
      <div class="tc-cl-bar">
        <div class="tc-cl-fill" style="width:${prog.pct}%;background:${isDone?'#10B981':'#7C3AED'}"></div>
      </div>
      <span class="${isDone?'tc-cl-done':''}">${prog.done}/${prog.total}</span>
    </div>
  `;
}

/**
 * Render full checklist trong detail modal
 */
function renderChecklist(task) {
  const prog = getChecklistProgress(task);
  const items = task.checklist || [];

  const pctStr = prog ? prog.pct + '%' : '0%';
  const pctVal = prog ? prog.pct : 0;

  return `
    <div class="checklist-section">
      <div class="checklist-header">
        <span class="checklist-title">📋 Checklist</span>
        <span class="checklist-pct">${prog ? `${prog.done}/${prog.total} · ${pctStr}` : '0/0'}</span>
      </div>
      <div class="checklist-bar-wrap">
        <div class="checklist-bar" style="width:${pctVal}%"></div>
      </div>
      <div class="checklist-items" id="checklist-items-${task.id}">
        ${items.length === 0
          ? '<div style="font-size:12px;color:var(--c-text-3);text-align:center;padding:8px">Chưa có mục nào. Thêm bên dưới!</div>'
          : items.map((item, idx) => renderChecklistItem(task.id, item, idx)).join('')
        }
      </div>
      <div class="checklist-add">
        <input type="text"
               id="cl-input-${task.id}"
               placeholder="Thêm mục checklist... (Enter để thêm)"
               onkeydown="if(event.key==='Enter') addChecklistItem('${task.id}')"
        />
        <button class="btn-outline sm" onclick="addChecklistItem('${task.id}')">+ Thêm</button>
      </div>
    </div>
  `;
}

function renderChecklistItem(taskId, item, idx) {
  return `
    <div class="checklist-item ${item.done ? 'checked' : ''}" 
         id="cl-item-${taskId}-${idx}">
      <input type="checkbox"
             ${item.done ? 'checked' : ''}
             onchange="toggleChecklistItem('${taskId}', ${idx}, this.checked)"
      />
      <span class="checklist-item-text">${escHtml(item.text)}</span>
      ${canEdit() ? `<button class="checklist-item-del" onclick="deleteChecklistItem('${taskId}', ${idx})" title="Xóa">✕</button>` : ''}
    </div>
  `;
}

function addChecklistItem(taskId) {
  const input = document.getElementById('cl-input-' + taskId);
  const text  = input?.value.trim();
  if (!text) return;

  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.checklist = task.checklist || [];
  task.checklist.push({ text, done: false, addedBy: currentUser?.id, addedAt: new Date().toISOString() });
  input.value = '';
  saveData();

  // Re-render checklist area only
  const wrapper = document.getElementById('checklist-items-' + taskId);
  if (wrapper) {
    wrapper.innerHTML = task.checklist.map((item, idx) => renderChecklistItem(taskId, item, idx)).join('');
  }
  updateChecklistHeader(task);
  renderWorkflow(); // refresh card
}

function toggleChecklistItem(taskId, idx, done) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task || !task.checklist[idx]) return;
  task.checklist[idx].done = done;
  task.checklist[idx].doneAt = done ? new Date().toISOString() : null;
  task.checklist[idx].doneBy = done ? currentUser?.id : null;
  saveData();

  const itemEl = document.getElementById(`cl-item-${taskId}-${idx}`);
  if (itemEl) {
    if (done) itemEl.classList.add('checked');
    else      itemEl.classList.remove('checked');
  }
  updateChecklistHeader(task);
  renderWorkflow();
}

function deleteChecklistItem(taskId, idx) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.checklist.splice(idx, 1);
  saveData();
  // Full re-render
  const wrapper = document.getElementById('checklist-items-' + taskId);
  if (wrapper) wrapper.innerHTML = task.checklist.map((item, i) => renderChecklistItem(taskId, item, i)).join('');
  updateChecklistHeader(task);
  renderWorkflow();
}

function updateChecklistHeader(task) {
  // update pct display
  const prog = getChecklistProgress(task);
  if (!prog) return;
  const header = document.querySelector('.checklist-pct');
  if (header) header.textContent = `${prog.done}/${prog.total} · ${prog.pct}%`;
  const bar = document.querySelector('.checklist-bar');
  if (bar) bar.style.width = prog.pct + '%';
}

// ============ SUB-TASKS FUNCTIONS ============

/**
 * Render sub-tasks section trong detail modal
 */
function renderSubtasks(task) {
  const subs = task.subtasks || [];

  return `
    <div class="subtasks-section">
      <div class="subtasks-title">🔗 Sub-tasks (${subs.length})</div>
      <div id="subtask-list-${task.id}">
        ${subs.length === 0
          ? '<div style="font-size:12px;color:var(--c-text-3);text-align:center;padding:8px">Chưa có sub-task. Thêm bên dưới!</div>'
          : subs.map((sub, idx) => renderSubtaskItem(task.id, sub, idx)).join('')
        }
      </div>
      ${canEdit() ? `
        <div class="subtask-add-form">
          <input type="text"
                 id="sub-input-${task.id}"
                 placeholder="Tên sub-task..."
                 onkeydown="if(event.key==='Enter') addSubtask('${task.id}')"
          />
          <select id="sub-assignee-${task.id}">
            ${TEAM_MEMBERS.map(m => `<option value="${m.id}">${m.name.split(' ').pop()}</option>`).join('')}
          </select>
          <button class="btn-outline sm" onclick="addSubtask('${task.id}')">+ Thêm</button>
        </div>
      ` : ''}
    </div>
  `;
}

function renderSubtaskItem(taskId, sub, idx) {
  const user = getUserById(sub.assigneeId);
  const stageObj = STAGES.find(s => s.id === sub.stage) || STAGES[0];
  return `
    <div class="subtask-item ${sub.stage === 'done' ? 'done' : ''}">
      <span class="subtask-status">${sub.stage === 'done' ? '✅' : '⬜'}</span>
      <div style="flex:1;min-width:0">
        <div class="subtask-name">${escHtml(sub.name)}</div>
        <div style="font-size:11px;color:var(--c-text-3);margin-top:2px">
          <span style="color:${stageObj.color}">${stageObj.icon} ${stageObj.name}</span>
        </div>
      </div>
      <div class="subtask-assignee">
        <div class="avatar-sm" style="width:20px;height:20px;font-size:8px">${user.avatar}</div>
        <span>${user.name.split(' ').pop()}</span>
      </div>
      ${canEdit() ? `
        <div style="display:flex;gap:4px">
          ${sub.stage !== 'done'
            ? `<button class="btn-outline sm" onclick="completeSubtask('${taskId}',${idx})" style="padding:3px 8px;font-size:11px">✓</button>`
            : ''
          }
          <button class="btn-danger sm" onclick="deleteSubtask('${taskId}',${idx})" style="padding:3px 8px;font-size:11px">✕</button>
        </div>
      ` : ''}
    </div>
  `;
}

function addSubtask(taskId) {
  const nameInput = document.getElementById('sub-input-' + taskId);
  const assignSel = document.getElementById('sub-assignee-' + taskId);
  const name = nameInput?.value.trim();
  if (!name) return;

  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.subtasks = task.subtasks || [];
  task.subtasks.push({
    id:         generateId('sub'),
    name,
    assigneeId: assignSel?.value || currentUser?.id,
    stage:      'idea',
    createdAt:  new Date().toISOString(),
    createdBy:  currentUser?.id,
  });
  nameInput.value = '';
  saveData();

  const list = document.getElementById('subtask-list-' + taskId);
  if (list) list.innerHTML = task.subtasks.map((s, i) => renderSubtaskItem(taskId, s, i)).join('');

  showToast('✅ Đã thêm sub-task!', 'success');
}

function completeSubtask(taskId, idx) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task || !task.subtasks[idx]) return;
  task.subtasks[idx].stage = 'done';
  task.subtasks[idx].doneAt = new Date().toISOString();
  saveData();
  const list = document.getElementById('subtask-list-' + taskId);
  if (list) list.innerHTML = task.subtasks.map((s, i) => renderSubtaskItem(taskId, s, i)).join('');
}

function deleteSubtask(taskId, idx) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.subtasks.splice(idx, 1);
  saveData();
  const list = document.getElementById('subtask-list-' + taskId);
  if (list) list.innerHTML = task.subtasks.map((s, i) => renderSubtaskItem(taskId, s, i)).join('');
}
