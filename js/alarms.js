const AlarmManager = (() => {
  const MAX_ALARMS = 15;
  let alarms = [];
  let alarmIdCounter = 0;
  let alarmContainer = null;
  let alarmCountEl = null;
  const alarmMessages = {
    temperature: {
      warning: { high: 'Sıcaklık uyarı seviyesini aştı', low: 'Sıcaklık düşük uyarı seviyesinde' },
      critical: { high: 'KRİTİK: Sıcaklık tehlikeli seviyede!', low: 'KRİTİK: Sıcaklık çok düşük!' }
    },
    pressure: {
      warning: { high: 'Basınç uyarı seviyesini aştı', low: 'Basınç düşük uyarı seviyesinde' },
      critical: { high: 'KRİTİK: Basınç çok yüksek!', low: 'KRİTİK: Basınç çok düşük!' }
    },
    speed: {
      warning: { high: 'Motor hızı uyarı seviyesinde', low: 'Motor hızı düşük' },
      critical: { high: 'KRİTİK: Motor aşırı hız!', low: 'KRİTİK: Motor durma riski!' }
    },
    vibration: {
      warning: { high: 'Titreşim seviyesi artıyor', low: 'Titreşim anormal düşük' },
      critical: { high: 'KRİTİK: Aşırı titreşim tespit edildi!', low: 'KRİTİK: Titreşim sensörü arızası' }
    }
  };
  function init() {
    alarmContainer = document.getElementById('alarm-list');
    alarmCountEl = document.getElementById('alarm-count');
    renderAlarms();
  }
  function checkSensor(sensorKey, sensorData) {
    if (sensorData.statusChanged && sensorData.status !== 'normal') {
      const dir = sensorData.value > sensorData.config.baseValue ? 'high' : 'low';
      const msg = alarmMessages[sensorKey]?.[sensorData.status]?.[dir];
      if (!msg) return;
      const val = typeof sensorData.value === 'number' ? sensorData.value.toFixed(1) : sensorData.value;
      alarms.unshift({
        id: ++alarmIdCounter, sensorKey, level: sensorData.status,
        message: msg, detail: `${sensorData.config.name}: ${val} ${sensorData.config.unit}`,
        time: new Date(), acknowledged: false
      });
      if (alarms.length > MAX_ALARMS) alarms = alarms.slice(0, MAX_ALARMS);
      renderAlarms();
    }
    if (sensorData.statusChanged && sensorData.status === 'normal' && sensorData.previousStatus !== 'normal') {
      alarms.unshift({
        id: ++alarmIdCounter, sensorKey, level: 'info',
        message: `${sensorData.config.name} normal seviyeye döndü`,
        detail: `${sensorData.config.name}: ${sensorData.displayValue} ${sensorData.config.unit}`,
        time: new Date(), acknowledged: false
      });
      if (alarms.length > MAX_ALARMS) alarms = alarms.slice(0, MAX_ALARMS);
      renderAlarms();
    }
  }
  function acknowledgeAlarm(alarmId) {
    const alarm = alarms.find(a => a.id === alarmId);
    if (alarm) { alarm.acknowledged = true; renderAlarms(); }
  }
  function renderAlarms() {
    if (!alarmContainer) return;
    if (alarms.length === 0) {
      alarmContainer.innerHTML = '<div class="alarm-empty">✅ Aktif alarm bulunmuyor</div>';
    } else {
      alarmContainer.innerHTML = alarms.map(a => {
        const icon = a.level === 'critical' ? '🔴' : a.level === 'warning' ? '🟠' : '🔵';
        const t = a.time.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
        const ack = a.acknowledged
          ? '<span class="alarm-ack-btn" style="color:var(--accent-green);border-color:var(--accent-green);">✓</span>'
          : `<button class="alarm-ack-btn" onclick="AlarmManager.acknowledgeAlarm(${a.id})">Onayla</button>`;
        return `<div class="alarm-item ${a.level}" ${a.acknowledged?'style="opacity:0.5"':''}>
          <span class="alarm-icon">${icon}</span>
          <div class="alarm-content"><div class="alarm-message">${a.message}</div>
          <div class="alarm-time">${t} — ${a.detail}</div></div>${ack}</div>`;
      }).join('');
    }
    const active = alarms.filter(a => !a.acknowledged && a.level !== 'info').length;
    if (alarmCountEl) {
      alarmCountEl.textContent = active;
      alarmCountEl.style.display = active > 0 ? 'inline-flex' : 'none';
    }
  }
  function getActiveCount() { return alarms.filter(a => !a.acknowledged && a.level !== 'info').length; }
  return { init, checkSensor, acknowledgeAlarm, getActiveCount };
})();
