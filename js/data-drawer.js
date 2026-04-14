const DataDrawer = (() => {
  let isOpen = false;
  let rawDataLog = [];
  const MAX_LOG = 2000;
  let currentFilter = 'all';
  let currentStatusFilter = 'all';
  let displayLimit = 100;

  function init() {
    const toggleBtn = document.getElementById('btn-data-drawer');
    const closeBtn = document.getElementById('drawer-close');
    const backdrop = document.getElementById('drawer-backdrop');
    const exportBtn = document.getElementById('btn-export-excel');
    const filterBtns = document.querySelectorAll('.drawer-filter-btn');
    const statusFilterBtns = document.querySelectorAll('.drawer-status-btn');
    const limitSelect = document.getElementById('drawer-limit-select');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggle);
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', close);
    }
    if (backdrop) {
      backdrop.addEventListener('click', close);
    }
    if (exportBtn) {
      exportBtn.addEventListener('click', exportToExcel);
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.sensor;
        renderTable();
      });
    });

    statusFilterBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        statusFilterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentStatusFilter = this.dataset.status;
        renderTable();
      });
    });

    if (limitSelect) {
      limitSelect.addEventListener('change', function() {
        displayLimit = parseInt(this.value);
        renderTable();
      });
    }
  }

  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  function open() {
    isOpen = true;
    const drawer = document.getElementById('data-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('visible');
    renderTable();
  }

  function close() {
    isOpen = false;
    const drawer = document.getElementById('data-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('visible');
  }

  function addData(sensorData) {
    const timestamp = new Date();
    const timeStr = timestamp.toLocaleTimeString('tr-TR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const dateStr = timestamp.toLocaleDateString('tr-TR');

    Object.keys(sensorData).forEach(key => {
      const d = sensorData[key];
      rawDataLog.unshift({
        timestamp: timestamp.getTime(),
        date: dateStr,
        time: timeStr,
        sensor: key,
        sensorName: d.config.name,
        value: d.value,
        displayValue: d.displayValue,
        unit: d.config.unit,
        status: d.status,
        percentage: d.percentage.toFixed(1)
      });
    });

    if (rawDataLog.length > MAX_LOG) {
      rawDataLog = rawDataLog.slice(0, MAX_LOG);
    }

    updateCounter();

    if (isOpen) {
      renderTable();
    }
  }

  function updateCounter() {
    const counter = document.getElementById('drawer-data-count');
    if (counter) {
      counter.textContent = rawDataLog.length;
    }
  }

  function getFilteredData() {
    let filtered = rawDataLog;

    if (currentFilter !== 'all') {
      filtered = filtered.filter(d => d.sensor === currentFilter);
    }

    if (currentStatusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === currentStatusFilter);
    }

    return filtered.slice(0, displayLimit);
  }

  function renderTable() {
    const tbody = document.getElementById('drawer-table-body');
    if (!tbody) return;

    const data = getFilteredData();
    const totalFiltered = data.length;

    const infoEl = document.getElementById('drawer-info-text');
    if (infoEl) {
      infoEl.textContent = totalFiltered + ' / ' + rawDataLog.length + ' kayıt gösteriliyor';
    }

    if (data.length === 0) {
      tbody.innerHTML = '<tr class="drawer-empty-row"><td colspan="7">Henüz veri yok — sistem çalıştığında veriler burada görünecek</td></tr>';
      return;
    }

    let html = '';
    data.forEach(d => {
      const statusClass = d.status === 'critical' ? 'status-critical'
        : d.status === 'warning' ? 'status-warning' : 'status-normal';
      const statusText = d.status === 'critical' ? 'KRİTİK'
        : d.status === 'warning' ? 'UYARI' : 'NORMAL';

      html += '<tr class="drawer-data-row">';
      html += '<td class="drawer-td-time">' + d.time + '</td>';
      html += '<td class="drawer-td-date">' + d.date + '</td>';
      html += '<td class="drawer-td-sensor"><span class="drawer-sensor-badge" data-sensor="' + d.sensor + '">' + d.sensorName + '</span></td>';
      html += '<td class="drawer-td-value">' + d.displayValue + ' ' + d.unit + '</td>';
      html += '<td class="drawer-td-percent">' + d.percentage + '%</td>';
      html += '<td><span class="drawer-status-badge ' + statusClass + '">' + statusText + '</span></td>';
      html += '</tr>';
    });

    tbody.innerHTML = html;
  }

  function exportToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('Excel kütüphanesi yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
      return;
    }

    const data = currentFilter === 'all' && currentStatusFilter === 'all'
      ? rawDataLog : getFilteredData();

    if (data.length === 0) {
      alert('Dışa aktarılacak veri bulunamadı.');
      return;
    }

    const wb = XLSX.utils.book_new();

    const sensorRows = data.map(d => ({
      'Tarih': d.date,
      'Saat': d.time,
      'Sensör': d.sensorName,
      'Değer': parseFloat(d.displayValue),
      'Birim': d.unit,
      'Yüzde (%)': parseFloat(d.percentage),
      'Durum': d.status === 'critical' ? 'KRİTİK' : d.status === 'warning' ? 'UYARI' : 'NORMAL'
    }));

    const ws1 = XLSX.utils.json_to_sheet(sensorRows);
    ws1['!cols'] = [
      { wch: 12 }, { wch: 10 }, { wch: 14 },
      { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Ham Veriler');

    const sensors = ['temperature', 'pressure', 'speed', 'vibration'];
    const statsRows = [];
    sensors.forEach(key => {
      if (typeof SensorSimulator !== 'undefined') {
        const stats = SensorSimulator.getStatistics(key);
        const config = SensorSimulator.getConfigs()[key];
        statsRows.push({
          'Sensör': config.name,
          'Birim': config.unit,
          'Min': parseFloat(stats.min.toFixed(2)),
          'Max': parseFloat(stats.max.toFixed(2)),
          'Ortalama': parseFloat(stats.mean.toFixed(2)),
          'Std Sapma': parseFloat(stats.stddev.toFixed(4)),
          'UCL': parseFloat(stats.ucl.toFixed(2)),
          'LCL': parseFloat(Math.max(0, stats.lcl).toFixed(2)),
          'Ölçüm Sayısı': stats.count
        });
      }
    });

    if (statsRows.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(statsRows);
      ws2['!cols'] = [
        { wch: 14 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 14 }
      ];
      XLSX.utils.book_append_sheet(wb, ws2, 'İstatistikler');
    }

    if (typeof ProductionManager !== 'undefined') {
      const prod = ProductionManager.getData();
      const ws3 = XLSX.utils.json_to_sheet([{
        'Toplam Üretim': prod.total,
        'Sağlam Parça': prod.good,
        'Hatalı Parça': prod.defective,
        'Fire Oranı (%)': parseFloat(prod.wasteRate.toFixed(2))
      }]);
      ws3['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'Üretim');
    }

    if (typeof AlarmManager !== 'undefined') {
      const alarms = AlarmManager.getAllAlarms();
      if (alarms.length > 0) {
        const alarmRows = alarms.map(a => ({
          'Zaman': a.time,
          'Sensör': a.sensor,
          'Seviye': a.level,
          'Mesaj': a.message,
          'Detay': a.detail,
          'Onaylı': a.acknowledged ? 'Evet' : 'Hayır'
        }));
        const ws4 = XLSX.utils.json_to_sheet(alarmRows);
        ws4['!cols'] = [
          { wch: 10 }, { wch: 12 }, { wch: 10 },
          { wch: 30 }, { wch: 30 }, { wch: 8 }
        ];
        XLSX.utils.book_append_sheet(wb, ws4, 'Alarmlar');
      }
    }

    if (typeof InterlockManager !== 'undefined') {
      const ilStatus = InterlockManager.getStatus();
      if (ilStatus.length > 0) {
        const ilRows = ilStatus.map(il => ({
          'ID': il.id,
          'İsim': il.name,
          'Durum': il.active ? 'AKTİF' : 'HAZIR',
          'Öncelik': il.priority
        }));
        const ws5 = XLSX.utils.json_to_sheet(ilRows);
        ws5['!cols'] = [{ wch: 12 }, { wch: 24 }, { wch: 10 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, ws5, 'Interlocklar');
      }
    }

    if (typeof EnergyMonitor !== 'undefined') {
      const eData = EnergyMonitor.getData();
      const ws6 = XLSX.utils.json_to_sheet([{
        'Anlık Güç (kW)': eData.currentPower,
        'Toplam Enerji (kWh)': eData.totalEnergy,
        'Tahmini Maliyet (₺)': eData.estimatedCost,
        'Verimlilik (%)': eData.efficiency
      }]);
      ws6['!cols'] = [{ wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws6, 'Enerji');
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toLocaleTimeString('tr-TR', {
      hour: '2-digit', minute: '2-digit'
    }).replace(':', '-');
    XLSX.writeFile(wb, 'SCADA_Rapor_' + dateStr + '_' + timeStr + '.xlsx');

    const exportBtn = document.getElementById('btn-export-excel');
    if (exportBtn) {
      const origText = exportBtn.innerHTML;
      exportBtn.innerHTML = '✅ İndirildi!';
      exportBtn.classList.add('export-success');
      setTimeout(() => {
        exportBtn.innerHTML = origText;
        exportBtn.classList.remove('export-success');
      }, 2000);
    }
  }

  return { init, addData, toggle, open, close, exportToExcel };
})();
