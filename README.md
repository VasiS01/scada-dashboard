# 🏭 SCADA Dashboard — Üretim Hattı İzleme ve Kontrol Paneli

Web tabanlı, gerçek zamanlı endüstriyel üretim hattı izleme sistemi (SCADA benzeri).

🔗 **[Canlı Demo](https://vasis01.github.io/scada-dashboard/)**

## 🚀 Özellikler

- **Gerçek Zamanlı Sensör İzleme**: Sıcaklık, basınç, hız ve titreşim sensörleri
- **Canlı Trend Grafikleri**: Chart.js ile anlık veri görselleştirme
- **3 Seviyeli Alarm Sistemi**: Bilgi, uyarı ve kritik alarm yönetimi
- **OEE Hesaplama**: Kullanılabilirlik × Performans × Kalite metrikleri
- **Fabrika Yerleşim Haritası**: SVG tabanlı animasyonlu hat görünümü
- **Dark Theme Arayüz**: Endüstriyel SCADA görünümü

## 📦 Kurulum

Herhangi bir kurulum gerekmez. Projeyi klonlayıp `index.html` dosyasını tarayıcınızda açmanız yeterlidir:

```bash
git clone https://github.com/VasiS01/scada-dashboard.git
cd scada-dashboard
# index.html dosyasını tarayıcınızda açın
```

Alternatif olarak Live Server kullanabilirsiniz:
```bash
npx live-server
```

## 🛠️ Teknolojiler

| Teknoloji | Kullanım Amacı |
|-----------|----------------|
| HTML5 | Yapı ve semantik |
| CSS3 | Dark theme, animasyonlar, glassmorphism |
| JavaScript (ES6+) | Simülasyon ve etkileşim |
| Chart.js | Canlı trend grafikleri |
| SVG | Fabrika yerleşim haritası |

## 📁 Proje Yapısı

```
scada-dashboard/
├── index.html          # Ana sayfa
├── css/
│   └── style.css       # Tasarım sistemi
├── js/
│   ├── app.js          # Ana uygulama kontrolcüsü
│   ├── sensors.js      # Sensör simülasyonu
│   ├── charts.js       # Grafik yönetimi
│   ├── alarms.js       # Alarm sistemi
│   └── oee.js          # OEE hesaplama
└── README.md
```

## 📊 Sensör Aralıkları

| Sensör | Normal | Uyarı | Kritik |
|--------|--------|-------|--------|
| Sıcaklık | 40-85°C | 30-100°C | <15 / >120°C |
| Basınç | 3-7 bar | 2-8 bar | <1 / >9.5 bar |
| Hız | 800-1800 RPM | 500-2200 RPM | <200 / >2800 RPM |
| Titreşim | 0-4.5 mm/s | 0-7 mm/s | >11 mm/s |


## 📝 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.
