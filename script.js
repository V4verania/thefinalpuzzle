const riddles = [
  {
    text: `The Sunday Alibi  
A man is found murdered on a Sunday morning. His wife immediately calls the police, who question the household staff.
The Butler says he was organizing the wine cellar.
The Cook says she was preparing breakfast.
The Gardener says he was watering the ferns.
The Maid says she was collecting the morning mail.
The police immediately arrest the murderer. Who did it`,
    keywords: ["maid", "the maid"],
    feedback: "Correct. There’s no mail on Sundays"
  },
  {
    text: `The Poisoned Drinks  
Two rivals sit down for a drink. They both order iced tea from the same pitcher. One man drinks his glass very quickly and 
  immediately orders another. The other woman sips her one glass slowly. The woman dies, but the man survives. It is determined that all the drinks were poisoned. 
    How did the man survive?`,

    keywords: ["ice", "ice cubes"],
    feedback: "Correct. The poison was in the ice — it melted into her drink, not his."
  },
  {
    text: `What Am I?  
I have cities, but no houses.  
I have mountains, but no trees.  
I have water, but no fish.  
What am I?`,
    keywords: ["map"],
    feedback: "Correct. A map shows features without containing them."
  },
  {
    text: `The person who makes it has no need of it.  
The person who buys it has no use for it.  
The person who uses it can neither see nor feel it.  
What is it?`,
    keywords: ["coffin", "casket"],
    feedback: "Correct. A coffin is made for the dead — unseen, unfelt by its user."
  },
  {
    text: `What belongs to you, but everyone else uses more than you do?`,
    keywords: ["name", "my name"],
    feedback: "Correct. Others speak your name far more than you do."
  },
  {
    text: `What can run but never walks, has a mouth but never talks, has a head but never weeps, has a bed but never sleeps?`,
    keywords: ["river"],
    feedback: "Correct. A river fits all four clues perfectly."
  },
  {
    text: `What can fill a room but takes up no space?`,
    keywords: ["light"],
    feedback: "Correct. Light fills space without occupying it."
  },
  {
    text: `Always in you, sometimes on you; if I surround you, I can kill you. What am I?`,
    keywords: ["water"],
    feedback: "Correct. Water is essential — but overwhelming, it becomes deadly."
  },
  {
    text: `I’m always hungry, I must always be fed. The finger I touch will soon turn red. What am I?`,
    keywords: ["fire"],
    feedback: "Correct. Fire consumes and burns — always hungry, always dangerous."
  },
  {
    text: `What can travel around the world while staying in the same spot?`,
    keywords: ["stamp", "postage"],
    feedback: "Correct. A stamp travels far while remaining fixed to the envelope."
  },
  {
    text: `I fly without wings, I cry without eyes. Wherever I go, darkness follows me. What am I?`,
    keywords: ["cloud", "A cloud"],
    feedback: "Correct. A cloud drifts, weeps, and casts shadow — poetic and true."
  }
];

let currentStep = 0;
let guestCode = "";
let lockouts = JSON.parse(localStorage.getItem("lockouts") || "{}");
let passedGuests = JSON.parse(localStorage.getItem("passedGuests") || "{}");

