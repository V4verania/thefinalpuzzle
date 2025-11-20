const WORKER_URL = "https://thefinalpuzzle-worker.thefinalpuzzle.workers.dev";
let guestCode = "";
let currentStep = 0;
const riddles = [
  {
    text: `<strong>The Sunday Alibi</strong> \n  
A man is found murdered on a Sunday morning. His wife immediately calls the police, who question the household staff:\n
- The Butler says he was organizing the wine cellar.\n
- The Cook says she was preparing breakfast.\n
- The Gardener says he was watering the ferns.\n
- The Maid says she was collecting the morning mail.\n
The police immediately arrest the murderer.\n
<strong>Who did it</strong>`,
    keywords: ["maid", "the maid"],
    feedback: "Correct. There’s no mail on Sundays"
  },
  {
    text: `<strong>The Poisoned Drinks</strong> \n  
Two rivals sit down for a drink. They both order iced tea from the same pitcher. One man drinks his glass very quickly and 
  immediately orders another. The other woman sips her one glass slowly. The woman dies, but the man survives. It is determined that all the drinks were poisoned. \n
    How did the man survive?`,

    keywords: ["ice", "ice cubes"],
    feedback: "Correct. The poison was in the ice — it melted into her drink, not his."
  },
  {
    text: `What Am I?  
I have cities, but no houses.  \n
I have mountains, but no trees.  \n
I have water, but no fish.  \n
What am I?`,
    keywords: ["map"],
    feedback: "Correct. A map shows features without containing them."
  },
  {
    text: `The person who makes it has no need of it.  \n
The person who buys it has no use for it.  \n
The person who uses it can neither see nor feel it.  \n
<strong>What is it?</strong>`,
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
    text: `I fly without wings, I cry without eyes. Wherever I go, darkness follows me. \n <strong>What am I?</strong>`,
    keywords: ["cloud", "A cloud"],
    feedback: "Correct. A cloud drifts, weeps, and casts shadow — poetic and true."
  }
];

async function getLockout(code) {
  const res = await fetch(`${WORKER_URL}?code=${code}&type=lockout`);
  return await res.json();
}

async function getProgress(code) {
  const res = await fetch(`${WORKER_URL}?code=${code}&type=progress`);
  return await res.json();
}

async function saveLockout(code, until) {
  await fetch(`${WORKER_URL}?type=lockout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, until })
  });
}

async function saveProgress(code, step) {
  await fetch(`${WORKER_URL}?type=progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, step })
  });
}

