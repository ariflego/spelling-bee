const WORDS = [
  {british: "Adrenocorticotrophin", others: ["Adrenocorticotrohin"]},
  {british: "Anthropomorphisation", others: ["Anthropomorphization"]},
  {british: "Antidisestablishmentarianism", others: []},
  {british: "Antixerophthalmic", others: []},
  {british: "Autothaumaturgist", others: []},
  {british: "Acetylglucocoroglaucigenin", others: []},
  {british: "Bourgeoisification", others: []},
  {british: "Canaliculodacryocystorhinostomy", others: []},
  {british: "Chargoggagoggmanchauggagoggchaubunagungamaugg", others: []},
  {british: "Cholangiopancreatography", others: []},
  {british: "Convolvulaceous", others: []},
  {british: "Corticopontocerebellar", others: []},
  {british: "Counterimmunoelectrophoresis", others: []},
  {british: "Cholangiocholecystocholedochectomy", others: []},
  {british: "Dehydrothiotoluidine", others: []},
  {british: "Dextrodeorsumversion", others: []},
  {british: "Dichlorodiphenyltrichloroethane", others: []},
  {british: "Eellogofusciouhipoppokunurious", others: []},
  {british: "Erythrocytapheresis", others: []},
  {british: "Encephalocraniocutaneouslipomatosis", others: []},
  {british: "Ferriprotoporphyrin", others: []},
  {british: "Floccinaucinihilipilification", others: []},
  {british: "Gastroenterologist", others: []},
  {british: "Gegenstandstheorie", others: []},
  {british: "Hexakosioihexekontahexaphobia", others: []},
  {british: "Hippopotomonstrosesquippedaliophobia", others: ["Hippopotomonstrosesquipedaliophobia"]},
  {british: "Honourificabilitudinity", others: ["Honorificabilitudinity"]},
  {british: "Hypothalamicpituitaryadrenocortical", others: []},
  {british: "Hematospectrophotometrically", others: []},
  {british: "Inositolphosphorylceramide", others: []},
  {british: "Laryngotracheobronchitis", others: []},
  {british: "Laparohysterosalpingooophorectomy", others: []},
  {british: "Lymphangioleiomyomatosis", others: []},
  {british: "Loncastuximabtesirine", others: []},
  {british: "Nonanonacontanonactanonaliagon", others: []},
  {british: "Nucleotidylexotransferase", others: []},
  {british: "Otorhinolaryngological", others: []},
  {british: "Photoplethysmography", others: []},
  {british: "Pneumoencephalography", others: []},
  {british: "Pneumonoultramicroscopicsilicovolcanoconiosis", others: []},
  {british: "Polyphiloprogenitive", others: []},
  {british: "Pseudopseudohypoparathyroidism", others: []},
  {british: "Pseudorhombicuboctahedron", others: []},
  {british: "Psychoneuroendocrinological", others: []},
  {british: "Psychoneuroimmunology", others: []},
  {british: "Psychophysicotherapeutics", others: []},
  {british: "Pyrrolizidinealkaloidosis", others: []},
  {british: "Sclerectoiridectomy", others: []},
  {british: "Spectrophotofluorometry", others: []},
  {british: "Sphenopalatineganglioneuralgia", others: []},
  {british: "Sphygmomanometer", others: []},
  {british: "Stereoelectroencephalography", others: []},
  {british: "Supercalifragilisticexpialidocious", others: []},
  {british: "Thyroparathyroidectomy", others: []},
  {british: "Tonsillopharyngitis", others: []},
  {british: "Ventriculocisternostomy", others: []}
];

// helpers
function normalize(s){ return (s||"").trim().toLowerCase(); }
function letterCount(s){ return (s.match(/[A-Za-z]/g) || []).length; }
function capitaliseFirst(str){ return (!str || str.length===0) ? str : str[0].toUpperCase() + str.slice(1); }
function acceptedAnswersFor(entry){
  const set = new Set();
  set.add(normalize(entry.british));
  if(Array.isArray(entry.others)) entry.others.forEach(o => set.add(normalize(o)));
  return set;
}
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; }); }

