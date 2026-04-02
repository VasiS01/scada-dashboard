const OEEManager = (() => {
  let availability = 92;
  let performance = 88;
  let quality = 96;
  const SVG_CIRCUMFERENCE = 2 * Math.PI * 42; 
  function init() {
    updateDisplay();
  }
  function update(sensorData) {
    const tempStatus = sensorData.temperature?.status || 'normal';
    const speedStatus = sensorData.speed?.status || 'normal';
    const vibStatus = sensorData.vibration?.status || 'normal';
    if (tempStatus === 'critical' || vibStatus === 'critical') {
      availability = Math.max(60, availability - (Math.random() * 2));
    } else if (tempStatus === 'warning') {
      availability = Math.max(70, availability - (Math.random() * 0.5));
    } else {
      availability = Math.min(98, availability + (Math.random() * 0.8));
    }
    const speedVal = sensorData.speed?.value || 1200;
    const speedRatio = speedVal / 1500; 
    performance = Math.max(50, Math.min(99, performance + (speedRatio - 0.9) * 3 + (Math.random() - 0.5) * 2));
    if (vibStatus === 'critical') {
      quality = Math.max(75, quality - (Math.random() * 1.5));
    } else if (vibStatus === 'warning') {
      quality = Math.max(85, quality - (Math.random() * 0.5));
    } else {
      quality = Math.min(99, quality + (Math.random() * 0.4));
    }
    updateDisplay();
  }
  function updateDisplay() {
    const oee = (availability * performance * quality) / 10000;
    updateCircle('oee-availability', availability, getColor(availability));
    updateCircle('oee-performance', performance, getColor(performance));
    updateCircle('oee-quality', quality, getColor(quality));
    const totalEl = document.getElementById('oee-total-value');
    if (totalEl) {
      totalEl.textContent = oee.toFixed(1) + '%';
      totalEl.style.color = getColor(oee);
    }
  }
  function updateCircle(id, value, color) {
    const progress = document.getElementById(id + '-progress');
    const valueEl = document.getElementById(id + '-value');
    if (progress) {
      const offset = SVG_CIRCUMFERENCE - (value / 100) * SVG_CIRCUMFERENCE;
      progress.style.strokeDasharray = SVG_CIRCUMFERENCE;
      progress.style.strokeDashoffset = offset;
      progress.style.stroke = color;
    }
    if (valueEl) {
      valueEl.textContent = value.toFixed(1) + '%';
    }
  }
  function getColor(value) {
    if (value >= 85) return '#00ff88';
    if (value >= 70) return '#ff9f43';
    return '#ff4757';
  }
  return { init, update };
})();
