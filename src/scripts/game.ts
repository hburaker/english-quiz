// Kelime Avı — oyun mantığı (tamamen tarayıcıda çalışır)

type Pair = { en: string; tr: string };
type Result = 'known' | 'unknown' | 'skipped';
type Question = { pair: Pair; askLang: 'en' | 'tr' };
type Answer = Question & { result: Result };

const LEVEL_NAMES: Record<string, string> = { kolay: 'Kolay', orta: 'Orta', zor: 'Zor' };
const BASE = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : import.meta.env.BASE_URL + '/';

// ---------- Durum ----------
let wordList: Pair[] = []; // seçili listenin tamamı
let sourceName = '';
let selectedLevel: string | null = null;
let wordCount = 20; // 0 = hepsi
let deck: Question[] = [];
let index = 0;
let answers: Answer[] = [];
let currentMark: Result | null = null;
let revealed = false;

// ---------- Yardımcılar ----------
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showScreen(name: 'start' | 'game' | 'result') {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $(`screen-${name}`).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// SheetJS kütüphanesi yalnızca gerektiğinde yüklenir → ilk açılış hafif kalır.
let xlsxLib: typeof import('xlsx') | null = null;
async function getXlsx() {
  if (!xlsxLib) xlsxLib = await import('xlsx');
  return xlsxLib;
}

const HEADER_WORDS = ['ingilizce', 'english', 'türkçe', 'turkce', 'turkish', 'kelime', 'word'];

async function parseWorkbook(data: ArrayBuffer): Promise<Pair[]> {
  const XLSX = await getXlsx();
  const wb = XLSX.read(data, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
  const pairs: Pair[] = [];
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const en = String(row?.[0] ?? '').trim();
    const tr = String(row?.[1] ?? '').trim();
    if (!en || !tr) return;
    if (i === 0 && HEADER_WORDS.includes(en.toLocaleLowerCase('tr'))) return; // başlık satırı
    const key = `${en.toLowerCase()}|${tr.toLocaleLowerCase('tr')}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push({ en, tr });
  });
  return pairs;
}

// ---------- Başlangıç ekranı ----------
const btnStart = $<HTMLButtonElement>('btn-start');
const uploadStatus = $('upload-status');

function updateStartButton() {
  if (wordList.length) {
    btnStart.disabled = false;
    btnStart.textContent = `▶ Oyunu Başlat (${sourceName})`;
  } else {
    btnStart.disabled = true;
    btnStart.textContent = 'Bir seviye seç ya da dosya yükle';
  }
}

document.querySelectorAll<HTMLButtonElement>('.level-card').forEach((card) => {
  card.addEventListener('click', async () => {
    const level = card.dataset.level!;
    document.querySelectorAll('.level-card').forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedLevel = level;
    uploadStatus.textContent = '';
    $('upload-zone').classList.remove('loaded');
    btnStart.disabled = true;
    btnStart.textContent = 'Kelimeler yükleniyor…';
    try {
      const res = await fetch(`${BASE}words/${level}.xlsx`);
      if (!res.ok) throw new Error(String(res.status));
      const pairs = await parseWorkbook(await res.arrayBuffer());
      if (selectedLevel !== level) return; // kullanıcı bu arada başka seçim yaptı
      wordList = pairs;
      sourceName = LEVEL_NAMES[level];
    } catch {
      wordList = [];
      uploadStatus.textContent = '⚠️ Kelime listesi yüklenemedi, sayfayı yenileyip tekrar dene.';
    }
    updateStartButton();
  });
});

$<HTMLInputElement>('file-input').addEventListener('change', async (e) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  selectedLevel = null;
  document.querySelectorAll('.level-card').forEach((c) => c.classList.remove('selected'));
  uploadStatus.textContent = 'Dosya okunuyor…';
  try {
    const pairs = await parseWorkbook(await file.arrayBuffer());
    if (pairs.length === 0) throw new Error('empty');
    wordList = pairs;
    sourceName = file.name.replace(/\.(xlsx|xls|csv)$/i, '');
    uploadStatus.textContent = `✅ ${file.name} yüklendi — ${pairs.length} kelime bulundu.`;
    $('upload-zone').classList.add('loaded');
  } catch {
    wordList = [];
    uploadStatus.textContent =
      '⚠️ Dosyada kelime bulunamadı. 1. sütunda İngilizce, 2. sütunda Türkçe olmalı.';
    $('upload-zone').classList.remove('loaded');
  }
  input.value = '';
  updateStartButton();
});

document.querySelectorAll<HTMLButtonElement>('.count-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.count-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    wordCount = Number(chip.dataset.count);
  });
});

btnStart.addEventListener('click', () => startGame(wordList, wordCount));

// ---------- Oyun ----------
function startGame(pairs: Pair[], count: number) {
  const picked = shuffle(pairs).slice(0, count > 0 ? count : pairs.length);
  deck = picked.map((pair) => ({ pair, askLang: Math.random() < 0.5 ? 'en' : 'tr' }));
  index = 0;
  answers = [];
  $('game-source').textContent = sourceName;
  showScreen('game');
  renderQuestion();
}

function renderQuestion() {
  const q = deck[index];
  const ask = q.askLang === 'en' ? q.pair.en : q.pair.tr;
  const ans = q.askLang === 'en' ? q.pair.tr : q.pair.en;
  const enBadge = '🇬🇧 İngilizce';
  const trBadge = '🇹🇷 Türkçe';

  revealed = false;
  currentMark = null;
  const card = $('card');
  card.classList.remove('flipped');
  card.classList.remove('pop');
  void card.offsetWidth; // animasyonu yeniden tetikle
  card.classList.add('pop');

  // Kart dönmeden arka yüz değişmesin diye kısa gecikme
  $('card-lang').textContent = q.askLang === 'en' ? enBadge : trBadge;
  $('card-lang').dataset.lang = q.askLang;
  $('card-word').textContent = ask;
  setTimeout(() => {
    $('card-answer-lang').textContent = q.askLang === 'en' ? trBadge : enBadge;
    $('card-answer').textContent = ans;
    $('card-question-small').textContent = ask;
  }, 150);
  fitWord($('card-word'), ask);
  fitWord($('card-answer'), ans);

  $('btn-reveal').textContent = '👀 Cevabı Göster';
  updateMarkButtons();
  updateProgress();
  $('btn-next').textContent = index === deck.length - 1 ? 'Sonuçları Gör 🏁' : 'Sonraki Kelime ➜';
}

function fitWord(el: HTMLElement, text: string) {
  el.classList.toggle('long', text.length > 12);
  el.classList.toggle('xlong', text.length > 20);
}

function updateProgress() {
  $('game-progress-text').textContent = `${index + 1} / ${deck.length}`;
  $('progress-bar').style.width = `${(index / deck.length) * 100}%`;
  const known = answers.filter((a) => a.result === 'known').length + (currentMark === 'known' ? 1 : 0);
  const unknown =
    answers.filter((a) => a.result === 'unknown').length + (currentMark === 'unknown' ? 1 : 0);
  $('score-known').textContent = String(known);
  $('score-unknown').textContent = String(unknown);
}

function updateMarkButtons() {
  $('btn-known').classList.toggle('chosen', currentMark === 'known');
  $('btn-unknown').classList.toggle('chosen', currentMark === 'unknown');
  $('btn-next').classList.toggle('ready', currentMark !== null);
}

function toggleReveal() {
  revealed = !revealed;
  $('card').classList.toggle('flipped', revealed);
  $('btn-reveal').textContent = revealed ? '🔄 Kelimeye Dön' : '👀 Cevabı Göster';
}

function mark(result: 'known' | 'unknown') {
  currentMark = currentMark === result ? null : result; // ikinci tıklama işareti kaldırır
  if (currentMark && !revealed) toggleReveal(); // işaretleyince cevabı da göster
  updateMarkButtons();
  updateProgress();
}

function commitCurrent() {
  if (index < deck.length) answers.push({ ...deck[index], result: currentMark ?? 'skipped' });
}

function next() {
  commitCurrent();
  index++;
  if (index >= deck.length) finishGame(false);
  else renderQuestion();
}

function finishGame(early: boolean) {
  // Erken bitirildiyse sadece işaretlenmiş mevcut kelime sayılır
  if (early && currentMark) commitCurrent();
  showResults();
}

$('card').addEventListener('click', toggleReveal);
$('btn-reveal').addEventListener('click', toggleReveal);
$('btn-known').addEventListener('click', () => mark('known'));
$('btn-unknown').addEventListener('click', () => mark('unknown'));
$('btn-next').addEventListener('click', next);
$('btn-finish').addEventListener('click', () => finishGame(true));

document.addEventListener('keydown', (e) => {
  if (!$('screen-game').classList.contains('active')) return;
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === ' ') {
    e.preventDefault();
    toggleReveal();
  } else if (e.key === '1') mark('known');
  else if (e.key === '2') mark('unknown');
  else if (e.key === 'Enter' || e.key === 'ArrowRight') {
    e.preventDefault();
    next();
  }
});

// ---------- Sonuçlar ----------
function showResults() {
  const known = answers.filter((a) => a.result === 'known');
  const unknown = answers.filter((a) => a.result === 'unknown');
  const skipped = answers.filter((a) => a.result === 'skipped');
  const judged = known.length + unknown.length;
  const percent = judged ? Math.round((known.length / judged) * 100) : 0;

  $('stat-known').textContent = String(known.length);
  $('stat-unknown').textContent = String(unknown.length);
  $('stat-skipped').textContent = String(skipped.length);
  $('stat-total').textContent = String(answers.length);
  $('result-percent').textContent = `${percent}%`;

  // Halka grafik
  const C = 2 * Math.PI * 50;
  const total = answers.length || 1;
  const kLen = (known.length / total) * C;
  const uLen = (unknown.length / total) * C;
  const kSeg = $('donut-known') as unknown as SVGCircleElement;
  const uSeg = $('donut-unknown') as unknown as SVGCircleElement;
  kSeg.style.strokeDasharray = `0 ${C}`;
  uSeg.style.strokeDasharray = `0 ${C}`;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      kSeg.style.strokeDasharray = `${kLen} ${C - kLen}`;
      uSeg.style.strokeDasharray = `${uLen} ${C - uLen}`;
      uSeg.style.strokeDashoffset = String(-kLen);
    }),
  );

  // Mesaj
  let emoji = '🌟', title = 'Süpersin!', msg = 'Neredeyse hepsini bildin, tebrikler!';
  if (answers.length === 0) {
    emoji = '🤔'; title = 'Henüz kelime yok'; msg = 'Hiç kelime işaretlemeden oyunu bitirdin.';
  } else if (percent < 40) {
    emoji = '💪'; title = 'Devam et!'; msg = 'Her tekrar seni biraz daha güçlendiriyor. Bilemediklerini bir daha çalış!';
  } else if (percent < 70) {
    emoji = '👍'; title = 'Güzel gidiyorsun!'; msg = 'İyi bir sonuç! Biraz daha tekrarla zirveye çıkarsın.';
  } else if (percent < 90) {
    emoji = '🎉'; title = 'Harika iş!'; msg = 'Kelimelerin çoğunu biliyorsun, böyle devam!';
  }
  $('result-emoji').textContent = emoji;
  $('result-title').textContent = title;
  $('result-message').textContent = msg;

  fillList('list-unknown', 'count-unknown-list', unknown);
  fillList('list-known', 'count-known-list', known);
  $('list-unknown-box').hidden = unknown.length === 0;
  $('list-known-box').hidden = known.length === 0;
  $('btn-retry-unknown').hidden = unknown.length === 0;

  showScreen('result');
  if (percent >= 70 && answers.length > 0) confetti();
}

function fillList(listId: string, countId: string, items: Answer[]) {
  const ul = $(listId);
  ul.innerHTML = '';
  items.forEach((a) => {
    const li = document.createElement('li');
    const en = document.createElement('b');
    en.textContent = a.pair.en;
    const tr = document.createElement('span');
    tr.textContent = a.pair.tr;
    li.append(en, tr);
    ul.append(li);
  });
  $(countId).textContent = String(items.length);
}

$('btn-retry-unknown').addEventListener('click', () => {
  const unknownPairs = answers.filter((a) => a.result === 'unknown').map((a) => a.pair);
  if (unknownPairs.length) startGame(unknownPairs, 0);
});
$('btn-play-again').addEventListener('click', () => startGame(wordList, wordCount));
$('btn-home').addEventListener('click', () => showScreen('start'));

// ---------- Küçük konfeti efekti ----------
function confetti() {
  const colors = ['#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];
  for (let i = 0; i < 80; i++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    p.style.left = `${Math.random() * 100}vw`;
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${Math.random() * 0.6}s`;
    p.style.animationDuration = `${2 + Math.random() * 1.5}s`;
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.append(p);
    setTimeout(() => p.remove(), 4500);
  }
}
