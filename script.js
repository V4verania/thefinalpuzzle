const riddles = [
  {
    text: `“I am taken before you speak,  
Yet never held or seen.  
I vanish when revealed —  
What am I?”`,
    options: ["A mask", "A secret", "A whisper", "A thought"],
    answer: "A secret",
    feedback: "Correct. A secret disappears the moment it’s shared."
  },
  {
    text: `“Five glasses stand in a row.  
Four are wet, one is dry.  
One guest stayed silent —  
Which glass is theirs?”`,
    options: ["The first", "The last", "The dry one", "The tallest"],
    answer: "The dry one",
    feedback: "Correct. The silent guest didn’t toast — their glass remains untouched."
  },
  {
    text: `“Three books lie untouched:  
One burned, one frozen, one blank.  
Only one hides a message.  
Which do you read?”`,
    options: ["The burned book", "The frozen book", "The blank book", "The torn book"],
    answer: "The blank book",
    feedback: "Correct. A blank page invites discovery — the message is hidden in absence."
  },
  {
    text: `“A record spins, no sound plays.  
A guest hums a tune you’ve never heard,  
Yet it feels familiar.  
What kind of song is it?”`,
    options: ["A lullaby", "A chant", "A hymn", "A memory"],
    answer: "A lullaby",
    feedback: "Correct. A lullaby is remembered without being heard — soft, haunting, familiar."
  },
  {
    text: `“Four flowers bloom:  
One fades quickly, one lasts long, one has no name, one is remembered.  
Which one symbolizes memory?”`,
    options: ["Rose", "Lily", "Forget-me-not", "Orchid"],
    answer: "Forget-me-not",
    feedback: "Correct. Its name is the clue — it resists forgetting."
  },
  {
    text: `“A fire burns.  
Ashes fall.  
Something rises, thin and grey.  
What remains?”`,
    options: ["Smoke", "Regret", "Heat", "Dust"],
    answer: "Smoke",
    feedback: "Correct. Smoke is the lingering trace of flame — visible, ephemeral, real."
  },
  {
    text: `“Four bottles sit on a shelf:  
One labeled, one dusty, one cracked, one blank.  
Which one holds the unknown?”`,
    options: ["The labeled one", "The dusty one", "The cracked one", "The blank one"],
    answer: "The blank one",
    feedback: "Correct. Without a label, its contents are a mystery — the unknown lies within."
  },
  {
    text: `“A bell rings.  
No one is seen.  
Yet something moves.  
Who responded?”`,
    options: ["The wind", "The unseen", "The host", "The echo"],
    answer: "The unseen",
    feedback: "Correct. If no one is visible, the answer must be the unseen."
  },
  {
    text: `“Three mirrors reflect:  
One shows your past, one shows disguise, one shows nothing.  
Which one tells the truth?”`,
    options: ["The past mirror", "The disguised mirror", "The empty mirror", "The broken mirror"],
    answer: "The empty mirror",
    feedback: "Correct. No reflection means no distortion — truth lies in absence."
  },
  {
    text: `“Ten doors, one locked.  
No key, no code.  
Only a whisper opens it.  
What do you say?”`,
    options: ["I remember.", "Forgive me.", "It was me.", "Let me in."],
    answer: "It was me.",
    feedback: "Correct. A confession is the key — ownership ends the puzzle."
  }
];

let currentStep = 0;
let guestCode = "";
let lockouts = JSON.parse(localStorage.getItem("lockouts") || "{}");

