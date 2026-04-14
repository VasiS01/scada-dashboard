const App = (() => {
  let updateInterval = null;
  const UPDATE_RATE = 2000;
  let isRunning = true;
  let isEmergency = false;
  let startTime = Date.now();
  let dataPointCount = 0;

  function init() {
    SensorSimulator.init();
    ChartManager.init();
    AlarmManager.init();
    OEEManager.init();
    ProductionManager.init();
    PIDController.init();
    InterlockManager.init();
    CommSimulator.init();
    EnergyMonitor.init();
    DataDrawer.init();
    startClock();
    updateShift();
    startSimulation();
    initStationInteraction();
    initControls();
    initSettingsModal();
    initCSVExport();
    startFooterUptime();
  }

  function startClock() {
    function tick() {
      const now = new Date();
      const clockEl = document.getElementById('clock');
      const dateEl = document.getElementById('date');
      if (clockEl) clockEl.textContent = now.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      if (dateEl) dateEl.textContent = now.toLocaleDateString('tr-TR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
      updateShift();
    }
    tick();
    setInterval(tick, 1000);
  }

  function updateShift() {
    const hour = new Date().getHours();
    const shiftText = document.getElementById('shift-text');
    if (!shiftText) return;

    let shift, icon;
    if (hour >= 6 && hour < 14) {
      shift = 'SABAH VARDİYASI (06:00 - 14:00)';
      icon = '☀️';
    } else if (hour >= 14 && hour < 22) {
      shift = 'AKŞAM VARDİYASI (14:00 - 22:00)';
      icon = '🌅';
    } else {
      shift = 'GECE VARDİYASI (22:00 - 06:00)';
      icon = '🌙';
    }

    shiftText.textContent = shift;
    const shiftIcon = document.querySelector('.shift-icon');
    if (shiftIcon) shiftIcon.textContent = icon;
  }

  function startSimulation() {
    function tick() {
      if (!isRunning || isEmergency) return;

      const sensorData = SensorSimulator.update();

      Object.keys(sensorData).forEach(key => updateSensorCard(key, sensorData[key]));

      ChartManager.update(sensorData);

      Object.keys(sensorData).forEach(key => AlarmManager.checkSensor(key, sensorData[key]));

      OEEManager.update(sensorData);
      ProductionManager.update(sensorData);

      if (sensorData.temperature) {
        PIDController.compute('temperature', sensorData.temperature.value, UPDATE_RATE / 1000);
      }

      const interlockActions = InterlockManager.evaluate(sensorData);
      interlockActions.forEach(action => {
        if (action.action === 'stop_line' || action.action === 'emergency_brake') {
          isRunning = false;
          SensorSimulator.setPaused(true);
          updateControlState();
        }
      });

      CommSimulator.update(sensorData);

      EnergyMonitor.update(sensorData);
      DataDrawer.addData(sensorData);

      dataPointCount++;
      updateFooterInfo();

      updateStations(sensorData);
      updateSystemStatus(sensorData);
      updateStatsDisplay(sensorData);
    }
    tick();
    updateInterval = setInterval(tick, UPDATE_RATE);
  }

  function updateStatsDisplay() {
    const sensors = ['temperature', 'pressure', 'speed', 'vibration'];
    sensors.forEach(key => {
      const stats = SensorSimulator.getStatistics(key);
      const minEl = document.getElementById('stat-' + key + '-min');
      const maxEl = document.getElementById('stat-' + key + '-max');
      const avgEl = document.getElementById('stat-' + key + '-avg');
      const stdEl = document.getElementById('stat-' + key + '-std');

      if (minEl) minEl.textContent = stats.min === Infinity ? '--' : stats.min.toFixed(1);
      if (maxEl) maxEl.textContent = stats.max === -Infinity ? '--' : stats.max.toFixed(1);
      if (avgEl) avgEl.textContent = stats.mean.toFixed(1);
      if (stdEl) stdEl.textContent = stats.stddev.toFixed(2);
    });
  }

  function initControls() {
    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnEmergency = document.getElementById('btn-emergency');

    if (btnStart) {
      btnStart.addEventListener('click', function() {
        isRunning = true;
        isEmergency = false;
        SensorSimulator.setPaused(false);
        updateControlState();
      });
    }

    if (btnStop) {
      btnStop.addEventListener('click', function() {
        isRunning = false;
        SensorSimulator.setPaused(true);
        updateControlState();
      });
    }

    if (btnEmergency) {
      btnEmergency.addEventListener('click', function() {
        isEmergency = true;
        isRunning = false;
        SensorSimulator.setPaused(true);
        updateControlState();

        const statusEl = document.getElementById('system-status');
        if (statusEl) {
          statusEl.className = 'system-status emergency';
          statusEl.querySelector('.status-text').textContent = 'ACİL STOP';
        }
      });
    }

    updateControlState();
  }

  function updateControlState() {
    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnEmergency = document.getElementById('btn-emergency');

    if (btnStart) {
      btnStart.disabled = isRunning && !isEmergency;
      btnStart.classList.toggle('disabled', isRunning && !isEmergency);
    }
    if (btnStop) {
      btnStop.disabled = !isRunning;
      btnStop.classList.toggle('disabled', !isRunning);
    }
    if (btnEmergency) {
      btnEmergency.classList.toggle('active-emergency', isEmergency);
    }
  }

  function initSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const btnSettings = document.getElementById('btn-settings');
    const btnClose = document.getElementById('modal-close');
    const btnSave = document.getElementById('btn-save-settings');
    const btnCancel = document.getElementById('btn-cancel-settings');

    if (btnSettings) {
      btnSettings.addEventListener('click', function() {
        loadSettingsToModal();
        modal.style.display = 'flex';
      });
    }

    if (btnClose) btnClose.addEventListener('click', function() { modal.style.display = 'none'; });
    if (btnCancel) btnCancel.addEventListener('click', function() { modal.style.display = 'none'; });

    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.style.display = 'none';
      });
    }

    if (btnSave) {
      btnSave.addEventListener('click', function() {
        saveSettingsFromModal();
        modal.style.display = 'none';
      });
    }
  }

  function loadSettingsToModal() {
    const configs = SensorSimulator.getConfigs();
    Object.keys(configs).forEach(key => {
      const c = configs[key];
      const fields = ['warningMin', 'warningMax', 'criticalMin', 'criticalMax'];
      fields.forEach(f => {
        const input = document.getElementById('set-' + key + '-' + f);
        if (input) input.value = c[f];
      });
    });
  }

  function saveSettingsFromModal() {
    const sensors = ['temperature', 'pressure', 'speed', 'vibration'];
    sensors.forEach(key => {
      const thresholds = {};
      const fields = ['warningMin', 'warningMax', 'criticalMin', 'criticalMax'];
      fields.forEach(f => {
        const input = document.getElementById('set-' + key + '-' + f);
        if (input && input.value !== '') {
          thresholds[f] = parseFloat(input.value);
        }
      });
      SensorSimulator.updateThresholds(key, thresholds);
    });
  }

  function initCSVExport() {
    const btn = document.getElementById('btn-export-csv');
    if (btn) {
      btn.addEventListener('click', exportCSV);
    }
    const pdfBtn = document.getElementById('btn-export-pdf');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', function() {
        PDFReport.generate();
      });
    }
  }

  function exportCSV() {
    const chartData = ChartManager.getChartData();
    const prodData = ProductionManager.getData();
    const alarmData = AlarmManager.getAllAlarms();

    let csv = 'SCADA Dashboard - Veri Raporu\n';
    csv += 'Tarih:,' + new Date().toLocaleString('tr-TR') + '\n\n';

    csv += 'SENSÖR VERİLERİ\n';
    csv += 'Zaman,Sıcaklık (°C),Basınç (bar),Hız (RPM),Titreşim (mm/s)\n';

    const maxLen = Math.max(
      chartData.temperature?.labels?.length || 0,
      chartData.pressure?.labels?.length || 0,
      chartData.speed?.labels?.length || 0,
      chartData.vibration?.labels?.length || 0
    );

    for (let i = 0; i < maxLen; i++) {
      const time = chartData.temperature?.labels?.[i] || chartData.pressure?.labels?.[i] || '';
      const temp = chartData.temperature?.values?.[i]?.toFixed(1) || '';
      const press = chartData.pressure?.values?.[i]?.toFixed(2) || '';
      const speed = chartData.speed?.values?.[i]?.toFixed(0) || '';
      const vib = chartData.vibration?.values?.[i]?.toFixed(2) || '';
      csv += time + ',' + temp + ',' + press + ',' + speed + ',' + vib + '\n';
    }

    csv += '\nSENSÖR İSTATİSTİKLERİ\n';
    csv += 'Sensör,Min,Max,Ortalama,Std Sapma,UCL,LCL,Ölçüm Sayısı\n';
    ['temperature', 'pressure', 'speed', 'vibration'].forEach(key => {
      const stats = SensorSimulator.getStatistics(key);
      const config = SensorSimulator.getConfigs()[key];
      csv += config.name + ',' + stats.min.toFixed(2) + ',' + stats.max.toFixed(2) + ',' +
        stats.mean.toFixed(2) + ',' + stats.stddev.toFixed(2) + ',' +
        stats.ucl.toFixed(2) + ',' + Math.max(0, stats.lcl).toFixed(2) + ',' + stats.count + '\n';
    });

    csv += '\nÜRETİM VERİLERİ\n';
    csv += 'Toplam Üretim,Sağlam,Hatalı,Fire Oranı\n';
    csv += prodData.total + ',' + prodData.good + ',' + prodData.defective + ',' + prodData.wasteRate.toFixed(1) + '%\n';

    csv += '\nALARM GEÇMİŞİ\n';
    csv += 'Zaman,Sensör,Seviye,Mesaj,Detay,Onaylı\n';
    alarmData.forEach(a => {
      csv += a.time + ',' + a.sensor + ',' + a.level + ',"' + a.message + '","' + a.detail + '",' + (a.acknowledged ? 'Evet' : 'Hayır') + '\n';
    });

    csv += '\nGÜVENLİK KİLİT DURUMU\n';
    csv += 'ID,İsim,Durum,Öncelik\n';
    InterlockManager.getStatus().forEach(il => {
      csv += il.id + ',' + il.name + ',' + (il.active ? 'AKTİF' : 'HAZIR') + ',' + il.priority + '\n';
    });

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scada_rapor_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function updateSensorCard(key, data) {
    const valueEl = document.getElementById('sensor-' + key + '-value');
    const barEl = document.getElementById('sensor-' + key + '-bar');
    const dotEl = document.getElementById('sensor-' + key + '-dot');
    const cardEl = document.getElementById('sensor-' + key + '-card');
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
    if (isEmergency) return;
    const statusEl = document.getElementById('system-status');
    if (!statusEl) return;
    const hasCritical = Object.values(sensorData).some(s => s.status === 'critical');
    const hasWarning = Object.values(sensorData).some(s => s.status === 'warning');
    statusEl.className = 'system-status';
    if (!isRunning) {
      statusEl.classList.add('stopped');
      statusEl.querySelector('.status-text').textContent = 'DURDURULDU';
    } else if (hasCritical) {
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

  function startFooterUptime() {
    function updateUptime() {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      const uptimeEl = document.getElementById('footer-uptime');
      if (uptimeEl) {
        uptimeEl.textContent =
          String(hours).padStart(2, '0') + ':' +
          String(minutes).padStart(2, '0') + ':' +
          String(seconds).padStart(2, '0');
      }
    }
    updateUptime();
    setInterval(updateUptime, 1000);
  }

  function updateFooterInfo() {
    const dpEl = document.getElementById('footer-datapoints');
    const lastEl = document.getElementById('footer-last-update');
    if (dpEl) dpEl.textContent = dataPointCount.toLocaleString('tr-TR');
    if (lastEl) {
      lastEl.textContent = new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  return { init };
})();
