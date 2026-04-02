const InterlockManager = (() => {
  const interlocks = [
    {
      id: 'IL-001',
      name: 'Aşırı Sıcaklık Kilidi',
      description: 'Sıcaklık 120°C üzerinde → Hat otomatik durur',
      sensor: 'temperature',
      condition: 'above',
      threshold: 120,
      action: 'stop_line',
      priority: 'critical',
      active: false,
      triggered: false,
      triggerTime: null,
      resetType: 'manual'
    },
    {
      id: 'IL-002',
      name: 'Düşük Basınç Kilidi',
      description: 'Basınç 1.5 bar altında → Presleme durur',
      sensor: 'pressure',
      condition: 'below',
      threshold: 1.5,
      action: 'stop_station',
      priority: 'critical',
      active: false,
      triggered: false,
      triggerTime: null,
      resetType: 'manual'
    },
    {
      id: 'IL-003',
      name: 'Aşırı Titreşim Kilidi',
      description: 'Titreşim 10 mm/s üzerinde → Hız düşür',
      sensor: 'vibration',
      condition: 'above',
      threshold: 10,
      action: 'reduce_speed',
      priority: 'warning',
      active: false,
      triggered: false,
      triggerTime: null,
      resetType: 'auto'
    },
    {
      id: 'IL-004',
      name: 'Aşırı Hız Kilidi',
      description: 'Motor hızı 2500 RPM üzeri → Acil fren',
      sensor: 'speed',
      condition: 'above',
      threshold: 2500,
      action: 'emergency_brake',
      priority: 'critical',
      active: false,
      triggered: false,
      triggerTime: null,
      resetType: 'manual'
    },
    {
      id: 'IL-005',
      name: 'Düşük Sıcaklık Kilidi',
      description: 'Sıcaklık 20°C altında → Isıtıcı devreye girer',
      sensor: 'temperature',
      condition: 'below',
      threshold: 20,
      action: 'activate_heater',
      priority: 'warning',
      active: false,
      triggered: false,
      triggerTime: null,
      resetType: 'auto'
    }
  ];

  let container = null;

  function init() {
    container = document.getElementById('interlock-list');
    renderInterlocks();
  }

  function evaluate(sensorData) {
    let actions = [];

    interlocks.forEach(il => {
      const data = sensorData[il.sensor];
      if (!data) return;

      let conditionMet = false;
      if (il.condition === 'above' && data.value > il.threshold) conditionMet = true;
      if (il.condition === 'below' && data.value < il.threshold) conditionMet = true;

      if (conditionMet && !il.triggered) {
        il.triggered = true;
        il.active = true;
        il.triggerTime = new Date();
        actions.push({ interlock: il, action: il.action });
      }

      if (!conditionMet && il.triggered && il.resetType === 'auto') {
        il.triggered = false;
        il.active = false;
        il.triggerTime = null;
      }
    });

    renderInterlocks();
    return actions;
  }

  function resetInterlock(id) {
    const il = interlocks.find(i => i.id === id);
    if (il) {
      il.triggered = false;
      il.active = false;
      il.triggerTime = null;
      renderInterlocks();
    }
  }

  function renderInterlocks() {
    if (!container) return;

    container.innerHTML = interlocks.map(il => {
      const statusClass = il.active ? (il.priority === 'critical' ? 'il-critical' : 'il-warning') : 'il-ok';
      const statusText = il.active ? 'AKTİF' : 'HAZIR';
      const statusIcon = il.active ? (il.priority === 'critical' ? '🔴' : '🟠') : '🟢';
      const timeStr = il.triggerTime ? il.triggerTime.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) : '--:--:--';
      const resetBtn = (il.active && il.resetType === 'manual')
        ? '<button class="il-reset-btn" onclick="InterlockManager.resetInterlock(\'' + il.id + '\')">RESET</button>'
        : (il.resetType === 'auto' ? '<span class="il-auto-tag">OTO</span>' : '');

      return '<div class="il-item ' + statusClass + '">' +
        '<div class="il-status-col">' +
          '<span class="il-status-icon">' + statusIcon + '</span>' +
          '<span class="il-status-text">' + statusText + '</span>' +
        '</div>' +
        '<div class="il-info-col">' +
          '<div class="il-id">' + il.id + '</div>' +
          '<div class="il-name">' + il.name + '</div>' +
          '<div class="il-desc">' + il.description + '</div>' +
        '</div>' +
        '<div class="il-time-col">' + timeStr + '</div>' +
        '<div class="il-action-col">' + resetBtn + '</div>' +
      '</div>';
    }).join('');
  }

  function getStatus() {
    return interlocks.map(il => ({
      id: il.id,
      name: il.name,
      active: il.active,
      priority: il.priority
    }));
  }

  return { init, evaluate, resetInterlock, getStatus };
})();
