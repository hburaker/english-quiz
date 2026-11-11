# AGENTS.md — Kelime Avı (english-quiz)

Bu dosya, bu projede çalışacak yapay zekâ asistanları ve geliştiriciler için proje bağlamını içerir. Önemli bir değişiklikte **"Değişiklik geçmişi"** bölümünü güncelleyin.

## 1. Proje özeti

- Ortaokul öğrencileri için İngilizce ⇄ Türkçe kelime kartı oyunu. Tamamen statik Astro sitesi, backend yok.
- Hazır seviyeler `public/words/kolay.xlsx`, `orta.xlsx`, `zor.xlsx` (A sütunu İngilizce, B sütunu Türkçe); kullanıcı kendi Excel dosyasını da yükleyebilir (`xlsx` paketi).
- Oyun mantığı `src/scripts/game.ts`, sayfa `src/pages/index.astro`, stiller `src/styles/global.css`.
- Komutlar: `npm install`, `npm run dev`, `npm run build` (çıktı `dist/`), `npm run preview`. Node.js 22+.

## 2. Git ve GitHub

- **Repo:** https://github.com/hburaker/english-quiz (kişisel GitHub hesabı `hburaker`; şirket GitLab'ı DEĞİL). Branch: `main`.
- `origin` adresi kullanıcı adıyla tanımlı: `https://hburaker@github.com/hburaker/english-quiz.git`. Bilgisayarda başka GitHub hesabı kayıtlı olsa bile push `hburaker` hesabıyla yapılır; giriş gerekirse Git Credential Manager tarayıcıdan oturum açtırır.
- Commit kimliği (yalnızca bu repo): `Halit Burak Eroğlu <halitburakeroglu@gmail.com>`. Şirket e-postası bu projede kullanılmaz.
- Yerel `.git/config`: `credential "https://github.com".username = hburaker`, `push.autoSetupRemote = true`, `main` → `origin/main` takipli. Günlük kullanım:
  ```bash
  git add .
  git commit -m "açıklama"
  git push
  ```
- Henüz bir yayın (Cloudflare vb.) bağlı değil.

## 3. Değişiklik geçmişi

- **2026-11-11:** Git deposu oluşturuldu, GitHub (hburaker/english-quiz) bağlantısı, kişisel commit kimliği ve bu dosya eklendi.
