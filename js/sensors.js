const SensorSimulator = (() => {
  const sensorConfigs = {
    temperature: {
      id: 'temperature',
      name: 'Sıcaklık',
      unit: '°C',
      icon: '🌡️',
      color: '#ff6b6b',
      min: 0,
      max: 150,
      normalMin: 40,
      normalMax: 90,
      warningMin: 25,
      warningMax: 105,
      criticalMin: 10,
      criticalMax: 130,
      baseValue: 65,
      noiseLevel: 1.5,
      driftSpeed: 0.3,
    },
    pressure: {
      id: 'pressure',
      name: 'Basınç',
      unit: 'bar',
      icon: '🔵',
      color: '#00d4ff',
      min: 0,
      max: 10,
      normalMin: 3,
      normalMax: 7,
      warningMin: 1.5,
      warningMax: 8.5,
      criticalMin: 0.5,
      criticalMax: 9.5,
      baseValue: 5,
      noiseLevel: 0.15,
      driftSpeed: 0.06,
    },
    speed: {
      id: 'speed',
      name: 'Hız',
      unit: 'RPM',
      icon: '⚡',
      color: '#00ff88',
      min: 0,
      max: 3000,
      normalMin: 800,
      normalMax: 1800,
      warningMin: 400,
      warningMax: 2300,
      criticalMin: 150,
      criticalMax: 2850,
      baseValue: 1200,
      noiseLevel: 25,
      driftSpeed: 10,
    },
    vibration: {
      id: 'vibration',
      name: 'Titreşim',
      unit: 'mm/s',
      icon: '📳',
      color: '#ff9f43',
      min: 0,
      max: 20,
      normalMin: 0,
      normalMax: 5,
      warningMin: 0,
      warningMax: 8,
      criticalMin: 0,
      criticalMax: 12,
      baseValue: 2.5,
      noiseLevel: 0.25,
      driftSpeed: 0.1,
    },
  };

  const sensorStates = {};
  let paused = false;

  function init() {
    Object.keys(sensorConfigs).forEach((key) => {
      const config = sensorConfigs[key];
      sensorStates[key] = {
        currentValue: config.baseValue,
        trend: 0,
        history: [],
        status: 'normal',
        stats: { min: Infinity, max: -Infinity, sum: 0, count: 0, sumSq: 0 }
      };
    });
  }

  function gaussianRandom(mean, stdev) {
    mean = mean || 0;
    stdev = stdev || 1;
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
  }

  function setPaused(val) {
    paused = val;
  }

  function isPaused() {
    return paused;
  }

  function update() {
    const results = {};
    Object.keys(sensorConfigs).forEach((key) => {
      const config = sensorConfigs[key];
      const state = sensorStates[key];

      if (!paused) {
        state.trend += gaussianRandom(0, config.driftSpeed * 0.2);
        state.trend = Math.max(-config.driftSpeed * 1.5, Math.min(config.driftSpeed * 1.5, state.trend));
        const noise = gaussianRandom(0, config.noiseLevel);
        let newValue = state.currentValue + state.trend + noise;
        const pullForce = (config.baseValue - newValue) * 0.05;
        newValue += pullForce;

        if (Math.random() < 0.005) {
          const spike = gaussianRandom(0, config.noiseLevel * 3);
          newValue += spike;
        }

        newValue = Math.max(config.min, Math.min(config.max, newValue));
        state.currentValue = newValue;
        updateStats(key, newValue);
      }

      let status = 'normal';
      const val = state.currentValue;
      if (val < config.criticalMin || val > config.criticalMax) {
        status = 'critical';
      } else if (val < config.warningMin || val > config.warningMax) {
        status = 'warning';
      }

      state.history.push({
        value: state.currentValue,
        time: new Date(),
        status: status,
      });

      if (state.history.length > 60) {
        state.history.shift();
      }

      const previousStatus = state.status;
      state.status = status;

      results[key] = {
        config: config,
        value: state.currentValue,
        displayValue: formatValue(state.currentValue, key),
        status: status,
        previousStatus: previousStatus,
        statusChanged: previousStatus !== status,
        percentage: ((state.currentValue - config.min) / (config.max - config.min)) * 100,
        history: state.history,
      };
    });
    return results;
  }

  function formatValue(value, sensorKey) {
    switch (sensorKey) {
      case 'temperature':
        return value.toFixed(1);
      case 'pressure':
        return value.toFixed(2);
      case 'speed':
        return Math.round(value).toString();
      case 'vibration':
        return value.toFixed(2);
      default:
        return value.toFixed(1);
    }
  }

  function updateStats(key, value) {
    const s = sensorStates[key].stats;
    s.count++;
    s.sum += value;
    s.sumSq += value * value;
    if (value < s.min) s.min = value;
    if (value > s.max) s.max = value;
  }

  function getStatistics(key) {
    const s = sensorStates[key]?.stats;
    if (!s || s.count === 0) return { min: 0, max: 0, mean: 0, stddev: 0, count: 0 };
    const mean = s.sum / s.count;
    const variance = (s.sumSq / s.count) - (mean * mean);
    const stddev = Math.sqrt(Math.max(0, variance));
    return {
      min: s.min,
      max: s.max,
      mean: mean,
      stddev: stddev,
      count: s.count,
      ucl: mean + 3 * stddev,
      lcl: mean - 3 * stddev
    };
  }

  function updateThresholds(sensorKey, thresholds) {
    const config = sensorConfigs[sensorKey];
    if (!config) return;
    if (thresholds.warningMin !== undefined) config.warningMin = parseFloat(thresholds.warningMin);
    if (thresholds.warningMax !== undefined) config.warningMax = parseFloat(thresholds.warningMax);
    if (thresholds.criticalMin !== undefined) config.criticalMin = parseFloat(thresholds.criticalMin);
    if (thresholds.criticalMax !== undefined) config.criticalMax = parseFloat(thresholds.criticalMax);
  }

  function getSensor(key) {
    const config = sensorConfigs[key];
    const state = sensorStates[key];
    return {
      config,
      value: state.currentValue,
      displayValue: formatValue(state.currentValue, key),
      status: state.status,
      percentage: ((state.currentValue - config.min) / (config.max - config.min)) * 100,
      history: state.history,
    };
  }

  function getConfigs() {
    return { ...sensorConfigs };
  }

  return {
    init,
    update,
    getSensor,
    getConfigs,
    getStatistics,
    updateThresholds,
    setPaused,
    isPaused,
  };
})();