function validateCode() {
  guestCode = document.getElementById("codeInput").value.trim();
  const gateMessage = document.getElementById("gateMessage");

  if (guestCode === "RESETALL") {
    localStorage.setItem("lockouts", JSON.stringify({}));
    gateMessage.textContent = "✅ All lockouts have been cleared.";
    gateMessage.classList.add("fade");
    return;
  }

  const lockoutUntil = lockouts[guestCode];
  if (lockoutUntil) {
    const now = new Date();
    const unlockDate = new Date(lockoutUntil);
    if (now < unlockDate) {
      const timeLeftMs = unlockDate - now;
      const daysLeft = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      gateMessage.textContent = `⛔ The veil is sealed for you. Return in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} and ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}.`;
      gateMessage.classList.add("fade");
      return;
    }
  }

  fetch("https://thefinalpuzzle-worker.thefinalpuzzle.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: guestCode })
  })
    .then(res => res.json())
    .then(data => {
      if (data.valid) {
        document.getElementById("veil").classList.add("hidden");
        document.getElementById("maze").classList.remove("hidden");
        document.getElementById("ambientAudio").play().catch(() => {});
        showRiddle();
      } else {
        gateMessage.textContent = "❌ The veil does not recognize you.";
        gateMessage.classList.add("fade");
      }
    })
    .catch(() => {
      gateMessage.textContent = "⚠️ The ritual failed. Try again.";
      gateMessage.classList.add("fade");
    });
}

function showRiddle() {
  const riddle = riddles[currentStep];
  const riddleText = document.getElementById("riddleText");
  const choicesDiv = document.getElementById("choices");
  const feedback = document.getElementById("feedback");

  riddleText.textContent = riddle.text;
  feedback.textContent = "";
  choicesDiv.innerHTML = "";

  riddle.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.classList.add("fade");
    btn.onclick = () => {
      if (option === riddle.answer) {
        feedback.textContent = riddle.feedback;
        feedback.classList.add("fade");
        currentStep++;
        if (currentStep < riddles.length) {
          setTimeout(showRiddle, 2000);
        } else {
          setTimeout(showFinalReveal, 2000);
        }
      } else {
        const lockoutDate = new Date();
        lockoutDate.setDate(lockoutDate.getDate() + 2);
        lockouts[guestCode] = lockoutDate.toISOString();
        localStorage.setItem("lockouts", JSON.stringify(lockouts));
        feedback.textContent = `🕯️ The veil shudders. That is not the path. Return in 2 days.`;
        feedback.classList.add("fade");
        choicesDiv.innerHTML = "";
      }
    };
    choicesDiv.appendChild(btn);
  });
}

function showFinalReveal() {
  document.getElementById("maze").classList.add("hidden");
  const revealDiv = document.getElementById("reveal");
  revealDiv.classList.remove("hidden");

  const now = new Date();
  const revealDate = new Date("2026-02-01T00:00:00");

  if (now < revealDate) {
    const daysLeft = Math.ceil((revealDate - now) / (1000 * 60 * 60 * 24));
    const percent = Math.min(100, Math.floor((1 - (revealDate - now) / (revealDate - new Date("2025-11-01T00:00:00"))) * 100));

    revealDiv.innerHTML = `
      <h2 class="fade">You have reached the inner sanctum.</h2>
      <p class="fade">The dossiers remain sealed.</p>
      <p class="fade">The flame will reveal them in <strong>${daysLeft} days</strong>...</p>
      <div id="candleContainer" class="fade">
        <div id="candleFlame"></div>
        <div id="candleMeter">
          <div id="candleFill" style="width:${percent}%"></div>
        </div>
      </div>
    `;
  } else {
    revealDiv.innerHTML = `
      <h2 class="fade">Your character dossier is ready.</h2>
      <p class="fade">The veil parts. Your role awaits...</p>
      <p class="fade">Code: <strong>${guestCode}</strong></p>
      <!-- TODO: Load dossier based on code -->
    `;
  }
}

// ✅ DOM Ready: Attach listeners
document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("submitCode");
  if (button) button.addEventListener("click", validateCode);

  const muteToggle = document.getElementById("muteToggle");
  const ambientAudio = document.getElementById("ambientAudio");

  if (muteToggle && ambientAudio) {
    muteToggle.addEventListener("click", () => {
      ambientAudio.muted = !ambientAudio.muted;
      muteToggle.textContent = ambientAudio.muted ? "🔇" : "🔊";
    });
  }
});

