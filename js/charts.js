const ChartManager = (() => {
  let tempPressureChart = null;
  let speedVibrationChart = null;
  const MAX_POINTS = 30;
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 400,
      easing: 'easeInOutQuart',
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: {
            family: "'Rajdhani', sans-serif",
            size: 12,
            weight: '600',
          },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleFont: {
          family: "'Rajdhani', sans-serif",
          size: 13,
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 12,
        },
        borderColor: 'rgba(148, 163, 184, 0.2)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.06)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            family: "'Rajdhani', sans-serif",
            size: 11,
          },
          maxTicksLimit: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.06)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            family: "'Rajdhani', sans-serif",
            size: 11,
          },
        },
        border: {
          display: false,
        },
      },
    },
  };
  function createGradient(ctx, color, height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
    gradient.addColorStop(1, color.replace(')', ', 0.0)').replace('rgb', 'rgba'));
    return gradient;
  }
  function timeLabel(date) {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  function init() {
    const ctx1 = document.getElementById('chart-temp-pressure');
    if (ctx1) {
      tempPressureChart = new Chart(ctx1, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Sıcaklık (°C)',
              data: [],
              borderColor: '#ff6b6b',
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: '#ff6b6b',
              tension: 0.3,
              fill: true,
            },
            {
              label: 'Basınç (bar)',
              data: [],
              borderColor: '#00d4ff',
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: '#00d4ff',
              tension: 0.3,
              fill: true,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: {
              ...commonOptions.scales.y,
              position: 'left',
              title: {
                display: true,
                text: '°C',
                color: '#ff6b6b',
                font: { family: "'Rajdhani', sans-serif", size: 12, weight: '600' },
              },
              min: 0,
              max: 150,
            },
            y1: {
              ...commonOptions.scales.y,
              position: 'right',
              title: {
                display: true,
                text: 'bar',
                color: '#00d4ff',
                font: { family: "'Rajdhani', sans-serif", size: 12, weight: '600' },
              },
              min: 0,
              max: 10,
              grid: {
                drawOnChartArea: false,
              },
            },
          },
        },
      });
    }
    const ctx2 = document.getElementById('chart-speed-vibration');
    if (ctx2) {
      speedVibrationChart = new Chart(ctx2, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Hız (RPM)',
              data: [],
              borderColor: '#00ff88',
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: '#00ff88',
              tension: 0.3,
              fill: true,
            },
            {
              label: 'Titreşim (mm/s)',
              data: [],
              borderColor: '#ff9f43',
              backgroundColor: 'rgba(255, 159, 67, 0.1)',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: '#ff9f43',
              tension: 0.3,
              fill: true,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: {
              ...commonOptions.scales.y,
              position: 'left',
              title: {
                display: true,
                text: 'RPM',
                color: '#00ff88',
                font: { family: "'Rajdhani', sans-serif", size: 12, weight: '600' },
              },
              min: 0,
              max: 3000,
            },
            y1: {
              ...commonOptions.scales.y,
              position: 'right',
              title: {
                display: true,
                text: 'mm/s',
                color: '#ff9f43',
                font: { family: "'Rajdhani', sans-serif", size: 12, weight: '600' },
              },
              min: 0,
              max: 20,
              grid: {
                drawOnChartArea: false,
              },
            },
          },
        },
      });
    }
  }
  function update(sensorData) {
    const now = timeLabel(new Date());
    if (tempPressureChart) {
      tempPressureChart.data.labels.push(now);
      tempPressureChart.data.datasets[0].data.push(sensorData.temperature.value);
      tempPressureChart.data.datasets[1].data.push(sensorData.pressure.value);
      if (tempPressureChart.data.labels.length > MAX_POINTS) {
        tempPressureChart.data.labels.shift();
        tempPressureChart.data.datasets[0].data.shift();
        tempPressureChart.data.datasets[1].data.shift();
      }
      tempPressureChart.update('none');
    }
    if (speedVibrationChart) {
      speedVibrationChart.data.labels.push(now);
      speedVibrationChart.data.datasets[0].data.push(sensorData.speed.value);
      speedVibrationChart.data.datasets[1].data.push(sensorData.vibration.value);
      if (speedVibrationChart.data.labels.length > MAX_POINTS) {
        speedVibrationChart.data.labels.shift();
        speedVibrationChart.data.datasets[0].data.shift();
        speedVibrationChart.data.datasets[1].data.shift();
      }
      speedVibrationChart.update('none');
    }
  }
  return {
    init,
    update,
  };
})();