async function validateCode() {
  guestCode = document.getElementById("codeInput").value.trim();
  document.getElementById("codeInput").value = "";
  const gateMessage = document.getElementById("gateMessage");

  if (!guestCode) {
    gateMessage.textContent = "❌ Please enter a code.";
    return;
  }

  // Check lockout
  const lockoutRes = await fetch(`${WORKER_URL}?code=${guestCode}&type=lockout`);
  const lockoutData = await lockoutRes.json();
  if (lockoutData.until && new Date(lockoutData.until) > new Date()) {
    gateMessage.textContent = `⛔ The veil is sealed. Return after ${new Date(lockoutData.until).toLocaleString()}`;
    gateMessage.classList.add("fade");
    return;
  }

  // Retrieve progress
  const progressRes = await fetch(`${WORKER_URL}?code=${guestCode}&type=progress`);
  const progressData = await progressRes.json();
  currentStep = progressData.step || 0;

  // Validate code and check reveal
  const statusRes = await fetch(`${WORKER_URL}/validate?code=${guestCode}`);
  const status = await statusRes.json();

  if (!status.valid) {
    gateMessage.textContent = "❌ The veil does not recognize you.";
    return;
  }

  if (status.revealed) {
    showFinalReveal();
  } else {
    document.getElementById("veil").classList.add("hidden");
    document.getElementById("maze").classList.remove("hidden");
    document.getElementById("ambientAudio").play().catch(() => {});
    showRiddle();
  }
}
function showRiddle() {
  if (currentStep >= riddles.length) {
    document.getElementById("maze").classList.add("hidden");
    document.getElementById("reveal").classList.remove("hidden");
    showFinalReveal();
    return;
  }
  
  const riddle = riddles[currentStep];
  const riddleText = document.getElementById("riddleText");
  const choicesDiv = document.getElementById("choices");
  const feedback = document.getElementById("feedback");

  riddleText.innerHTML = riddle.text.replace(/\n/g, "<br>");
  feedback.textContent = "";
choicesDiv.innerHTML = `
  <input type="text" id="riddleInput" placeholder="Type your answer..." />
  <button id="submitRiddle">Submit</button>
`;

const riddleInput = document.getElementById("riddleInput");
const submitButton = document.getElementById("submitRiddle");

riddleInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    submitButton.click();
  }
});


  document.getElementById("submitRiddle").onclick = async () => {
    const rawInput = document.getElementById("riddleInput").value.trim().toLowerCase();
    const normalizedInput = rawInput.replace(/[^a-z0-9 ]+/g, " ");
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
      await saveProgress(guestCode, currentStep);

      if (currentStep < riddles.length) {
        setTimeout(showRiddle, 4500);
      } else {
        await saveProgress(guestCode, riddles.length);
        document.getElementById("maze").classList.add("hidden");
        document.getElementById("reveal").classList.remove("hidden");
        showFinalReveal();
      }
    } else {
      const wrongAudio = document.getElementById("wrongAnswerAudio");
      if (wrongAudio) {
        wrongAudio.currentTime = 0;
        wrongAudio.play().catch(() => {});
      }

      const dimOverlay = document.getElementById("dimOverlay");
      dimOverlay.classList.remove("hidden");
      dimOverlay.classList.add("active");

      const ripple = document.getElementById("rippleEffect");
      ripple.classList.remove("hidden");
      ripple.classList.add("active");

      setTimeout(() => {
        ripple.classList.remove("active");
        ripple.classList.add("hidden");
      }, 1000);

      setTimeout(() => {
        dimOverlay.classList.remove("active");
        dimOverlay.classList.add("hidden");
      }, 1200);

      const lockoutDate = new Date();
      lockoutDate.setHours(lockoutDate.getHours() + 2);
      await saveLockout(guestCode, lockoutDate.toISOString());

      feedback.textContent = `🕯️ The veil shudders. That is not the path. Return in 2 hours.`;
      feedback.classList.add("fade");
      choicesDiv.innerHTML = "";
    }
  };
}

