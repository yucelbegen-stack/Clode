# TOROS – Bir Neslin Arabası (59 sn, dikey 1080x1920, 60 fps)

Çizgi film / belgesel tarzı YouTube Shorts videosu.

- `out/toros_music.mp4` – müzik + efekt + altyazı (ana sürüm)
- `out/toros_vo.mp4` – ek olarak Türkçe seslendirmeli sürüm

## Senaryo
| Süre | Sahne |
|---|---|
| 0–5 | HOOK: tekerleksiz, çamurlu Toros – "29 yıl boyunca her sokaktaydı… sonra bir gün YOK OLDU" + başlık |
| 5–11 | 1971 Bursa: fabrikadan ilk Renault 12 sedan çıkıyor |
| 11–18.5 | Sedan ve Station A→B geçiyor, "1989: adı TOROS" |
| 18.5–28.5 | Renk geçidi: beyaz, kırmızı, yeşil, mavi, siyah (Station + Sedan) |
| 28.5–35 | Taksi ve polis (polis sollar, siren) |
| 35–44 | Tekerlek yakın çekimi: lastik + jant kapağı tek parça döner, önden çekiş |
| 44–51 | 2000: üretimin son yılı, "ama hikâyesi bitmedi" |
| 51–59 | GTA tarzı CTA: 7 model numaralı, "numarayı yoruma yaz" |

## Teknik
- Arabalar kullanıcının referans çizimlerinden kesildi (`tools/prep_side.py`, `tools/prep_sedan.py`); fırınlanmış zemin gölgeleri temizlendi, renkler panel bazlı boyandı.
- Tekerlek dönüşü fiziksel: `açı = yuvarlanan mesafe / lastik yarıçapı`; yol çizgileriyle aynı mesafeye bağlı, kayma yok. 60 fps + 360° shutter hareket bulanıklığı (stroboskop etkisi yok).
- Render: `python3 -m http.server 8765` (proje kökünde) → `cd render && node drive.js video out.mp4 0 3540`
- Ses: `python3 tools/audio.py out <tmp>` (müzik, motor sesleri, siren, efektler, espeak-ng mb-tr1 anlatım)