// Safely get elements (may be intentionally missing in your new layout)
const playBtn = document.getElementById('playAutomatic'); // should exist
const input = document.getElementById('answerInput'); // should exist
const submitBtn = document.getElementById('submitBtn'); // should exist
const timerEl = document.getElementById('timer'); // should exist
const playsLeftEl = document.getElementById('playsLeft'); // should exist
const feedbackEl = document.getElementById('feedback'); // should exist
const revealWrap = document.getElementById('reveal'); // should exist
const correctAnswerEl = document.getElementById('correctAnswer'); // should exist
const restartBtn = document.getElementById('restartBtn'); // should exist
const streakEl = document.getElementById('streak'); // should exist
const playedEl = document.getElementById('played'); // should exist

// Optional nodes (may be missing if you removed right-panel)
const lettersCountEl = document.getElementById('lettersCount'); // optional
const currentWordIndexEl = document.getElementById('currentWordIndex'); // optional
const bigStreakEl = document.getElementById('bigStreak'); // optional

// Log which optional bits are missing so you know why updates weren't visible
if(!lettersCountEl) console.info("lettersCount element missing — updates will be skipped.");
if(!currentWordIndexEl) console.info("currentWordIndex element missing — updates will be skipped.");
if(!bigStreakEl) console.info("bigStreak element missing — will update #streak instead.");

// state
let current = null;
let audio = null;
let playsUsed = 0;
const maxPlays = 3;
let timerInterval = null;
let timeRemainingMs = 0;
let gameActive = false;
let streak = 0;
let playedCount = 0;

function pickRandomWord(){ const idx = Math.floor(Math.random()*WORDS.length); return {index: idx, entry: WORDS[idx]}; }

function updateStats(){
  if(streakEl) streakEl.textContent = streak;
  if(playedEl) playedEl.textContent = playedCount;
  // also update bigStreak fallback
  if(bigStreakEl){
    bigStreakEl.textContent = streak;
  }
}

function startRound(){
  // reset UI safely
  if(input){
    input.value = "";
    input.disabled = false;
    input.focus();
  }
  if(feedbackEl){
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
  }
  if(revealWrap) revealWrap.style.display = "none";

  current = pickRandomWord();
  const british = current.entry.british;
  const letters = letterCount(british);

  // timing: 0.6s per letter (ms)
  const letterTimeMs = 100;
  const timeMs = Math.max( Math.round(letters * letterTimeMs), letterTimeMs );
  timeRemainingMs = timeMs;
  playsUsed = 0;
  gameActive = true;

  // update optional UI fields only if present:
  if(lettersCountEl) lettersCountEl.textContent = letters;
  if(currentWordIndexEl) currentWordIndexEl.textContent = (current.index + 1) + " / " + WORDS.length;
  if(playsLeftEl) playsLeftEl.textContent = (maxPlays - playsUsed);
  if(timerEl) timerEl.textContent = (timeRemainingMs/1000).toFixed(1) + "s";

  // build audio filename (capitalised british) and play
  const filename = capitaliseFirst(british) + ".MP3";
  if(audio){ audio.pause(); audio = null; }
  audio = new Audio(filename);
  audio.preload = "auto";
  // autoplay + increment playsUsed via playAudio()
  playAudio();

  // start countdown; be defensive about timerEl
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeRemainingMs -= 100;
    if(timeRemainingMs <= 0){
      timeRemainingMs = 0;
      if(timerEl) timerEl.textContent = "0.0s";
      clearInterval(timerInterval);
      handleTimeout();
    } else {
      if(timerEl) timerEl.textContent = (timeRemainingMs/1000).toFixed(1) + "s";
    }
  }, 100);
}

