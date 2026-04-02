const ChartManager = (() => {
  let charts = {};
  const MAX_POINTS = 30;

  const chartConfigs = {
    temperature: { color: '#ff6b6b', label: 'Sıcaklık (°C)', unit: '°C', min: 0, max: 150 },
    pressure: { color: '#00d4ff', label: 'Basınç (bar)', unit: 'bar', min: 0, max: 10 },
    speed: { color: '#00ff88', label: 'Hız (RPM)', unit: 'RPM', min: 0, max: 3000 },
    vibration: { color: '#ff9f43', label: 'Titreşim (mm/s)', unit: 'mm/s', min: 0, max: 20 }
  };

  function createChartOptions(config) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400, easing: 'easeInOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleFont: { family: "'Rajdhani', sans-serif", size: 13 },
          bodyFont: { family: "'Inter', sans-serif", size: 12 },
          borderColor: 'rgba(148, 163, 184, 0.2)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              let val = context.parsed.y;
              if (val !== null && val !== undefined) {
                return config.label + ': ' + val.toFixed(2) + ' ' + config.unit;
              }
              return '';
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(148, 163, 184, 0.06)', drawBorder: false },
          ticks: {
            color: '#64748b',
            font: { family: "'Rajdhani', sans-serif", size: 11 },
            maxTicksLimit: 8
          },
          border: { display: false }
        },
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.06)', drawBorder: false },
          ticks: {
            color: '#64748b',
            font: { family: "'Rajdhani', sans-serif", size: 11 },
            callback: function(value) {
              return value + ' ' + config.unit;
            }
          },
          border: { display: false },
          min: config.min,
          max: config.max,
          title: {
            display: true,
            text: config.unit,
            color: config.color,
            font: { family: "'Rajdhani', sans-serif", size: 12, weight: '600' }
          }
        }
      }
    };
  }

  function timeLabel(date) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function init() {
    Object.keys(chartConfigs).forEach(key => {
      const config = chartConfigs[key];
      const canvas = document.getElementById('chart-' + key);
      if (!canvas) return;

      charts[key] = new Chart(canvas, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: config.label,
            data: [],
            borderColor: config.color,
            backgroundColor: config.color.replace(')', ', 0.1)').replace('rgb', 'rgba').replace('#', ''),
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 6,
            pointBackgroundColor: config.color,
            pointHoverBackgroundColor: config.color,
            tension: 0.3,
            fill: true
          }]
        },
        options: createChartOptions(config)
      });
    });

    fixChartBackgrounds();
  }

  function fixChartBackgrounds() {
    Object.keys(charts).forEach(key => {
      const config = chartConfigs[key];
      const chart = charts[key];
      if (!chart || !chart.ctx) return;

      const gradient = chart.ctx.createLinearGradient(0, 0, 0, chart.height || 200);
      const rgb = hexToRgb(config.color);
      if (rgb) {
        gradient.addColorStop(0, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', 0.25)');
        gradient.addColorStop(1, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', 0.02)');
        chart.data.datasets[0].backgroundColor = gradient;
        chart.update('none');
      }
    });
  }

  function hexToRgb(hex) {
    if (hex.startsWith('#')) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }
    return null;
  }

  function update(sensorData) {
    const now = timeLabel(new Date());

    Object.keys(charts).forEach(key => {
      const chart = charts[key];
      if (!chart || !sensorData[key]) return;

      const value = parseFloat(sensorData[key].value);
      if (isNaN(value)) return;

      chart.data.labels.push(now);
      chart.data.datasets[0].data.push(value);

      if (chart.data.labels.length > MAX_POINTS) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
      }

      chart.update('none');
    });
  }

  function getChartData() {
    const result = {};
    Object.keys(charts).forEach(key => {
      const chart = charts[key];
      if (chart) {
        result[key] = {
          labels: [...chart.data.labels],
          values: [...chart.data.datasets[0].data]
        };
      }
    });
    return result;
  }

  return { init, update, getChartData };
})();
