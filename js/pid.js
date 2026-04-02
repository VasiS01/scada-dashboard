const PIDController = (() => {
  const controllers = {
    temperature: {
      name: 'Sıcaklık',
      unit: '°C',
      setpoint: 65,
      Kp: 2.0,
      Ki: 0.5,
      Kd: 1.0,
      integral: 0,
      prevError: 0,
      output: 0,
      outputMin: 0,
      outputMax: 100,
      enabled: true,
      history: []
    }
  };

  const MAX_HISTORY = 30;

  function init() {
    renderPanel();
    bindEvents();
  }

  function compute(key, processValue, dt) {
    const ctrl = controllers[key];
    if (!ctrl || !ctrl.enabled) return null;

    dt = dt || 1;

    const error = ctrl.setpoint - processValue;

    const P = ctrl.Kp * error;

    ctrl.integral += error * dt;
    const integralLimit = 50;
    ctrl.integral = Math.max(-integralLimit, Math.min(integralLimit, ctrl.integral));
    const I = ctrl.Ki * ctrl.integral;

    const D = ctrl.Kd * ((error - ctrl.prevError) / dt);
    ctrl.prevError = error;

    let output = P + I + D;
    output = Math.max(ctrl.outputMin, Math.min(ctrl.outputMax, output));
    ctrl.output = output;

    ctrl.history.push({
      time: new Date(),
      setpoint: ctrl.setpoint,
      processValue: processValue,
      error: error,
      output: output,
      P: P,
      I: I,
      D: D
    });

    if (ctrl.history.length > MAX_HISTORY) {
      ctrl.history.shift();
    }

    updateDisplay(key);
    return output;
  }

  function updateDisplay(key) {
    const ctrl = controllers[key];
    if (!ctrl) return;

    const spEl = document.getElementById('pid-setpoint-display');
    const pvEl = document.getElementById('pid-pv-display');
    const errEl = document.getElementById('pid-error-display');
    const outEl = document.getElementById('pid-output-display');
    const outBar = document.getElementById('pid-output-bar');

    const pEl = document.getElementById('pid-p-term');
    const iEl = document.getElementById('pid-i-term');
    const dEl = document.getElementById('pid-d-term');

    const last = ctrl.history[ctrl.history.length - 1];
    if (!last) return;

    if (spEl) spEl.textContent = ctrl.setpoint.toFixed(1) + ' ' + ctrl.unit;
    if (pvEl) pvEl.textContent = last.processValue.toFixed(1) + ' ' + ctrl.unit;
    if (errEl) {
      errEl.textContent = last.error.toFixed(2) + ' ' + ctrl.unit;
      errEl.style.color = Math.abs(last.error) > 10 ? '#ff4757' : Math.abs(last.error) > 5 ? '#ff9f43' : '#00ff88';
    }
    if (outEl) {
      outEl.textContent = last.output.toFixed(1) + '%';
      outEl.style.color = last.output > 80 ? '#ff4757' : last.output > 50 ? '#ff9f43' : '#00d4ff';
    }
    if (outBar) {
      outBar.style.width = last.output + '%';
      outBar.style.background = last.output > 80 ? '#ff4757' : last.output > 50 ? '#ff9f43' : '#00d4ff';
    }

    if (pEl) pEl.textContent = last.P.toFixed(2);
    if (iEl) iEl.textContent = last.I.toFixed(2);
    if (dEl) dEl.textContent = last.D.toFixed(2);

    const statusEl = document.getElementById('pid-status');
    if (statusEl) {
      if (Math.abs(last.error) < 3) {
        statusEl.textContent = 'KARARLI';
        statusEl.className = 'pid-status stable';
      } else if (Math.abs(last.error) < 10) {
        statusEl.textContent = 'YAKLAŞIYOR';
        statusEl.className = 'pid-status approaching';
      } else {
        statusEl.textContent = 'SAPMA';
        statusEl.className = 'pid-status deviation';
      }
    }
  }

  function renderPanel() {
    const ctrl = controllers.temperature;
    const container = document.getElementById('pid-params');
    if (!container) return;

    container.innerHTML =
      '<div class="pid-param-row">' +
        '<label>Kp (Oransal):</label>' +
        '<input type="number" id="pid-kp" class="setting-input" value="' + ctrl.Kp + '" step="0.1" min="0">' +
      '</div>' +
      '<div class="pid-param-row">' +
        '<label>Ki (İntegral):</label>' +
        '<input type="number" id="pid-ki" class="setting-input" value="' + ctrl.Ki + '" step="0.1" min="0">' +
      '</div>' +
      '<div class="pid-param-row">' +
        '<label>Kd (Türevsel):</label>' +
        '<input type="number" id="pid-kd" class="setting-input" value="' + ctrl.Kd + '" step="0.1" min="0">' +
      '</div>' +
      '<div class="pid-param-row">' +
        '<label>Set Point:</label>' +
        '<input type="number" id="pid-sp" class="setting-input" value="' + ctrl.setpoint + '" step="1" min="0" max="150">' +
        '<span class="pid-unit">' + ctrl.unit + '</span>' +
      '</div>';
  }

  function bindEvents() {
    document.addEventListener('change', function(e) {
      const ctrl = controllers.temperature;
      if (e.target.id === 'pid-kp') ctrl.Kp = parseFloat(e.target.value) || 0;
      if (e.target.id === 'pid-ki') ctrl.Ki = parseFloat(e.target.value) || 0;
      if (e.target.id === 'pid-kd') ctrl.Kd = parseFloat(e.target.value) || 0;
      if (e.target.id === 'pid-sp') ctrl.setpoint = parseFloat(e.target.value) || 0;
    });
  }

  function getController(key) {
    return controllers[key] || null;
  }

  function getHistory(key) {
    const ctrl = controllers[key];
    return ctrl ? ctrl.history : [];
  }

  return { init, compute, getController, getHistory };
})();
