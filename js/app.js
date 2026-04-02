const App = (() => {
  let updateInterval = null;
  const UPDATE_RATE = 2000; 
  function init() {
    console.log('🏭 SCADA Dashboard başlatılıyor...');
    SensorSimulator.init();
    ChartManager.init();
    AlarmManager.init();
    OEEManager.init();
    startClock();
    startSimulation();
    initStationInteraction();
    console.log('✅ SCADA Dashboard hazır!');
  }
  function startClock() {
    function tick() {
      const now = new Date();
      const clockEl = document.getElementById('clock');
      const dateEl = document.getElementById('date');
      if (clockEl) clockEl.textContent = now.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      if (dateEl) dateEl.textContent = now.toLocaleDateString('tr-TR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    }
    tick();
    setInterval(tick, 1000);
  }
  function startSimulation() {
    function tick() {
      const sensorData = SensorSimulator.update();
      Object.keys(sensorData).forEach(key => updateSensorCard(key, sensorData[key]));
      ChartManager.update(sensorData);
      Object.keys(sensorData).forEach(key => AlarmManager.checkSensor(key, sensorData[key]));
      OEEManager.update(sensorData);
      updateStations(sensorData);
      updateSystemStatus(sensorData);
    }
    tick(); 
    updateInterval = setInterval(tick, UPDATE_RATE);
  }
  function updateSensorCard(key, data) {
    const valueEl = document.getElementById(`sensor-${key}-value`);
    const barEl = document.getElementById(`sensor-${key}-bar`);
    const dotEl = document.getElementById(`sensor-${key}-dot`);
    const cardEl = document.getElementById(`sensor-${key}-card`);
    if (valueEl) valueEl.textContent = data.displayValue;
    if (barEl) {
      barEl.style.width = Math.min(100, Math.max(0, data.percentage)) + '%';
      barEl.style.background = data.status === 'critical' ? '#ff4757'
        : data.status === 'warning' ? '#ff9f43' : data.config.color;
    }
    if (dotEl) {
      dotEl.className = 'sensor-status-dot' + (data.status !== 'normal' ? ' ' + data.status : '');
    }
    if (cardEl) {
      cardEl.classList.toggle('alarm', data.status === 'critical');
    }
  }
  function updateStations(sensorData) {
    const stations = ['station-1', 'station-2', 'station-3'];
    const sensorKeys = ['temperature', 'pressure', 'speed'];
    stations.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      const status = sensorData[sensorKeys[i]]?.status || 'normal';
      el.className = 'station-box';
      if (status === 'critical') el.classList.add('error');
      else if (status === 'warning') el.classList.add('warning');
      else el.classList.add('active');
    });
    const svgTempLabel = document.getElementById('svg-temp-label');
    const svgPressLabel = document.getElementById('svg-press-label');
    if (svgTempLabel && sensorData.temperature) {
      svgTempLabel.textContent = sensorData.temperature.displayValue + '°C';
    }
    if (svgPressLabel && sensorData.pressure) {
      svgPressLabel.textContent = sensorData.pressure.displayValue + ' bar';
    }
  }
  function updateSystemStatus(sensorData) {
    const statusEl = document.getElementById('system-status');
    if (!statusEl) return;
    const hasCritical = Object.values(sensorData).some(s => s.status === 'critical');
    const hasWarning = Object.values(sensorData).some(s => s.status === 'warning');
    statusEl.className = 'system-status';
    if (hasCritical) {
      statusEl.classList.add('critical');
      statusEl.querySelector('.status-text').textContent = 'KRİTİK';
    } else if (hasWarning) {
      statusEl.classList.add('warning');
      statusEl.querySelector('.status-text').textContent = 'UYARI';
    } else {
      statusEl.querySelector('.status-text').textContent = 'ÇALIŞIYOR';
    }
  }
  function initStationInteraction() {
    document.querySelectorAll('.station-box').forEach(el => {
      el.style.cursor = 'pointer';
    });
  }
  document.addEventListener('DOMContentLoaded', init);
  return { init };
})();
