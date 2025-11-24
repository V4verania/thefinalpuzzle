// --- CONFIGURATION ---
const WORKER_URL = "https://thefinalpuzzle-worker.thefinalpuzzle.workers.dev";


// --- DATA: RIDDLES (From your original script) ---
const riddles = [
  {
    text: "The Sunday Alibi\n\nA man is found murdered on a Sunday morning. His wife immediately calls the police, who question the household staff:\n\n- The Butler says he was organizing the wine cellar.\n- The Cook says she was preparing breakfast.\n- The Gardener says he was watering the ferns.\n- The Maid says she was collecting the morning mail.\n\nThe police immediately arrest the murderer.\n\nWho did it?",
    keywords: ["maid", "the maid"],
    feedback: "Correct. There’s no mail on Sundays."
  },
  {
    text: "The Poisoned Drinks\n\nTwo rivals sit down for a drink. They both order iced tea from the same pitcher. One man drinks his glass very quickly and immediately orders another. The other woman sips her one glass slowly. The woman dies, but the man survives. It is determined that all the drinks were poisoned.\n\nHow did the man survive?",
    keywords: ["ice", "ice cubes", "the ice"],
    feedback: "Correct. The poison was in the ice — it melted into her drink, not his."
  },
  {
    text: "What Am I?\n\nI have cities, but no houses.\nI have mountains, but no trees.\nI have water, but no fish.\n\nWhat am I?",
    keywords: ["map", "a map", "the map"],
    feedback: "Correct. A map shows features without containing them."
  },
  {
    text: "The person who makes it has no need of it.\nThe person who buys it has no use for it.\nThe person who uses it can neither see nor feel it.\n\nWhat is it?",
    keywords: ["coffin", "casket", "a coffin", "a casket"],
    feedback: "Correct. A coffin is made for the dead — unseen, unfelt by its user."
  },
  {
    text: "What belongs to you, but everyone else uses more than you do?",
    keywords: ["name", "my name", "your name"],
    feedback: "Correct. Others speak your name far more than you do."
  },
  {
    text: "What can run but never walks, has a mouth but never talks, has a head but never weeps, has a bed but never sleeps?",
    keywords: ["river", "a river", "the river"],
    feedback: "Correct. A river fits all four clues perfectly."
  },
  {
    text: "What can fill a room but takes up no space?",
    keywords: ["light", "the light", "sunlight"],
    feedback: "Correct. Light fills space without occupying it."
  },
  {
    text: "Always in you, sometimes on you; if I surround you, I can kill you. What am I?",
    keywords: ["water", "the water"],
    feedback: "Correct. Water is essential — but overwhelming, it becomes deadly."
  },
  {
    text: "I’m always hungry, I must always be fed. The finger I touch will soon turn red. What am I?",
    keywords: ["fire", "a fire", "the fire"],
    feedback: "Correct. Fire consumes and burns — always hungry, always dangerous."
  },
  {
    text: "What can travel around the world while staying in the same spot?",
    keywords: ["stamp", "postage", "a stamp", "postage stamp"],
    feedback: "Correct. A stamp travels far while remaining fixed to the envelope."
  },
  {
    text: "I fly without wings, I cry without eyes. Wherever I go, darkness follows me. What am I?",
    keywords: ["cloud", "a cloud", "the cloud"],
    feedback: "Correct. A cloud drifts, weeps, and casts shadow — poetic and true."
  }
];

// --- STATE MANAGEMENT ---
let currentUser = null;
let currentCode = null;
let currentStep = 0;
let isTyping = false;
let gameActive = false;
let rsvpStage = false;

// --- AUDIO CONTROLLER ---
const audio = {
    ambient: document.getElementById('audio-ambient'),
    wrong: document.getElementById('audio-wrong'),
    whisper: document.getElementById('audio-whisper'),
    message: document.getElementById('audio-message')
};

function playSound(name) {
    try {
        if (audio[name]) {
            audio[name].currentTime = 0;
            audio[name].play().catch(e => console.log("Audio play blocked:", e));
        }
    } catch (e) { console.error("Audio error", e); }
}

// --- INIT ---
function initSystem() {
    const startScreen = document.getElementById('start-screen');
    const loginScreen = document.getElementById('login-screen');
    
    startScreen.style.opacity = '0';
    startScreen.style.transition = 'opacity 0.5s';
    
    setTimeout(() => {
        startScreen.style.display = 'none';
        loginScreen.classList.remove('hidden');
        document.getElementById('login-input').focus();
        audio.ambient.volume = 0.3;
        audio.ambient.play().catch(e => console.log("Ambient play failed", e));
    }, 500);
}

