const EnergyMonitor = (() => {
  let currentPower = 0;
  let totalEnergy = 0;
  let peakPower = 0;
  let tickCount = 0;
  let powerHistory = [];
  const MAX_HISTORY = 30;
  const COST_PER_KWH = 2.85;
  const TICK_HOURS = 2 / 3600;

  function init() {
    updateDisplay();
  }

  function update(sensorData) {
    tickCount++;

    const speedVal = sensorData.speed?.value || 0;
    const tempVal = sensorData.temperature?.value || 0;
    const pressVal = sensorData.pressure?.value || 0;

    const motorPower = (speedVal / 3000) * 45;
    const heaterPower = Math.max(0, (tempVal - 20) / 130) * 25;
    const pumpPower = (pressVal / 10) * 15;
    const basePower = 8;
    const noise = (Math.random() - 0.5) * 3;

    currentPower = Math.max(0, motorPower + heaterPower + pumpPower + basePower + noise);
    currentPower = parseFloat(currentPower.toFixed(2));

    if (currentPower > peakPower) {
      peakPower = currentPower;
    }

    totalEnergy += currentPower * TICK_HOURS;
    totalEnergy = parseFloat(totalEnergy.toFixed(4));

    powerHistory.push(currentPower);
    if (powerHistory.length > MAX_HISTORY) {
      powerHistory.shift();
    }

    updateDisplay();
  }

  function updateDisplay() {
    const powerEl = document.getElementById('energy-power');
    const energyEl = document.getElementById('energy-total');
    const costEl = document.getElementById('energy-cost');
    const peakEl = document.getElementById('energy-peak');
    const effEl = document.getElementById('energy-efficiency');
    const barEl = document.getElementById('energy-power-bar');
    const sparkEl = document.getElementById('energy-spark');

    if (powerEl) powerEl.textContent = currentPower.toFixed(1);
    if (energyEl) energyEl.textContent = totalEnergy.toFixed(2);
    if (costEl) costEl.textContent = (totalEnergy * COST_PER_KWH).toFixed(2);
    if (peakEl) peakEl.textContent = peakPower.toFixed(1);

    const maxCapacity = 93;
    const efficiency = maxCapacity > 0 ? Math.min(100, (1 - (currentPower / maxCapacity)) * 100) : 0;
    if (effEl) {
      effEl.textContent = efficiency.toFixed(0) + '%';
      effEl.style.color = efficiency > 60 ? '#00ff88' : efficiency > 40 ? '#ff9f43' : '#ff4757';
    }

    if (barEl) {
      const pct = Math.min(100, (currentPower / maxCapacity) * 100);
      barEl.style.width = pct + '%';
      barEl.style.background = pct > 80 ? '#ff4757' : pct > 60 ? '#ff9f43' : '#00d4ff';
    }

    if (sparkEl && powerHistory.length > 1) {
      renderSparkline(sparkEl, powerHistory);
    }
  }

  function renderSparkline(container, data) {
    const w = container.offsetWidth || 200;
    const h = container.offsetHeight || 40;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    let points = '';
    let lastX = 0;
    let lastY = 0;
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((val - min) / range) * (h - 6) - 3;
      points += x.toFixed(1) + ',' + y.toFixed(1) + ' ';
      lastX = x;
      lastY = y;
    });

    const avgPower = data.reduce((a, b) => a + b, 0) / data.length;
    const strokeColor = avgPower > 70 ? '#ff4757' : avgPower > 50 ? '#ff9f43' : '#00d4ff';
    const gradStart = avgPower > 70 ? 'rgba(255,71,87,0.35)' : avgPower > 50 ? 'rgba(255,159,67,0.3)' : 'rgba(0,212,255,0.3)';
    const gradEnd = avgPower > 70 ? 'rgba(255,71,87,0)' : avgPower > 50 ? 'rgba(255,159,67,0)' : 'rgba(0,212,255,0)';

    container.innerHTML = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<defs>' +
      '<linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + gradStart + '"/>' +
      '<stop offset="100%" stop-color="' + gradEnd + '"/>' +
      '</linearGradient>' +
      '<filter id="sparkGlow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>' +
      '<polygon points="0,' + h + ' ' + points.trim() + ' ' + w + ',' + h + '" fill="url(#sparkGrad)"/>' +
      '<polyline points="' + points.trim() + '" fill="none" stroke="' + strokeColor + '" stroke-width="1.5" stroke-linejoin="round" filter="url(#sparkGlow)"/>' +
      '<circle cx="' + lastX.toFixed(1) + '" cy="' + lastY.toFixed(1) + '" r="3" fill="' + strokeColor + '" opacity="0.9">' +
      '<animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite"/>' +
      '<animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.5s" repeatCount="indefinite"/>' +
      '</circle>' +
      '</svg>';
  }

  function getData() {
    return {
      currentPower: currentPower,
      totalEnergy: totalEnergy,
      peakPower: peakPower,
      estimatedCost: parseFloat((totalEnergy * COST_PER_KWH).toFixed(2)),
      efficiency: parseFloat((Math.min(100, (1 - (currentPower / 93)) * 100)).toFixed(1)),
      powerHistory: [...powerHistory]
    };
  }

  return { init, update, getData };
})();
