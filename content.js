// ================= SIDE PANEL =================
let panel = document.getElementById("english-helper-panel");

if (!panel) {
  panel = document.createElement("div");
  panel.id = "english-helper-panel";
  panel.style.cssText = `
    position: fixed;
    right: 10px;
    top: 60px;
    width: 300px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    padding: 12px;
    font-family: Arial;
    font-size: 14px;
    z-index: 999999;
    display: none;
  `;

  panel.innerHTML = `
    <b>English Helper</b>
    <div id="eh-word" style="margin-top:6px;font-weight:bold;"></div>
    <div id="eh-meaning" style="margin-top:8px;"></div>

    <div style="margin-top:10px;">
      <button id="startSpeak">🎙 Start Speak</button>
      <button id="stopSpeak">⛔ Stop</button>
      <button id="showHistory">📚 History</button>
    </div>

    <div style="text-align:right;margin-top:8px;">
      <button id="eh-close">✖</button>
    </div>
  `;

  document.body.appendChild(panel);

  document.getElementById("eh-close").onclick = () => {
    panel.style.display = "none";
  };
}

// ================= WORD SELECTION =================
let lastWord = "";

document.addEventListener("selectionchange", () => {
  const word = window.getSelection().toString().trim().toLowerCase();
  if (!word || word.includes(" ") || word === lastWord) return;

  lastWord = word;
  showMeaning(word);
});

// ================= SPEECH TO TEXT =================
let recognition = null;
let isListening = false;

const SpeechRecognitionAPI =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognitionAPI) {
  recognition = new SpeechRecognitionAPI();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const text =
      event.results[event.results.length - 1][0].transcript;
    console.log("🎤 Spoken:", text);
    processSpokenText(text);
  };

  recognition.onerror = (e) => {
    console.log("Speech error:", e);
  };
}

// ================= BUTTON CONTROL =================
document.addEventListener("click", (e) => {
  if (e.target.id === "startSpeak" && recognition && !isListening) {
    recognition.start();
    isListening = true;
    panel.style.display = "block";
    document.getElementById("eh-meaning").innerText =
      "🎧 Listening... speak English";
  }

  if (e.target.id === "stopSpeak" && recognition && isListening) {
    recognition.stop();
    isListening = false;
    document.getElementById("eh-meaning").innerText =
      "⛔ Listening stopped";
  }

  if (e.target.id === "showHistory") {
    showHistory();
  }
});

// ================= PROCESS SPOKEN TEXT =================
function processSpokenText(text) {
  if (!text) return;

  const words = text
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .split(" ")
    .filter(w => w.length > 3);

  if (words.length === 0) return;

  showMeaning(words[words.length - 1]);
}

// ================= MEANING FUNCTION =================
async function showMeaning(word) {
  panel.style.display = "block";
  document.getElementById("eh-word").innerText = word;
  document.getElementById("eh-meaning").innerText = "Loading meaning...";

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    const data = await res.json();

    if (!Array.isArray(data)) {
      document.getElementById("eh-meaning").innerText =
        "Meaning not found.";
      return;
    }

    const englishMeaning =
      data[0].meanings[0].definitions[0].definition;

    const hindiMeaning = getSimpleHindi(word, englishMeaning);

    document.getElementById("eh-meaning").innerHTML = `
      <div><b>English:</b> ${englishMeaning}</div>
      <div style="margin-top:6px;"><b>Hindi:</b> ${hindiMeaning}</div>
    `;

    saveToHistory(word, englishMeaning, hindiMeaning);

  } catch {
    document.getElementById("eh-meaning").innerText =
      "Error fetching meaning.";
  }
}

// ================= SIMPLE HINDI FALLBACK =================
function getSimpleHindi(word) {
  const map = {
    meticulous: "बहुत बारीकी से काम करने वाला",
    inevitable: "जिसे टाला न जा सके",
    oblivious: "जिसे आसपास की बातों का ध्यान न हो",
    reluctant: "अनिच्छुक",
    tremendous: "बहुत ज़्यादा",
    significant: "महत्वपूर्ण",
    crucial: "अत्यंत आवश्यक",
    ambiguous: "अस्पष्ट"
  };

  return map[word] || "इस शब्द का सरल अर्थ";
}

// ================= HISTORY SAVE =================
function saveToHistory(word, englishMeaning, hindiMeaning) {
  let history =
    JSON.parse(localStorage.getItem("english_helper_history")) || [];

  if (history.some(item => item.word === word)) return;

  history.unshift({
    word,
    english: englishMeaning,
    hindi: hindiMeaning,
    time: new Date().toLocaleString()
  });

  if (history.length > 100) history.pop();

  localStorage.setItem(
    "english_helper_history",
    JSON.stringify(history)
  );
}

// ================= SHOW HISTORY =================
function showHistory() {
  let history =
    JSON.parse(localStorage.getItem("english_helper_history")) || [];

  if (history.length === 0) {
    document.getElementById("eh-meaning").innerText =
      "No history yet.";
    panel.style.display = "block";
    return;
  }

  let html = "<b>📚 Learned Words</b><hr>";

  history.forEach(item => {
    html += `
      <div style="margin-bottom:8px;">
        <b>${item.word}</b><br>
        <small>${item.english}</small><br>
        <small>Hindi: ${item.hindi}</small><br>
        <small style="color:gray;">${item.time}</small>
      </div>
    `;
  });

  document.getElementById("eh-meaning").innerHTML = html;
  panel.style.display = "block";
}