function validateCode() {
  guestCode = document.getElementById("codeInput").value.trim();
  document.getElementById("codeInput").value = "";
  const gateMessage = document.getElementById("gateMessage");
  
  if (guestCode === "RESETPASSED") {
    localStorage.setItem("passedGuests", JSON.stringify({}));
    passedGuests = {};
    gateMessage.textContent = "✅ All passed flags have been cleared.";
    gateMessage.classList.add("fade");
    return;
  }

  if (guestCode === "RESETALL") {
    localStorage.setItem("lockouts", JSON.stringify({}));
    lockouts = {};
    gateMessage.textContent = "✅ All lockouts have been cleared.";
    gateMessage.classList.add("fade");
    return;
  }

  if (passedGuests[guestCode]) {
    document.getElementById("veil").classList.add("hidden");
    document.getElementById("maze").classList.add("hidden");
    document.getElementById("reveal").classList.remove("hidden");
    showFinalReveal();
    return;
  }

  const lockoutUntil = lockouts[guestCode];
  if (lockoutUntil) {
    const unlockDate = new Date(lockoutUntil);
    const countdown = () => {
      const now = new Date();
      const timeLeftMs = unlockDate - now;

      if (timeLeftMs <= 0) {
        gateMessage.textContent = "✅ The veil is open. You may now enter.";
        gateMessage.classList.add("fade");
        clearInterval(timer);
        return;
      }

      const hours = Math.floor((timeLeftMs / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((timeLeftMs / (1000 * 60)) % 60);
      const seconds = Math.floor((timeLeftMs / 1000) % 60);

      gateMessage.textContent = `⛔ The veil is sealed. Countdown: ${hours}h ${minutes}m ${seconds}s`;
      gateMessage.classList.add("fade");
    };

    countdown();
    const timer = setInterval(countdown, 1000);
    return;
  }

  console.log("Sending to server:", JSON.stringify({ code: guestCode }));

  fetch("https://thefinalpuzzle-worker.thefinalpuzzle.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: guestCode })
  })
    .then(res => res.json())
    .then(data => {
      console.log("Server response:", data);
      if (data.valid) {
        document.getElementById("veil").classList.add("hidden");
        document.getElementById("maze").classList.remove("hidden");
        document.getElementById("ambientAudio").play().catch(() => {});
        showRiddle();
      } else {
        gateMessage.textContent = "❌ The veil does not recognize you.";
      }
    })
    .catch(err => {
      console.error("Fetch error:", err);
      gateMessage.textContent = "⚠️ The ritual failed. Try again.";
    });
}

function showRiddle() {
  const riddle = riddles[currentStep];
  const riddleText = document.getElementById("riddleText");
  const choicesDiv = document.getElementById("choices");
  const feedback = document.getElementById("feedback");

  riddleText.textContent = riddle.text;
  feedback.textContent = "";
  choicesDiv.innerHTML = `
    <input type="text" id="riddleInput" placeholder="Type your answer..." />
    <button id="submitRiddle">Submit</button>
  `;

document.getElementById("submitRiddle").onclick = () => {
  const rawInput = document.getElementById("riddleInput").value.trim().toLowerCase();
  const normalizedInput = rawInput.replace(/[^a-z0-9 ]+/g, " "); // removes punctuation/symbols
  const matched = riddle.keywords.some(keyword =>
    normalizedInput.includes(keyword.toLowerCase())
  );

    if (matched) {
      feedback.textContent = riddle.feedback;
      feedback.classList.add("fade");

      const ritual = document.getElementById("ritualAnimation");
      ritual.classList.remove("hidden");
      ritual.querySelector(".flame").style.opacity = "1";
      ritual.querySelector(".sigil").style.opacity = "1";
      ritual.querySelector(".veilRipple").style.opacity = "1";

      const whisper = document.getElementById("whisperAudio");
      if (whisper) {
        whisper.currentTime = 0;
        whisper.play().catch(() => {});
      }

      setTimeout(() => {
        ritual.classList.add("hidden");
        ritual.querySelector(".flame").style.opacity = "0";
        ritual.querySelector(".sigil").style.opacity = "0";
        ritual.querySelector(".veilRipple").style.opacity = "0";
      }, 1800);

      currentStep++;
if (currentStep < riddles.length) {
  setTimeout(showRiddle, 4500); // or 5000 for a full 5 seconds
}
else {
        passedGuests[guestCode] = true;
        localStorage.setItem("passedGuests", JSON.stringify(passedGuests));
        document.getElementById("maze").classList.add("hidden");
        document.getElementById("reveal").classList.remove("hidden");
        showFinalReveal();
      }
    } else {
      const lockoutDate = new Date();
      lockoutDate.setHours(lockoutDate.getHours() + 24);
      lockouts[guestCode] = lockoutDate.toISOString();
      localStorage.setItem("lockouts", JSON.stringify(lockouts));
      const wrongAudio = document.getElementById("wrongAnswerAudio");
if (wrongAudio) {
  wrongAudio.currentTime = 0;
  wrongAudio.play().catch(() => {});
}
      feedback.textContent = `🕯️ The veil shudders. That is not the path. Return in 24 hours.`;
      feedback.classList.add("fade");
      choicesDiv.innerHTML = "";
    }
  };
}

function showFinalReveal() {
  const revealDiv = document.getElementById("reveal");
  revealDiv.classList.remove("hidden");

  const now = new Date();
  const revealDate = new Date("2026-02-01T00:00:00");

  if (now < revealDate) {
    const daysLeft = Math.ceil((revealDate - now) / (1000 * 60 * 60 * 24));
    const percent = Math.min(
      100,
      Math.floor(
        (1 - (revealDate - now) / (revealDate - new Date("2025-11-01T00:00:00"))) * 100
      )
    );

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

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("submitCode");
  if (button) {
    button.addEventListener("click", validateCode);
  }

  const muteToggle = document.getElementById("muteToggle");
  const ambientAudio = document.getElementById("ambientAudio");

  if (muteToggle && ambientAudio) {
    muteToggle.addEventListener("click", () => {
      ambientAudio.muted = !ambientAudio.muted;
      muteToggle.textContent = ambientAudio.muted ? "🔇" : "🔊";
    });
  }
});

