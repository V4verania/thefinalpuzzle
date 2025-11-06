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