// --- SERVER COMMUNICATIONS ---
async function fetchLockout(code) {
    try {
        const res = await fetch(${WORKER_URL}?code=${code}&type=lockout);
        return await res.json();
    } catch (e) { console.error(e); return {}; }
}

async function fetchProgress(code) {
    try {
        const res = await fetch(${WORKER_URL}?code=${code}&type=progress);
        return await res.json();
    } catch (e) { console.error(e); return { step: 0 }; }
}

async function saveProgress(code, step) {
    try {
        await fetch(${WORKER_URL}?type=progress, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, step })
        });
    } catch (e) { console.error("Save progress failed", e); }
}

async function saveLockout(code, until) {
    try {
        await fetch(${WORKER_URL}?type=lockout, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, until })
        });
    } catch (e) { console.error("Save lockout failed", e); }
}

// --- LOGIN LOGIC ---
async function attemptLogin() {
    const input = document.getElementById('login-input');
    const msg = document.getElementById('login-message');
    const loader = document.getElementById('login-loader');
    const bar = document.getElementById('loader-bar');
    
    const code = input.value.trim();
    if (!code) return;

    msg.innerHTML = "<span class='text-green-400'>ESTABLISHING SECURE CONNECTION...</span>";
    input.disabled = true;
    
    try {
        // 1. Check Lockout
        const lockoutData = await fetchLockout(code);
        if (lockoutData.until && new Date(lockoutData.until) > new Date()) {
            throw new Error(LOCKED UNTIL ${new Date(lockoutData.until).toLocaleTimeString()});
        }

        // 2. Validate Code
        const response = await fetch(${WORKER_URL}/validate?code=${encodeURIComponent(code)});
        const data = await response.json();

        if (!data.valid) throw new Error("INVALID ACCESS CODE");

        // 3. Get Progress
        const progressData = await fetchProgress(code);
        currentStep = progressData.step || 0;
        
        // Success Setup
        currentUser = data.profile || { name: "Unknown Agent", title: "Guest" };
        currentCode = code;

        msg.innerHTML = <span class='text-green-400'>IDENTITY VERIFIED. WELCOME, ${currentUser.name.toUpperCase()}.</span>;
        msg.classList.remove('glow-text-red');
        msg.classList.add('glow-text');
        
        loader.style.display = 'block';
        void loader.offsetWidth; 
        bar.style.width = '100%';
        playSound('message');

        setTimeout(() => {
            document.getElementById('login-screen').style.opacity = '0';
            document.getElementById('login-screen').style.transition = 'opacity 1s';
            setTimeout(() => {
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('terminal-container').classList.remove('hidden');
                startGame(data.revealed);
            }, 1000);
        }, 2000);

    } catch (error) {
        console.error(error);
        msg.innerHTML = ERROR: ${error.message || "CONNECTION FAILED"};
        msg.classList.add('glow-text-red');
        
        const container = document.querySelector('#login-screen > div');
        container.classList.add('shake');
        playSound('wrong');
        input.disabled = false;

        setTimeout(() => {
            container.classList.remove('shake');
            input.value = "";
            input.focus();
        }, 500);
    }
}

// --- GAME LOOP ---
function startGame(isRevealed) {
    gameActive = true;
    document.getElementById('user-status').innerHTML = USER: <span class="text-green-300">${currentUser.name.toUpperCase()}</span>;
    document.getElementById('command-input').focus();
    
    let bootText = SYSTEM INITIALIZED.\nUSER: ${currentUser.name}\nTITLE: ${currentUser.title}\nRESTORING SESSION...\n;
    
    typeWriter(bootText, () => {
        setTimeout(() => {
            if (isRevealed || currentStep >= riddles.length) {
                triggerSuccess();
            } else {
                loadLevel(currentStep);
            }
        }, 500);
    });
}

function loadLevel(index) {
    if (index >= riddles.length) {
        saveProgress(currentCode, riddles.length);
        triggerSuccess();
        return;
    }
    
    currentStep = index;
    if(index > 0) playSound('whisper'); 
    
    const levelData = riddles[index];
    addLogEntry(\n--- ENCRYPTED FILE ${index + 1}/${riddles.length} ---\n, false, "text-green-600");
    addLogEntry(levelData.text, true);
}

function checkInput(input) {
    if (!gameActive || isTyping) return;
    const val = input.trim();

    if (rsvpStage) {
        handleRSVPInput(val);
    } else {
        handleRiddleAnswer(val);
    }
}