function playAudio(){
  if(!audio) return;
  if(playsUsed >= maxPlays) return;
  audio.currentTime = 0;
  const p = audio.play();
  playsUsed++;
  if(playsLeftEl) playsLeftEl.textContent = (maxPlays - playsUsed);
  if(playBtn){
    if(playsUsed >= maxPlays){
      playBtn.disabled = true;
      playBtn.textContent = "🔇 No replays";
    } else {
      playBtn.disabled = false;
      playBtn.textContent = "🔊 Play word";
    }
  }
  if (p && typeof p.catch === 'function'){
    p.catch(()=> {
      if(feedbackEl){
        feedbackEl.textContent = "Autoplay blocked — press Play to hear the word.";
        feedbackEl.className = "feedback wrong";
      }
    });
  }
}

function checkAnswer(){
  if(!gameActive) return;
  if(!input) return;
  const user = normalize(input.value);
  if(user === "") return;
  const accepted = acceptedAnswersFor(current.entry);
  if(accepted.has(user)){
    // correct
    streak++;
    playedCount++;
    updateStats();
    if(feedbackEl){ feedbackEl.textContent = "Correct! ✅"; feedbackEl.className = "feedback correct"; }
    gameActive = false;
    clearInterval(timerInterval);
    if(bigStreakEl) bigStreakEl.textContent = streak;
    // small delay then next word
    setTimeout(() => startRound(), 400);
  } else {
    playedCount++;
    updateStats();
    showCorrectAndEnd();
  }
}

function handleTimeout(){
  if(!gameActive) return;
  showCorrectAndEnd("Time's up!");
}

function showCorrectAndEnd(reason){
  gameActive = false;
  clearInterval(timerInterval);
  if(input) input.disabled = true;
  const british = current.entry.british;
  const americans = current.entry.others || [];
  const acceptedList = [british].concat(americans).filter(Boolean);
  if(correctAnswerEl){
    correctAnswerEl.innerHTML = "<div style='color:var(--muted);font-size:13px'>Correct spelling(s):</div><div style='margin-top:6px'>"
      + acceptedList.map(s => "<code>"+escapeHtml(s)+"</code>").join(" &nbsp; / &nbsp; ")
      + "</div>";
  }
  if(revealWrap) revealWrap.style.display = "block";
  if(feedbackEl){
    feedbackEl.textContent = reason ? reason : "Incorrect";
    feedbackEl.className = "feedback wrong";
  }
  streak = 0;
  if(bigStreakEl) bigStreakEl.textContent = streak;
  updateStats();
}

function restartGame(){
  streak = 0;
  if(bigStreakEl) bigStreakEl.textContent = streak;
  updateStats();
  if(revealWrap) revealWrap.style.display = "none";
  startRound();
}

// Safe event wiring: only add listeners if elements exist
if(playBtn){
  playBtn.addEventListener('click', () => {
    if(!audio){
      if(!current) startRound();
    }
    if(playsUsed < maxPlays) playAudio();
  });
} else {
  console.warn("playAutomatic button missing — cannot play audio without it.");
}

if(submitBtn){
  submitBtn.addEventListener('click', checkAnswer);
} else {
  console.warn("submitBtn missing — cannot submit.");
}

if(input){
  input.addEventListener('keydown', (e) => {
    if(e.key === "Enter"){ e.preventDefault(); checkAnswer(); }
  });
} else {
  console.warn("answerInput missing — user cannot type answers.");
}

if(restartBtn){
  restartBtn.addEventListener('click', restartGame);
} else {
  console.info("restartBtn missing — reveal will still show correct answers but can't restart via button.");
}

// Start the first round after load
window.addEventListener('load', () => {
  setTimeout(() => {
    try { startRound(); } catch (err) { console.error("startRound failed:", err); }
  }, 200);
});

// Pause audio on unload
window.addEventListener('beforeunload', () => { if(audio) audio.pause(); });