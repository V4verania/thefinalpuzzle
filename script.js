const riddles = [
  {
    text: `“The table is set but no one eats.  
A name is spoken, then silence repeats.  
One guest arrives with nothing to say —  
What did they bring that let them stay?”`,
    options: ["A mask", "A candle", "A secret", "A key"],
    answer: "A secret",
    feedback: "The candle flickers once. The door opens without sound. You step inside."
  },
  {
    text: `“Five glasses shimmer, one is dry.  
The host is missing, yet none ask why.  
The toast is made by one unseen —  
Who drinks first in this silent scene?”`,
    options: ["The one with the empty plate", "The one who did not speak", "The one seated last", "The one who poured the wine"],
    answer: "The one who did not speak",
    feedback: "A chair creaks. You are offered a glass, but it is already empty. You move on."
  },
  {
    text: `“Three books lie on velvet cloth:  
One is bound in silence, one in flame, one in frost.  
The Archivist sleeps with eyes wide shut —  
Which book reveals what others cut?”`,
    options: ["The book with no title", "The book that smells of citrus", "The book with a broken spine", "The book bound in velvet"],
    answer: "The book that smells of citrus",
    feedback: "The ink glows faintly. A passage appears. You follow it into the dark."
  },
  {
    text: `“The record spins but plays no tune.  
The needle rests beneath the moon.  
One guest hums what none recall —  
Which sound breaks silence in the hall?”`,
    options: ["A bell", "A heartbeat", "A lullaby", "A knock"],
    answer: "A lullaby",
    feedback: "The air softens. A door creaks open to a corridor of velvet hush."
  },
  {
    text: `“Petals bloom in candlelight,  
One wilts before the stroke of night.  
The flower that forgets its name —  
Which holds the key to end the game?”`,
    options: ["Rose", "Lily", "Forget-me-not", "Orchid"],
    answer: "Forget-me-not",
    feedback: "A breeze stirs the leaves. A hidden path reveals itself beneath the ivy."
  },
  {
    text: `“Ashes fall where secrets burn.  
A match is struck, the pipes return.  
One guest exhales a ghostly thread —  
What lingers long after words are said?”`,
    options: ["Smoke", "Regret", "Truth", "Silence"],
    answer: "Smoke",
    feedback: "The smoke curls into a symbol. You follow it through the panelled wall."
  },
  {
    text: `“Bottles line the wall in rows,  
Some are sealed, some no one knows.  
One is marked with wax and thread —  
Which vintage wakes the sleeping dead?”`,
    options: ["1888", "The unlabeled one", "The broken cork", "The one with dust"],
    answer: "The unlabeled one",
    feedback: "The bottle tips. A stairwell descends into shadow."
  },
  {
    text: `“Footsteps echo, none reply.  
A bell is rung, but no one’s nigh.  
The tray is set, the tea gone cold —  
Who answers when the bell is tolled?”`,
    options: ["The butler", "The unseen", "The host", "The guest who left"],
    answer: "The unseen",
    feedback: "A whisper brushes your ear. The corridor bends left, then vanishes."
  },
  {
    text: `“Reflections lie, but only once.  
One mirror shows what came undone.  
Another shows what might have been —  
Which mirror hides the truth within?”`,
    options: ["The cracked one", "The fogged one", "The gilded one", "The one that shows nothing"],
    answer: "The one that shows nothing",
    feedback: "Your reflection fades. You step through the glass."
  },
  {
    text: `“Ten steps taken, one remains.  
The key is not in locks or chains.  
The guest who never asked to stay —  
What did they whisper to end the play?”`,
    options: ["I remember.", "Forgive me.", "It was me.", "Thank you."],
    answer: "It was me.",
    feedback: "The door opens. The veil lifts. The final puzzle awaits."
  }
];

let currentStep = 0;
let guestCode = "";
let lockouts = JSON.parse(localStorage.getItem("lockouts") || "{}");

function validateCode() {
  guestCode = document.getElementById("codeInput").value.trim();
  const gateMessage = document.getElementById("gateMessage");

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

// ✅ Attach validateCode safely after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("submitCode");
  if (button) button.addEventListener("click", validateCode);
});
