# Kelime Avı 🦉

Ortaokul öğrencileri için İngilizce ⇄ Türkçe kelime kartı oyunu (Astro, tamamen statik).

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # statik çıktı dist/ klasörüne
npm run preview  # build çıktısını yerelde dene
```

## Nasıl oynanır

1. Hazır seviyelerden birini (Kolay / Orta / Zor — her biri 100 kelime) seç **ya da** kendi Excel dosyanı yükle.
2. Kaç kelime soracağını seç (10 / 20 / 50 / Hepsi) ve oyunu başlat.
3. Kelimeler rastgele sırayla ve rastgele dilde (İngilizce ya da Türkçe) gelir.
   - **Cevabı Göster**: kart döner, karşılığı görünür (karta tıklamak da olur).
   - **Bildim / Bilemedim**: sonucu işaretler (tekrar tıklarsan işaret kalkar).
   - **Sonraki Kelime**: bir sonraki karta geçer. İşaretlenmeden geçilen kelime "İşaretsiz" sayılır.
   - **Oyunu Bitir**: istediğin an sonuç ekranına gider.
4. Sonuç ekranında başarı yüzdesi, bildiğin / bilemediğin kelime listeleri ve
   "Bilemediklerimi Tekrar Çalış" seçeneği vardır.

Klavye: `Boşluk` cevap · `1` bildim · `2` bilemedim · `Enter` sonraki

## Excel formatı

| A (İngilizce) | B (Türkçe) |
|---------------|------------|
| apple         | elma       |
| book          | kitap      |

- İlk sayfa okunur. İlk satır "İngilizce / Türkçe" gibi bir başlıksa otomatik atlanır.
- Boş satırlar ve tekrar eden kelimeler yok sayılır. `.xlsx`, `.xls` ve `.csv` desteklenir.

## Hazır kelime listelerini değiştirmek

`public/words/kolay.xlsx`, `orta.xlsx`, `zor.xlsx` dosyalarını Excel'de açıp düzenlemen yeterli;
kod değişikliği gerekmez.
