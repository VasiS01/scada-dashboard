const CommSimulator = (() => {
  const channels = {
    modbus: {
      name: 'Modbus TCP/IP',
      protocol: 'Modbus TCP',
      address: '192.168.1.100:502',
      status: 'connected',
      latency: 12,
      packetsIn: 0,
      packetsOut: 0,
      errors: 0,
      lastPoll: null,
      pollRate: 1000,
      uptime: 0,
      registers: {
        '40001': { name: 'Sıcaklık', type: 'Holding Register', value: 0 },
        '40002': { name: 'Basınç', type: 'Holding Register', value: 0 },
        '40003': { name: 'Hız', type: 'Holding Register', value: 0 },
        '40004': { name: 'Titreşim', type: 'Holding Register', value: 0 },
        '10001': { name: 'Hat Durumu', type: 'Coil', value: 1 },
        '10002': { name: 'Alarm Aktif', type: 'Coil', value: 0 },
        '30001': { name: 'Üretim Sayacı', type: 'Input Register', value: 0 }
      }
    },
    opcua: {
      name: 'OPC UA',
      protocol: 'OPC UA',
      address: 'opc.tcp://192.168.1.101:4840',
      status: 'connected',
      latency: 8,
      packetsIn: 0,
      packetsOut: 0,
      errors: 0,
      lastPoll: null,
      pollRate: 500,
      uptime: 0
    }
  };

  let startTime = null;

  function init() {
    startTime = Date.now();
    renderStatus();
  }

  function update(sensorData) {
    Object.keys(channels).forEach(key => {
      const ch = channels[key];
      ch.packetsOut++;
      ch.packetsIn++;

      ch.latency = Math.max(1, ch.latency + (Math.random() - 0.5) * 4);
      ch.lastPoll = new Date();
      ch.uptime = Math.floor((Date.now() - startTime) / 1000);

      if (Math.random() < 0.005) {
        ch.errors++;
        ch.status = 'error';
        setTimeout(() => { ch.status = 'connected'; }, 3000);
      }

      if (Math.random() < 0.01) {
        ch.latency += 50 + Math.random() * 100;
        setTimeout(() => { ch.latency = 10 + Math.random() * 5; }, 2000);
      }
    });

    if (sensorData) {
      const regs = channels.modbus.registers;
      if (sensorData.temperature) regs['40001'].value = Math.round(sensorData.temperature.value * 10);
      if (sensorData.pressure) regs['40002'].value = Math.round(sensorData.pressure.value * 100);
      if (sensorData.speed) regs['40003'].value = Math.round(sensorData.speed.value);
      if (sensorData.vibration) regs['40004'].value = Math.round(sensorData.vibration.value * 100);

      const hasAlarm = Object.values(sensorData).some(s => s.status === 'critical');
      regs['10002'].value = hasAlarm ? 1 : 0;
    }

    renderStatus();
  }

  function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function renderStatus() {
    const container = document.getElementById('comm-status-list');
    if (!container) return;

    let html = '';
    Object.keys(channels).forEach(key => {
      const ch = channels[key];
      const statusClass = ch.status === 'connected' ? 'comm-ok' : 'comm-error';
      const statusIcon = ch.status === 'connected' ? '🟢' : '🔴';
      const latencyClass = ch.latency > 100 ? 'lat-high' : ch.latency > 50 ? 'lat-med' : 'lat-low';

      html += '<div class="comm-channel ' + statusClass + '">' +
        '<div class="comm-header-row">' +
          '<span class="comm-status-icon">' + statusIcon + '</span>' +
          '<span class="comm-name">' + ch.name + '</span>' +
          '<span class="comm-protocol-badge">' + ch.protocol + '</span>' +
        '</div>' +
        '<div class="comm-address">' + ch.address + '</div>' +
        '<div class="comm-metrics">' +
          '<div class="comm-metric">' +
            '<span class="comm-metric-label">Gecikme</span>' +
            '<span class="comm-metric-value ' + latencyClass + '">' + ch.latency.toFixed(0) + ' ms</span>' +
          '</div>' +
          '<div class="comm-metric">' +
            '<span class="comm-metric-label">TX / RX</span>' +
            '<span class="comm-metric-value">' + ch.packetsOut + ' / ' + ch.packetsIn + '</span>' +
          '</div>' +
          '<div class="comm-metric">' +
            '<span class="comm-metric-label">Hata</span>' +
            '<span class="comm-metric-value" style="color:' + (ch.errors > 0 ? '#ff4757' : '#00ff88') + '">' + ch.errors + '</span>' +
          '</div>' +
          '<div class="comm-metric">' +
            '<span class="comm-metric-label">Uptime</span>' +
            '<span class="comm-metric-value">' + formatUptime(ch.uptime) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    });

    const regs = channels.modbus.registers;
    html += '<div class="comm-registers">' +
      '<div class="comm-reg-title">MODBUS REGISTER HARİTASI</div>' +
      '<table class="reg-table">' +
        '<thead><tr><th>Adres</th><th>Tip</th><th>Tanım</th><th>Değer</th></tr></thead>' +
        '<tbody>';

    Object.keys(regs).forEach(addr => {
      const reg = regs[addr];
      html += '<tr>' +
        '<td class="reg-addr">' + addr + '</td>' +
        '<td class="reg-type">' + reg.type + '</td>' +
        '<td>' + reg.name + '</td>' +
        '<td class="reg-value">' + reg.value + '</td>' +
      '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  return { init, update };
})();
