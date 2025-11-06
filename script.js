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
  }
  // Add more riddles here
];

let currentStep = 0;

async function validateCode() {
  const code = document.getElementById("codeInput").value;
  const gateMessage = document.getElementById("gateMessage");

  try {
    const res = await fetch("https://thefinalpuzzle-worker.thefinalpuzzle.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });

    const data = await res.json();

    if (data.valid && data.revealed) {
      document.getElementById("veil").classList.add("hidden");
      document.getElementById("maze").classList.remove("hidden");
      showRiddle();
    } else if (data.valid && !data.revealed) {
      gateMessage.textContent = "The veil stirs, but the time is not yet right.";
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
          document.getElementById("maze").classList.add("hidden");
          document.getElementById("reveal").classList.remove("hidden");
        }
      } else {
        feedback.textContent = "The veil shudders. That is not the path.";
      }
    };
    choicesDiv.appendChild(btn);
  });
}