async function showFinalReveal() {
  const revealDiv = document.getElementById("revealContent");
  document.getElementById("reveal").classList.remove("hidden");
  revealDiv.classList.remove("hidden");

  const now = new Date();
  const revealDate = new Date("2025-10-01T00:00:00");

  const daysLeft = Math.max(0, Math.ceil((revealDate - now) / (1000 * 60 * 60 * 24)));
  const percent = Math.min(
    100,
    Math.floor(
      (1 - (revealDate - now) / (revealDate - new Date("2025-11-01T00:00:00"))) * 100
    )
  );

  let html = "";

  const rsvpRes = await fetch(`${WORKER_URL}?code=${guestCode}&type=rsvp`);
  const rsvpData = await rsvpRes.json();
  const alreadyRSVPd = rsvpData.confirmed === true;

  if (alreadyRSVPd) {
    html += `<p class="fade">✅ Thank you. You have already submitted your RSVP.</p>`;
  } else {
    html += `
      <form id="rsvpForm" class="fade">
        <label for="dietInput">Any dietary requirements?</label>
        <input id="dietInput" type="text" placeholder="e.g. vegetarian, gluten-free" />
        <button id="rsvpButton">Confirm RSVP</button>
        <p id="rsvpMessage" aria-live="polite"></p>
      </form>
    `;
  }

  html += `
    <div class="fade" style="margin-top: 2em;">
      <p>Join the circle:</p>
      <img src="innercircle.png" alt="Join WhatsApp group QR code" style="margin-top: 0.5em; width: 150px; height: 150px;" />
    </div>
  `;

  html += `
    <h2 class="fade">You have reached the inner sanctum.</h2>
    <p class="fade">You have solved the maze. You have mastered the riddles. You have earned your place. Now, the door opens.</p>
    <p class="fade">You are invited to an evening of secrets, symbols, and shadows at:</p>
    <p class="fade"><strong>The Dene of Whispers</strong></p>
    <p class="fade">Number 40, you know the place</p>
    <p class="fade">Saturday the 16th of May 2026</p>
    <p class="fade"><strong>7.30PM</strong></p>
    <p class="fade">RSVP and follow the QR code.</p>
    <p class="fade">Your host Elena awaits your company. The Whispering Archivist will speak.</p>
  `;

  if (now < revealDate) {
    html += `<p class="fade">The flame will reveal more instructions in <strong>${daysLeft} days</strong>. Return then...</p>`;
  } else {
    html += `<p class="fade"><strong>🔥 The flame has spoken. Your role is now revealed.</strong></p>`;
  }

  html += `
    <div id="candleContainer" class="fade">
      <div id="candleFlame"></div>
      <div id="candleMeter">
        <div id="candleFill" style="width:${percent}%"></div>
      </div>
    </div>
  `;

if (
  rsvpData.dossier &&
  rsvpData.description &&
  rsvpData.name &&
  rsvpData.realName &&
  rsvpData.costume &&
  now >= revealDate
) {
  html += `
    <div class="fade dossier">
      <h3>Your Role: <strong>${rsvpData.dossier}</strong></h3>
      <p><em>${rsvpData.name} <span style="opacity: 0.6;">(played by ${rsvpData.realName})</span></em></p>
      <p>${rsvpData.description}</p>
      <p><strong>Suggested Costume:</strong> ${rsvpData.costume}</p>
    </div>
  `;
}
  revealDiv.innerHTML = html;

  // RSVP logic
  setTimeout(() => {
    const rsvpBtn = document.getElementById("rsvpButton");
    const ripple = document.getElementById("rippleEffect");

    if (rsvpBtn) {
      rsvpBtn.onclick = async (e) => {
        e.preventDefault();
        ripple.classList.add("active");
        setTimeout(() => ripple.classList.remove("active"), 1000);

        const dietary = document.getElementById("dietInput").value.trim();

        const res = await fetch(`${WORKER_URL}?type=rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: guestCode, confirmed: true, dietary })
        });

        const result = await res.json();
        const message = document.getElementById("rsvpMessage");
        message.textContent = result.success
          ? "✅ RSVP confirmed. Elena has received your instructions. You will be summoned."
          : "⚠️ RSVP failed. The veil resisted. Try again or speak with the Archivist.";

        if (result.success) {
          rsvpBtn.disabled = true;
          rsvpBtn.textContent = "Whisper received";
          document.getElementById("rsvpForm").style.display = "none";
        }
      };
    }
  }, 0); // closes setTimeout
} // closes showFinalReveal


document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const button = document.getElementById("submitCode");
    const codeInput = document.getElementById("codeInput");

    if (button) {
      button.addEventListener("click", validateCode);
    }

    if (codeInput && button) {
      codeInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          button.click();
        }
      });
    }
  }, 0);
});

  const muteToggle = document.getElementById("muteToggle");
  const ambientAudio = document.getElementById("ambientAudio");

  if (muteToggle && ambientAudio) {
    muteToggle.addEventListener("click", () => {
      ambientAudio.muted = !ambientAudio.muted;
      muteToggle.textContent = ambientAudio.muted ? "🔇" : "🔊";
    });
  }
});

