const PDFReport = (() => {
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 15;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const COLORS = {
    primary: [0, 212, 255],
    dark: [15, 23, 42],
    darkCard: [30, 41, 59],
    text: [226, 232, 240],
    textDim: [148, 163, 184],
    green: [0, 255, 136],
    red: [255, 71, 87],
    orange: [255, 159, 67],
    purple: [168, 85, 247],
    white: [255, 255, 255]
  };

  function generate() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const now = new Date();

    drawCoverPage(doc, now);
    drawSensorPage(doc, now);
    drawProductionOEEPage(doc, now);
    drawAlarmPage(doc, now);
    drawInterlockPage(doc, now);

    addPageNumbers(doc);

    doc.save('SCADA_Rapor_' + now.toISOString().slice(0, 10) + '.pdf');
  }

  function setBackground(doc) {
    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  }

  function drawCoverPage(doc, now) {
    setBackground(doc);

    doc.setFillColor(0, 212, 255, 0.08);
    doc.rect(0, 0, PAGE_W, 120, 'F');

    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, 118, PAGE_W - MARGIN, 118);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(...COLORS.primary);
    doc.text('SCADA', PAGE_W / 2, 55, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(...COLORS.textDim);
    doc.text('Üretim Hattı İzleme ve Kontrol Sistemi', PAGE_W / 2, 68, { align: 'center' });

    doc.setFontSize(22);
    doc.setTextColor(...COLORS.white);
    doc.text('Operasyon Raporu', PAGE_W / 2, 95, { align: 'center' });

    const dateStr = now.toLocaleDateString('tr-TR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('tr-TR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    doc.setFontSize(12);
    doc.setTextColor(...COLORS.textDim);
    doc.text(dateStr, PAGE_W / 2, 108, { align: 'center' });
    doc.text(timeStr, PAGE_W / 2, 115, { align: 'center' });

    const hour = now.getHours();
    let shift;
    if (hour >= 6 && hour < 14) shift = 'Sabah Vardiyası (06:00 - 14:00)';
    else if (hour >= 14 && hour < 22) shift = 'Akşam Vardiyası (14:00 - 22:00)';
    else shift = 'Gece Vardiyası (22:00 - 06:00)';

    drawInfoBox(doc, MARGIN, 135, CONTENT_W, 50, [
      { label: 'Rapor Tarihi', value: dateStr },
      { label: 'Rapor Saati', value: timeStr },
      { label: 'Aktif Vardiya', value: shift },
      { label: 'Sistem Durumu', value: SensorSimulator.isPaused() ? 'DURDURULDU' : 'ÇALIŞIYOR' }
    ]);

    doc.setFillColor(...COLORS.darkCard);
    doc.roundedRect(MARGIN, 200, CONTENT_W, 60, 3, 3, 'F');
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.2);
    doc.roundedRect(MARGIN, 200, CONTENT_W, 60, 3, 3, 'S');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('Rapor İçeriği', MARGIN + 8, 212);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.textDim);
    const items = [
      '1. Sensör Verileri ve İstatistiksel Proses Kontrol (SPC)',
      '2. Üretim Verileri ve OEE Metrikleri',
      '3. Alarm Geçmişi ve Analiz',
      '4. Güvenlik Interlock Durumu'
    ];
    items.forEach((item, i) => {
      doc.text(item, MARGIN + 8, 222 + (i * 8));
    });
  }

  function drawInfoBox(doc, x, y, w, h, items) {
    doc.setFillColor(...COLORS.darkCard);
    doc.roundedRect(x, y, w, h, 3, 3, 'F');
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, w, h, 3, 3, 'S');

    const colW = w / 2;
    items.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const px = x + 8 + col * colW;
      const py = y + 14 + row * 18;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textDim);
      doc.text(item.label, px, py);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.white);
      doc.text(item.value, px, py + 7);
    });
  }

  function drawSectionHeader(doc, y, title) {
    doc.setFillColor(...COLORS.primary);
    doc.rect(MARGIN, y, 3, 10, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(title, MARGIN + 8, y + 8);

    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y + 13, PAGE_W - MARGIN, y + 13);

    return y + 18;
  }

  function drawSensorPage(doc) {
    doc.addPage();
    setBackground(doc);

    let y = drawSectionHeader(doc, 15, 'Sensör Verileri ve SPC Analizi');

    const sensors = ['temperature', 'pressure', 'speed', 'vibration'];
    const sensorNames = {
      temperature: 'Sıcaklık', pressure: 'Basınç',
      speed: 'Hız', vibration: 'Titreşim'
    };
    const sensorUnits = {
      temperature: '°C', pressure: 'bar',
      speed: 'RPM', vibration: 'mm/s'
    };
    const sensorColors = {
      temperature: COLORS.red, pressure: COLORS.primary,
      speed: COLORS.green, vibration: COLORS.orange
    };

    sensors.forEach((key, idx) => {
      const stats = SensorSimulator.getStatistics(key);
      const sensor = SensorSimulator.getSensor(key);
      const config = SensorSimulator.getConfigs()[key];

      const boxY = y + idx * 40;
      doc.setFillColor(...COLORS.darkCard);
      doc.roundedRect(MARGIN, boxY, CONTENT_W, 36, 3, 3, 'F');

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...sensorColors[key]);
      doc.text(sensorNames[key] + ' (' + sensorUnits[key] + ')', MARGIN + 6, boxY + 10);

      doc.setFontSize(18);
      doc.setTextColor(...COLORS.white);
      doc.text(sensor.displayValue + ' ' + sensorUnits[key], MARGIN + 6, boxY + 25);

      let statusLabel = 'NORMAL';
      let statusColor = COLORS.green;
      if (sensor.status === 'warning') { statusLabel = 'UYARI'; statusColor = COLORS.orange; }
      if (sensor.status === 'critical') { statusLabel = 'KRİTİK'; statusColor = COLORS.red; }

      doc.setFillColor(...statusColor);
      doc.roundedRect(MARGIN + 80, boxY + 17, 28, 8, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.dark);
      doc.text(statusLabel, MARGIN + 94, boxY + 23, { align: 'center' });

      const statsX = MARGIN + 120;
      const statItems = [
        { label: 'Min', value: stats.count > 0 ? stats.min.toFixed(1) : '--' },
        { label: 'Max', value: stats.count > 0 ? stats.max.toFixed(1) : '--' },
        { label: 'Ort', value: stats.count > 0 ? stats.mean.toFixed(1) : '--' },
        { label: 'Std', value: stats.count > 0 ? stats.stddev.toFixed(2) : '--' }
      ];

      statItems.forEach((s, si) => {
        const sx = statsX + si * 16;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textDim);
        doc.text(s.label, sx, boxY + 10);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.white);
        doc.text(s.value, sx, boxY + 17);
      });

      const limX = statsX;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textDim);
      doc.text('Normal: ' + config.normalMin + '-' + config.normalMax, limX, boxY + 28);
      doc.text('Uyarı: ' + config.warningMin + '-' + config.warningMax, limX + 35, boxY + 28);
      doc.text('Kritik: ' + config.criticalMin + '-' + config.criticalMax, limX + 35 + 35, boxY + 28);
    });

    y = y + 4 * 40 + 10;
    y = drawSectionHeader(doc, y, 'SPC Özet Tablosu');

    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Sensör', 'Min', 'Max', 'X̄ (Ort)', 'σ (Std)', 'UCL', 'LCL', 'N']],
      body: sensors.map(key => {
        const stats = SensorSimulator.getStatistics(key);
        const name = sensorNames[key] + ' (' + sensorUnits[key] + ')';
        if (stats.count === 0) return [name, '--', '--', '--', '--', '--', '--', '0'];
        return [
          name,
          stats.min.toFixed(2),
          stats.max.toFixed(2),
          stats.mean.toFixed(2),
          stats.stddev.toFixed(2),
          stats.ucl.toFixed(2),
          Math.max(0, stats.lcl).toFixed(2),
          stats.count.toString()
        ];
      }),
      theme: 'plain',
      styles: {
        fillColor: [30, 41, 59],
        textColor: [226, 232, 240],
        fontSize: 9,
        cellPadding: 4,
        lineColor: [51, 65, 85],
        lineWidth: 0.2,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [0, 212, 255],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [22, 33, 50]
      }
    });
  }

  function drawProductionOEEPage(doc) {
    doc.addPage();
    setBackground(doc);

    let y = drawSectionHeader(doc, 15, 'Üretim Verileri');

    const prod = ProductionManager.getData();

    doc.setFillColor(...COLORS.darkCard);
    doc.roundedRect(MARGIN, y, CONTENT_W, 45, 3, 3, 'F');

    const prodItems = [
      { label: 'Toplam Üretim', value: prod.total.toLocaleString('tr-TR'), color: COLORS.primary },
      { label: 'Sağlam Parça', value: prod.good.toLocaleString('tr-TR'), color: COLORS.green },
      { label: 'Hatalı Parça', value: prod.defective.toLocaleString('tr-TR'), color: COLORS.red },
      { label: 'Fire Oranı', value: prod.wasteRate.toFixed(1) + '%', color: prod.wasteRate > 5 ? COLORS.red : prod.wasteRate > 2 ? COLORS.orange : COLORS.green }
    ];

    const colW = CONTENT_W / 4;
    prodItems.forEach((item, i) => {
      const px = MARGIN + 8 + i * colW;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textDim);
      doc.text(item.label, px, y + 12);

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...item.color);
      doc.text(item.value, px, y + 28);
    });

    y += 60;
    y = drawSectionHeader(doc, y, 'OEE — Genel Ekipman Verimliliği');

    const oeeData = OEEManager.getData();

    doc.setFillColor(...COLORS.darkCard);
    doc.roundedRect(MARGIN, y, CONTENT_W, 70, 3, 3, 'F');

    const oeeItems = [
      { label: 'Kullanılabilirlik', value: oeeData.availability.toFixed(1) + '%', color: getOEEColor(oeeData.availability) },
      { label: 'Performans', value: oeeData.performance.toFixed(1) + '%', color: getOEEColor(oeeData.performance) },
      { label: 'Kalite', value: oeeData.quality.toFixed(1) + '%', color: getOEEColor(oeeData.quality) }
    ];

    const oeeColW = CONTENT_W / 3;
    oeeItems.forEach((item, i) => {
      const px = MARGIN + 8 + i * oeeColW;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textDim);
      doc.text(item.label, px, y + 14);

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...item.color);
      doc.text(item.value, px, y + 32);

      const barW = oeeColW - 16;
      const barVal = parseFloat(item.value);
      doc.setFillColor(51, 65, 85);
      doc.roundedRect(px, y + 37, barW, 5, 2, 2, 'F');
      doc.setFillColor(...item.color);
      doc.roundedRect(px, y + 37, barW * (barVal / 100), 5, 2, 2, 'F');
    });

    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.3);
    doc.line(MARGIN + 8, y + 50, PAGE_W - MARGIN - 8, y + 50);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textDim);
    doc.text('Toplam OEE', MARGIN + 8, y + 60);

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...getOEEColor(oeeData.oee));
    doc.text(oeeData.oee.toFixed(1) + '%', MARGIN + 60, y + 62);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textDim);
    doc.text('Hedef: >= 85%', MARGIN + 100, y + 62);

    const oeeStatus = oeeData.oee >= 85 ? 'HEDEF ÜSTÜNDE' : oeeData.oee >= 70 ? 'GELİŞTİRİLMELİ' : 'KRİTİK';
    const oeeStatusColor = oeeData.oee >= 85 ? COLORS.green : oeeData.oee >= 70 ? COLORS.orange : COLORS.red;

    doc.setFillColor(...oeeStatusColor);
    doc.roundedRect(PAGE_W - MARGIN - 45, y + 54, 40, 10, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(oeeStatus, PAGE_W - MARGIN - 25, y + 61, { align: 'center' });
  }

  function getOEEColor(val) {
    if (val >= 85) return COLORS.green;
    if (val >= 70) return COLORS.orange;
    return COLORS.red;
  }

  function drawAlarmPage(doc) {
    doc.addPage();
    setBackground(doc);

    let y = drawSectionHeader(doc, 15, 'Alarm Geçmişi');

    const allAlarms = AlarmManager.getAllAlarms();

    if (allAlarms.length === 0) {
      doc.setFillColor(...COLORS.darkCard);
      doc.roundedRect(MARGIN, y, CONTENT_W, 25, 3, 3, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.green);
      doc.text('Aktif alarm bulunmuyor', PAGE_W / 2, y + 15, { align: 'center' });
      return;
    }

    const criticalCount = allAlarms.filter(a => a.level === 'critical').length;
    const warningCount = allAlarms.filter(a => a.level === 'warning').length;
    const infoCount = allAlarms.filter(a => a.level === 'info').length;

    doc.setFillColor(...COLORS.darkCard);
    doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3, 3, 'F');

    const summaryItems = [
      { label: 'Toplam', value: allAlarms.length.toString(), color: COLORS.white },
      { label: 'Kritik', value: criticalCount.toString(), color: COLORS.red },
      { label: 'Uyarı', value: warningCount.toString(), color: COLORS.orange },
      { label: 'Bilgi', value: infoCount.toString(), color: COLORS.primary }
    ];

    summaryItems.forEach((item, i) => {
      const px = MARGIN + 10 + i * 44;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textDim);
      doc.text(item.label, px, y + 9);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...item.color);
      doc.text(item.value, px, y + 18);
    });

    y += 28;

    const sensorNameMap = {
      temperature: 'Sıcaklık', pressure: 'Basınç',
      speed: 'Hız', vibration: 'Titreşim'
    };

    const tableBody = allAlarms.slice(0, 30).map(a => {
      const d = new Date(a.time);
      const timeStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) + ' ' +
                      d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const levelText = a.level === 'critical' ? 'KRİTİK' : a.level === 'warning' ? 'UYARI' : 'BİLGİ';
      return [timeStr, sensorNameMap[a.sensor] || a.sensor, levelText, a.message, a.acknowledged ? 'Evet' : 'Hayır'];
    });

    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Zaman', 'Sensör', 'Seviye', 'Mesaj', 'Onay']],
      body: tableBody,
      theme: 'plain',
      styles: {
        fillColor: [30, 41, 59],
        textColor: [226, 232, 240],
        fontSize: 8,
        cellPadding: 3,
        lineColor: [51, 65, 85],
        lineWidth: 0.2,
        font: 'helvetica',
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [0, 212, 255],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [22, 33, 50]
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 22 },
        2: { cellWidth: 18 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 15 }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 2) {
          const val = data.cell.raw;
          if (val === 'KRİTİK') data.cell.styles.textColor = [255, 71, 87];
          else if (val === 'UYARI') data.cell.styles.textColor = [255, 159, 67];
          else data.cell.styles.textColor = [0, 212, 255];
        }
      }
    });
  }

  function drawInterlockPage(doc) {
    doc.addPage();
    setBackground(doc);

    let y = drawSectionHeader(doc, 15, 'Güvenlik Interlock Durumu');

    const interlockStatus = InterlockManager.getStatus();

    const tableBody = interlockStatus.map(il => {
      const statusText = il.active ? 'AKTİF' : 'HAZIR';
      const priorityText = il.priority === 'critical' ? 'KRİTİK' : 'UYARI';
      return [il.id, il.name, statusText, priorityText];
    });

    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['ID', 'İsim', 'Durum', 'Öncelik']],
      body: tableBody,
      theme: 'plain',
      styles: {
        fillColor: [30, 41, 59],
        textColor: [226, 232, 240],
        fontSize: 10,
        cellPadding: 5,
        lineColor: [51, 65, 85],
        lineWidth: 0.2,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [0, 212, 255],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: [22, 33, 50]
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 2) {
          if (data.cell.raw === 'AKTİF') data.cell.styles.textColor = [255, 71, 87];
          else data.cell.styles.textColor = [0, 255, 136];
        }
        if (data.section === 'body' && data.column.index === 3) {
          if (data.cell.raw === 'KRİTİK') data.cell.styles.textColor = [255, 71, 87];
          else data.cell.styles.textColor = [255, 159, 67];
        }
      }
    });

    y = doc.lastAutoTable.finalY + 15;

    doc.setFillColor(...COLORS.darkCard);
    doc.roundedRect(MARGIN, y, CONTENT_W, 40, 3, 3, 'F');
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.2);
    doc.roundedRect(MARGIN, y, CONTENT_W, 40, 3, 3, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('Rapor Bilgisi', MARGIN + 8, y + 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textDim);
    doc.text('Bu rapor SCADA Dashboard sistemi tarafından otomatik olarak oluşturulmuştur.', MARGIN + 8, y + 22);
    doc.text('Tüm veriler rapor anındaki anlık değerleri yansıtmaktadır.', MARGIN + 8, y + 30);
    doc.text('Oluşturulma: ' + new Date().toLocaleString('tr-TR'), MARGIN + 8, y + 38);
  }

  function addPageNumbers(doc) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, PAGE_H - 15, PAGE_W - MARGIN, PAGE_H - 15);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textDim);
      doc.text('SCADA Dashboard — Operasyon Raporu', MARGIN, PAGE_H - 8);
      doc.text('Sayfa ' + i + ' / ' + pageCount, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
    }
  }

  return { generate };
})();
