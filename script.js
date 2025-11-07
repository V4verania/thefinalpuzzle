console.log("Sending to server:", JSON.stringify({ code: guestCode }));

const riddles = [
  {
    text: `🕵️‍♀️ The Sunday Alibi  
A man is found murdered on a Sunday morning.  
The Maid says she was collecting the morning mail.  
Who did it, and how did they know?`,
    keywords: ["mail", "post", "postal"],
    feedback: "Correct. There’s no mail on Sundays — the maid’s alibi gave her away."
  },
  {
    text: `🧊 The Poisoned Drinks  
Two rivals drink iced tea.  
The man gulps his quickly and survives.  
The woman sips hers slowly and dies.  
How did the man survive?`,
    keywords: ["ice", "ice cubes", "frozen"],
    feedback: "Correct. The poison was in the ice — it melted into her drink, not his."
  },
  {
    text: `🗺️ What Am I?  
I have cities, but no houses.  
I have mountains, but no trees.  
I have water, but no fish.  
What am I?`,
    keywords: ["map"],
    feedback: "Correct. A map shows features without containing them."
  },
  {
    text: `⚰️ The Object  
The person who makes it has no need of it.  
The person who buys it has no use for it.  
The person who uses it can neither see nor feel it.  
What is it?`,
    keywords: ["coffin", "casket"],
    feedback: "Correct. A coffin is made for the dead — unseen, unfelt by its user."
  },
  {
    text: `🗣️ Belonging  
What belongs to you, but everyone else uses more than you do?`,
    keywords: ["name"],
    feedback: "Correct. Others speak your name far more than you do."
  },
  {
    text: `🌊 The Silent Runner  
What can run but never walks, has a mouth but never talks, has a head but never weeps, has a bed but never sleeps?`,
    keywords: ["river"],
    feedback: "Correct. A river fits all four clues perfectly."
  },
  {
    text: `💡 The Invisible Guest  
What can fill a room but takes up no space?`,
    keywords: ["light"],
    feedback: "Correct. Light fills space without occupying it."
  },
  {
    text: `💧 The Dangerous Companion  
Always in you, sometimes on you; if I surround you, I can kill you. What am I?`,
    keywords: ["water"],
    feedback: "Correct. Water is essential — but overwhelming, it becomes deadly."
  },
  {
    text: `🔥 The Hungry Touch  
I’m always hungry, I must always be fed. The finger I touch will soon turn red. What am I?`,
    keywords: ["fire"],
    feedback: "Correct. Fire consumes and burns — always hungry, always dangerous."
  },
  {
    text: `✉️ The Traveler  
What can travel around the world while staying in the same spot?`,
    keywords: ["stamp", "postage"],
    feedback: "Correct. A stamp travels far while remaining fixed to the envelope."
  },
  {
    text: `☁️ The Wingless Flyer  
I fly without wings, I cry without eyes. Wherever I go, darkness follows me. What am I?`,
    keywords: ["cloud"],
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

  // ✅ This fetch block must be inside validateCode()
  console.log("Sending to server:", JSON.stringify({ code: guestCode }));

  fetch("https://thefinalpuzzle-worker.thefinalpuzzle.workers.dev", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      invitationCode: guestCode
    })
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

