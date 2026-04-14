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
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((val - min) / range) * (h - 4) - 2;
      points += x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    });

    container.innerHTML = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<defs><linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="rgba(0,212,255,0.3)"/>' +
      '<stop offset="100%" stop-color="rgba(0,212,255,0)"/>' +
      '</linearGradient></defs>' +
      '<polyline points="' + points.trim() + '" fill="none" stroke="#00d4ff" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<polygon points="0,' + h + ' ' + points.trim() + ' ' + w + ',' + h + '" fill="url(#sparkGrad)"/>' +
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
