/* ================================================
   VIWORK — Performance Module
   Charts, KPI, Revenue Analytics
   ================================================ */

let charts = {};

function renderPerformance() {
  renderRevenueChart();
  renderChannelChart();
  renderConversionChart();
  renderKPIList();
}

function renderRevenueChart() {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;
  if (charts.revenue) charts.revenue.destroy();

  const revData = getDynamicRevenue(); // Gap 2: sử dụng data động

  charts.revenue = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: revData.map(m => m.month),
      datasets: [
        {
          label: 'Mục tiêu (tỷ)',
          data: revData.map(m => m.target),
          backgroundColor: 'rgba(90,184,0,0.12)',
          borderColor: 'rgba(90,184,0,0.5)',
          borderWidth: 1,
          borderRadius: 4,
          order: 2,
          type: 'line',
          fill: false,
          tension: 0.4,
          pointBackgroundColor: 'rgba(90,184,0,0.8)',
          pointRadius: 4,
        },
        {
          label: 'Thực tế (tỷ)',
          data: revData.map(m => m.actual),
          backgroundColor: revData.map(m =>
            m.actual === null ? 'transparent' :
            m.actual >= m.target ? 'rgba(16,185,129,0.7)' : 'rgba(245,158,11,0.7)'
          ),
          borderColor: revData.map(m =>
            m.actual === null ? 'transparent' :
            m.actual >= m.target ? '#10B981' : '#F59E0B'
          ),
          borderWidth: 1,
          borderRadius: 6,
          order: 1,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#94A3B8', font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y !== null ? ctx.parsed.y + ' tỷ' : 'Chưa có'}`
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8', callback: v => v + ' tỷ' } }
      }
    }
  });
}

function renderChannelChart() {
  const ctx = document.getElementById('channelChart');
  if (!ctx) return;
  if (charts.channel) charts.channel.destroy();

  const labels  = Object.keys(CHANNEL_PERFORMANCE).map(k => `${CHANNELS[k]?.icon} ${CHANNELS[k]?.name}`);
  const revenue = Object.values(CHANNEL_PERFORMANCE).map(c => c.revenue);
  const colors  = ['#1877F2','#0084FF','#EE1D52','#E1306C','#EE4D2D','#10B981'];

  charts.channel = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: revenue,
        backgroundColor: colors.map(c => c + 'CC'),
        borderColor: colors,
        borderWidth: 2,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right', labels: { color: '#94A3B8', font:{size:11}, padding: 12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} tỷ` } }
      }
    }
  });
}

function renderConversionChart() {
  const ctx = document.getElementById('conversionChart');
  if (!ctx) return;
  if (charts.conversion) charts.conversion.destroy();

  const data = STAGES.map(s => ({
    stage: s.name,
    count: appState.tasks.filter(t => t.stage === s.id).length
  }));

  charts.conversion = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.stage),
      datasets: [{
        label: 'Số CVC',
        data: data.map(d => d.count),
        backgroundColor: STAGES.map(s => s.color + 'AA'),
        borderColor: STAGES.map(s => s.color),
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8' } }
      }
    }
  });
}

function renderKPIList() {
  const el = document.getElementById('kpiList');
  if (!el) return;

  // Gap 2: Tính KPI động từ task data thực tế
  const tasks        = appState.tasks;
  const doneTasks    = tasks.filter(t => t.stage === 'done');
  const totalRev     = getTotalActualRevenue();
  const targetRevMo  = APP_CONFIG.revenueTarget / APP_CONFIG.opMonths;

  const wonLeads    = appState.leads.filter(l => l.stage === 'won').length;
  const totalLeads  = appState.leads.length;
  const closedRate  = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
  const fbLeads     = appState.leads.filter(l => l.channel === 'facebook').length;
  const activeCtv   = TEAM_MEMBERS.filter(m => m.role === 'staff').length;

  const kpis = [
    { name: '🎯 Doanh thu tích lũy', current: parseFloat(totalRev.toFixed(1)), target: parseFloat(targetRevMo.toFixed(1)), unit: 'tỷ', color: '#10B981' },
    { name: '✅ CVC hoàn thành', current: doneTasks.length, target: Math.max(tasks.length, 10), unit: 'task', color: '#3B82F6' },
    { name: '👥 Khách đã chốt (Won)', current: wonLeads, target: Math.max(totalLeads, 5), unit: 'KH', color: '#7C3AED' },
    { name: '📱 Leads Facebook', current: fbLeads, target: Math.max(fbLeads + 20, 30), unit: 'leads', color: '#1877F2' },
    { name: '📊 Tỷ lệ chốt đơn', current: closedRate, target: 35, unit: '%', color: '#F59E0B' },
    { name: '📄 CVC đang xử lý', current: tasks.filter(t => t.stage === 'inprogress').length, target: Math.max(tasks.length, 5), unit: 'CVC', color: '#5AB800' },
  ];

  el.innerHTML = kpis.map(k => {
    const pct = Math.min(Math.round((k.current / k.target) * 100), 100);
    const isGood = pct >= 100;
    return `
      <div class="kpi-item">
        <div class="kpi-info">
          <div class="kpi-name">${k.name}</div>
          <div class="kpi-bar-wrap">
            <div class="kpi-bar" style="width:${pct}%;background:${k.color}"></div>
          </div>
          <div style="font-size:11px;color:var(--c-text-3);margin-top:3px">${k.current} / ${k.target} ${k.unit}</div>
        </div>
        <div class="kpi-pct" style="color:${isGood ? '#10B981' : k.color}">${pct}%</div>
      </div>
    `;
  }).join('');
}
