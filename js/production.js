const ProductionManager = (() => {
  let totalParts = 0;
  let defectiveParts = 0;
  let cycleAccumulator = 0;
  const CYCLE_THRESHOLD = 5;

  function init() {
    updateDisplay();
  }

  function update(sensorData) {
    const speedVal = sensorData.speed?.value || 0;
    const speedRatio = speedVal / 1500;
    cycleAccumulator += speedRatio * 0.4;

    if (cycleAccumulator >= CYCLE_THRESHOLD) {
      const partsProduced = Math.floor(cycleAccumulator / CYCLE_THRESHOLD);
      totalParts += partsProduced;
      cycleAccumulator = cycleAccumulator % CYCLE_THRESHOLD;

      const vibStatus = sensorData.vibration?.status || 'normal';
      const tempStatus = sensorData.temperature?.status || 'normal';

      let defectChance = 0.02;
      if (vibStatus === 'warning' || tempStatus === 'warning') defectChance = 0.08;
      if (vibStatus === 'critical' || tempStatus === 'critical') defectChance = 0.2;

      for (let i = 0; i < partsProduced; i++) {
        if (Math.random() < defectChance) defectiveParts++;
      }
    }

    updateDisplay();
  }

  function updateDisplay() {
    const goodParts = totalParts - defectiveParts;
    const wasteRate = totalParts > 0 ? ((defectiveParts / totalParts) * 100) : 0;

    const totalEl = document.getElementById('prod-total');
    const goodEl = document.getElementById('prod-good');
    const defectEl = document.getElementById('prod-defect');
    const wasteEl = document.getElementById('prod-waste');

    if (totalEl) totalEl.textContent = totalParts.toLocaleString('tr-TR');
    if (goodEl) goodEl.textContent = goodParts.toLocaleString('tr-TR');
    if (defectEl) defectEl.textContent = defectiveParts.toLocaleString('tr-TR');
    if (wasteEl) {
      wasteEl.textContent = wasteRate.toFixed(1) + '%';
      wasteEl.style.color = wasteRate > 5 ? '#ff4757' : wasteRate > 2 ? '#ff9f43' : '#00ff88';
    }
  }

  function getData() {
    return {
      total: totalParts,
      good: totalParts - defectiveParts,
      defective: defectiveParts,
      wasteRate: totalParts > 0 ? ((defectiveParts / totalParts) * 100) : 0
    };
  }

  return { init, update, getData };
})();