async function handleRiddleAnswer(input) {
    const currentRiddle = riddles[currentStep];
    addLogEntry(> ${input}, false, 'text-gray-500');

    // Keyword Matching Logic (Regex generation for flexibility)
    // Escape special regex chars just in case, though simple keywords are usually safe
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Check if ANY keyword matches the input (case insensitive)
    const matched = currentRiddle.keywords.some(keyword => {
        // Create a regex that looks for the keyword
        // We check if the input contains the keyword, or is the keyword.
        // The raw script used "includes", so we mirror that leniency but normalise case.
        return input.toLowerCase().includes(keyword.toLowerCase());
    });

    if (matched) {
        // CORRECT
        playSound('message');
        addLogEntry(>> ${currentRiddle.feedback}, false, "text-green-300 font-bold mb-2");
        addLogEntry(">> UPDATING SERVER PROGRESS...", false, "text-xs text-green-800");
        
        // Save to server
        await saveProgress(currentCode, currentStep + 1);
        
        setTimeout(() => {
            loadLevel(currentStep + 1);
        }, 1500);

    } else {
        // INCORRECT
        playSound('wrong');
        const term = document.getElementById('terminal-container');
        const inp = document.getElementById('command-input');
        
        term.classList.add('shake');
        inp.value = "";
        inp.placeholder = "ACCESS DENIED";
        inp.classList.add('placeholder-red-500');
        
        addLogEntry(">> ERROR: INCORRECT RESPONSE. SYSTEM LOCK WARNING.", false, "text-red-500 font-bold");

        // Send Lockout to server (2 hours)
        const lockoutDate = new Date();
        lockoutDate.setHours(lockoutDate.getHours() + 2);
        // Note: In a real game you might want to await this, 
        // but for UI responsiveness we fire and forget or handle quietly.
        // We won't kick them out immediately to keep the flow fluid, just warn them.
        // await saveLockout(currentCode, lockoutDate.toISOString()); 

        setTimeout(() => {
            term.classList.remove('shake');
            inp.placeholder = "Awaiting input...";
            inp.classList.remove('placeholder-red-500');
            inp.focus();
        }, 500);
    }
}

