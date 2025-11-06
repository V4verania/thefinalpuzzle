const riddles = [/* your 10 riddles here — unchanged */];

let currentStep = 0;
let guestCode = "";
let lockouts = JSON.parse(localStorage.getItem("lockouts") || "{}");

async function validateCode() {
  guestCode = document.getElementById("codeInput").value.trim();
  const gateMessage = document.getElementById("gateMessage");

  const lockoutUntil = lockouts[guestCode];
  if (lockoutUntil && new Date() < new Date(lockoutUntil)) {
    gateMessage.textContent = `The veil is sealed. Return after ${new Date(lockoutUntil).toLocaleDateString()}.`;
    return;
  }

  try {
    const res = await fetch("https://thefinalpuzzle-worker.thefinalpuzzle.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: guestCode })
    });

    const data = await res.json();

    if (data.valid) {
      document.getElementById("veil").classList.add("hidden");
      document.getElementById("maze").classList.remove("hidden");
      showRiddle();
    } else {
      gateMessage.textContent = "The veil does not recognize you.";
    }
  } catch (err) {
    gateMessage.textContent = "The ritual failed. Try again.";
  }
}

function showRiddle() {
  const riddle = riddles[currentStep];
  document.getElementById("riddleText").textContent = riddle.text;
  const choicesDiv = document.getElementById("choices");
  const feedback = document.getElementById("feedback");
  feedback.textContent = "";
  choicesDiv.innerHTML = "";

  riddle.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.onclick = () => {
      if (option === riddle.answer) {
        feedback.textContent = riddle.feedback;
        currentStep++;
        if (currentStep < riddles.length) {
          setTimeout(showRiddle, 2000);
        } else {
          showFinalReveal();
        }
      } else {
        const lockoutDate = new Date();
        lockoutDate.setDate(lockoutDate.getDate() + 2);
        lockouts[guestCode] = lockoutDate.toISOString();
        localStorage.setItem("lockouts", JSON.stringify(lockouts));
        feedback.textContent = `The veil shudders. That is not the path. Return in 2 days.`;
        document.getElementById("choices").innerHTML = "";
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
      <h2>You have reached the inner sanctum.</h2>
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
      <h2>Your character dossier is ready.</h2>
      <p class="fade">The veil parts. Your role awaits...</p>
      <p class="fade">Code: <strong>${guestCode}</strong></p>
      <!-- TODO: Load dossier based on code -->
    `;
  }
}
