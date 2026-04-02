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
      normalMax: 85,
      warningMin: 30,
      warningMax: 100,
      criticalMin: 15,
      criticalMax: 120,
      baseValue: 65,
      noiseLevel: 3,
      driftSpeed: 0.5,
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
      warningMin: 2,
      warningMax: 8,
      criticalMin: 1,
      criticalMax: 9.5,
      baseValue: 5,
      noiseLevel: 0.3,
      driftSpeed: 0.1,
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
      warningMin: 500,
      warningMax: 2200,
      criticalMin: 200,
      criticalMax: 2800,
      baseValue: 1200,
      noiseLevel: 50,
      driftSpeed: 20,
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
      normalMax: 4.5,
      warningMin: 0,
      warningMax: 7,
      criticalMin: 0,
      criticalMax: 11,
      baseValue: 2.5,
      noiseLevel: 0.5,
      driftSpeed: 0.2,
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
        state.trend += gaussianRandom(0, config.driftSpeed * 0.3);
        state.trend = Math.max(-config.driftSpeed * 2, Math.min(config.driftSpeed * 2, state.trend));
        const noise = gaussianRandom(0, config.noiseLevel);
        let newValue = state.currentValue + state.trend + noise;
        const pullForce = (config.baseValue - newValue) * 0.02;
        newValue += pullForce;

        if (Math.random() < 0.02) {
          const spike = gaussianRandom(0, config.noiseLevel * 5);
          newValue += spike;
        }

        newValue = Math.max(config.min, Math.min(config.max, newValue));
        state.currentValue = newValue;
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
    updateThresholds,
    setPaused,
    isPaused,
  };
})();