// --- FINAL REVEAL & RSVP ---
async function triggerSuccess() {
    gameActive = true;
    rsvpStage = true;
    playSound('message');
    
    // Fetch RSVP status to see if they already did it
    let alreadyRSVPd = false;
    try {
        const rsvpRes = await fetch(${WORKER_URL}?code=${currentCode}&type=rsvp);
        const rsvpData = await rsvpRes.json();
        if (rsvpData.confirmed) alreadyRSVPd = true;
    } catch (e) {}

    const revealDate = new Date("2025-10-01T00:00:00"); // From your raw script
    const now = new Date();
    const daysLeft = Math.max(0, Math.ceil((revealDate - now) / (1000 * 60 * 60 * 24)));
    
    let htmlContent = `
        <div class="dossier-card">
            <h3 class="text-xl font-bold text-green-400 border-b border-green-800 pb-2 mb-2">ACCESS GRANTED: INNER SANCTUM</h3>
            <p>You have solved the maze. You have mastered the riddles.</p>
            <p>You are invited to an evening of secrets, symbols, and shadows.</p>
            <br>
            <p><strong class="text-green-600">LOCATION:</strong> The Dene of Whispers (Number 40)</p>
            <p><strong class="text-green-600">DATE:</strong> Saturday, 16th May 2026</p>
            <p><strong class="text-green-600">TIME:</strong> 7:30 PM</p>
    `;

    if (now < revealDate) {
        htmlContent += `
            <div class="mt-4 p-2 border border-amber-600 bg-amber-900/20">
                <p class="text-amber-500">⚠ FULL DOSSIER ENCRYPTED</p>
                <p class="text-sm">Time lock active. Decryption available in: <strong>${daysLeft} DAYS</strong></p>
            </div>
        `;
    } else {
        htmlContent += `
            <div class="mt-4 border-l-2 border-green-600 pl-4">
                <p class="text-amber-400 font-bold">ASSIGNED ROLE: ${currentUser.title}</p>
                <p class="text-sm italic">${currentUser.name}</p>
                <p class="text-sm mt-2">${currentUser.description}</p>
                <p class="text-sm mt-2"><strong>Costume:</strong> ${currentUser.costume}</p>
            </div>
        `;
    }

    htmlContent += </div>; // Close card

    // RSVP Instructions
    if (alreadyRSVPd) {
        htmlContent += `
            <div class="mt-6 text-center">
                <p class="text-green-300">✅ RSVP CONFIRMED. WE AWAIT YOUR ARRIVAL.</p>
                <!-- Use a placeholder or your real image if hosted -->
                <div class="mt-4 border-2 border-white inline-block p-2">
                    <p class="text-xs mb-1">JOIN THE CIRCLE</p>
                     <!-- Uncomment if you host the image -->
                    <!-- <img src="innercircle.png" alt="QR Code" style="width: 100px; height: 100px;"> -->
                    <div style="width: 100px; height: 100px; background: white;" class="mx-auto"></div>
                </div>
            </div>
        `;
        document.getElementById('command-input').disabled = true;
        document.getElementById('command-input').placeholder = "CONNECTION TERMINATED";
    } else {
        htmlContent += `
            <div class="mt-6">
                <p class="text-green-300 animate-pulse">>> INVITATION PENDING RESPONSE.</p>
                <p>>> TO CONFIRM, TYPE "CONFIRM" FOLLOWED BY DIETARY NOTES.</p>
                <p class="text-gray-500 text-xs">(Example: "CONFIRM Vegetarian")</p>
            </div>
        `;
        document.getElementById('command-input').placeholder = "Type CONFIRM [DIETARY]...";
    }

    addLogEntry("\n--- DECRYPTION SUCCESSFUL ---\n", false);
    
    // Append HTML safely
    const log = document.getElementById('output-log');
    const entry = document.createElement('div');
    entry.innerHTML = htmlContent;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

async function handleRSVPInput(input) {
    addLogEntry(> ${input}, false, 'text-gray-500');
    
    const confirmRegex = /^confirm/i;

    if (confirmRegex.test(input)) {
        let dietary = input.replace(confirmRegex, "").trim();
        if (dietary === "") dietary = "None";
        
        addLogEntry(">> TRANSMITTING RSVP DATA...", false, "text-green-600 animate-pulse");
        document.getElementById('command-input').disabled = true;

        try {
            await fetch(${WORKER_URL}?type=rsvp, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: currentCode, confirmed: true, dietary })
            });
            
            playSound('message');
            const successMsg = `
            \n>> RSVP ACKNOWLEDGED.
            \n>> DIETARY: ${dietary.toUpperCase()}
            \n>> YOU HAVE JOINED THE CIRCLE.
            \n
            \nTERMINATING CONNECTION...
            `;
            
            typeWriter(successMsg, null);

        } catch (err) {
            console.error(err);
            addLogEntry(">> ERROR: TRANSMISSION FAILED.", false, "text-red-500");
            document.getElementById('command-input').disabled = false;
        }
        
    } else {
        addLogEntry(">> INVALID COMMAND. TYPE 'CONFIRM' TO ACCEPT.", false, "text-amber-500");
    }
}

// --- UTILS ---
function addLogEntry(text, animated = false, className = "") {
    const log = document.getElementById('output-log');
    const entry = document.createElement('div');
    entry.className = whitespace-pre-wrap ${className};
    log.appendChild(entry);

    if (animated) {
        typeWriterEffect(entry, text);
    } else {
        entry.textContent = text;
        log.scrollTop = log.scrollHeight;
    }
}

function typeWriter(text, callback) {
    addLogEntry(text, true);
    const delay = text.length * 20; 
    if(callback) setTimeout(callback, delay + 500);
}

function typeWriterEffect(element, text, speed = 15) {
    isTyping = true;
    let i = 0;
    element.classList.add('cursor');
    document.getElementById('command-input').disabled = true;

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            const log = document.getElementById('output-log');
            log.scrollTop = log.scrollHeight;
            setTimeout(type, speed);
        } else {
            element.classList.remove('cursor');
            isTyping = false;
            if (!document.getElementById('command-input').placeholder.includes('TERMINATED')) {
                document.getElementById('command-input').disabled = false;
                document.getElementById('command-input').focus();
            }
        }
    }
    type();
}

// --- EVENT LISTENERS ---
document.getElementById('login-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') attemptLogin();
});

document.getElementById('command-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const val = this.value;
        if (val) {
            this.value = '';
            checkInput(val);
        }
    }
});

setInterval(() => {
    const now = new Date();
    document.getElementById('system-clock').textContent = now.toLocaleTimeString('en-US', {hour12: false});
}, 1000);

document.addEventListener('click', () => {
    const loginScreen = document.getElementById('login-screen');
    const terminal = document.getElementById('terminal-container');
    
    if (!loginScreen.classList.contains('hidden') && !loginScreen.style.opacity) {
        document.getElementById('login-input').focus();
    } else if (!terminal.classList.contains('hidden') && gameActive && !isTyping) {
        document.getElementById('command-input').focus();
    }
});