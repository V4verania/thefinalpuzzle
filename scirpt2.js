const WORKER_URL = "https://thefinalpuzzle-worker.thefinalpuzzle.workers.dev";

        const validCodes = [
            "WHISPER-CM-4721", "VEIL-KB-8390", "SIGIL-VC-2204", "FLAME-JV-1057",
            "ECHO-CE-5913", "SHADE-LP-7642", "RIDDLE-DC-3885", "SHADOW-SH-9176",
            "ARCHIVE-RM-6430", "CIPHER-HD-2789", "KEY-ME-8301", "MASK-GUEST-0000", "thetest"
        ];

        const dossierMap = {
            "WHISPER-CM-4721": { title: "The Innocent Victim", name: "Lena Brookwood", description: "The Daughter In Law - Defensive, wounded, quietly intense. Avoids eye contact, speaks in fragments.", costume: "Soft-toned dress or blouse/skirt combo, shawl. Prop: travel clutch or silk scarf." },
            "VEIL-KB-8390": { title: "The Lawyer", name: "Isobel Crane", description: "Corporate lawyer - persuasive, calculating, loud and known for buying inconvenient truths.", costume: "Tailored navy or charcoal suit, silk blouse, structured handbag. Prop: slim leather-bound notebook or fountain pen." },
            "SIGIL-VC-2204": { title: "The Shrewd Detective", name: "Evelyn Shaw", description: "Detective - Observant, skeptical, emotionally restrained. Asks sharp questions, rarely reveals her own hand.", costume: "Dark pantsuit or trench over fitted layers. Prop: vintage-style notebook or magnifying glass pendant." },
            "FLAME-JV-1057": { title: "The Red Herring", name: "Theo Marchand", description: "Cryptography Friend - Thoughtful, nostalgic, slightly paranoid. Speaks in metaphors, often references past puzzles.", costume: "Vintage-inspired suit (tweed or velvet), patterned tie. Prop: cipher wheel or antique puzzle box." },
            "ECHO-CE-5913": { title: "The Rebel", name: "Naomi Vexler", description: "Journalist - Curious, assertive, emotionally driven. Asks direct questions, interrupts when passionate.", costume: "Fitted dress or blouse with tailored jacket. Prop: press badge or leather-bound reporter’s notebook." },
            "SHADE-LP-7642": { title: "The Secret Keeper", name: "Maria Alvarez", description: "The Maid - Nervous, observant, loyal. Speaks softly, often hesitates before revealing anything.", costume: "Black cocktail dress with white cuffs or collar. Prop: feather duster or folded linen napkin." },
            "RIDDLE-DC-3885": { title: "The Accountant", name: "Colin Drexler", description: "Finance Manager - Polished, diplomatic, secretive. Always composed, but chooses words with surgical care.", costume: "Crisp suit, silk tie, polished shoes. Prop: gold pen or minimalist ledger." },
            "SHADOW-SH-9176": { title: "The Retired Tycoon", name: "Victor Harlan", description: "AI Associate - Rational, ambitious, emotionally detached. Frames everything in terms of logic and outcomes.", costume: "Sleek monochrome tailored ensemble, minimalist styling. Prop: tablet case or stylized business card holder. Optional: wireframe glasses." },
            "ARCHIVE-RM-6430": { title: "The Fallen Healer", name: "Dr. Felix Ward", description: "Private doctor - Calm, clinical, evasive. Speaks with authority but avoids emotional topics.", costume: "Three-piece suit in muted tones, crisp shirt. Prop: elegant pen or leather-bound appointment book." },
            "CIPHER-HD-2789": { title: "The Socialite influencer", name: "Celeste Marlowe", description: "Charming, performative, calculating. Plays innocent but enjoys stirring drama and watching reactions.", costume: "Jewel-toned cocktail dress, heels, dramatic earrings. Prop: compact mirror or satin gloves." },
            "KEY-ME-8301": { title: "The Eraser", name: "Mark Ellison", description: "A quiet Tech Consultant, systems-minded, once erased a digital trail no one could recover.", costume: "Full black-tie: tuxedo or tailored black suit, bow tie. Prop: encrypted USB or sleek cufflink box" },
            "MASK-GUEST-0000": { title: "Gareth Linwood", name: "The dreaded Ex-Employee", description: "Bitter, clever, attention-seeking. Uses sarcasm and deflection to mask resentment.", costume: "Black dress shirt, slim blazer, dark trousers. Prop: pocket watch or folded blueprint." },
            "thetest": { title: "The Ghost in the system", name: "Unknown Agent", description: "System Administrator Access", costume: "Classified." }
        };

        const levels = [
            { id: 1, text: "Decrypting File 1...\n\nI speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", answer: "echo" },
            { id: 2, text: "Security Level 1 Cleared.\n\nDecrypting Next Layer...\n\nThe more you take, the more you leave behind. What am I?", answer: "footsteps" },
            { id: 3, text: "Firewall Detected.\n\nOverride Sequence Initiated.\n\nI have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", answer: "map" }
        ];

        // --- STATE MANAGEMENT ---
        let currentUser = null;
        let currentLevelIndex = 0;
        let isTyping = false;
        let gameActive = false;
        let rsvpStage = false;

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

        // --- SYSTEM INIT ---
        function initSystem() {
            const startScreen = document.getElementById('start-screen');
            startScreen.style.opacity = '0';
            startScreen.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                startScreen.style.display = 'none';
                document.getElementById('login-screen').classList.remove('hidden');
                document.getElementById('login-input').focus();
                audio.ambient.volume = 0.3;
                audio.ambient.play().catch(e => console.log("Ambient play failed", e));
            }, 500);
        }

        // --- LOGIN LOGIC (Replaces Worker /validate) ---
        function attemptLogin() {
            const input = document.getElementById('login-input');
            const msg = document.getElementById('login-message');
            const loader = document.getElementById('login-loader');
            const bar = document.getElementById('loader-bar');
            
            // Normalize Code
            const code = input.value.trim(); 
            
            // Check if code exists in validCodes (Case sensitive usually, but let's be lenient)
            const exactMatch = validCodes.find(c => c.toLowerCase() === code.toLowerCase());

            if (exactMatch) {
                // Auth Success
                currentUser = dossierMap[exactMatch] || { name: "Unknown Agent", title: "Guest", description: "No Data" };
                
                msg.innerHTML = <span class='text-green-400'>BIOMETRIC SCAN COMPLETE. WELCOME, ${currentUser.name.toUpperCase()}.</span>;
                msg.classList.remove('glow-text-red');
                msg.classList.add('glow-text');
                input.disabled = true;
                
                loader.style.display = 'block';
                void loader.offsetWidth; // Trigger reflow
                bar.style.width = '100%';
                playSound('message');

                setTimeout(() => {
                    document.getElementById('login-screen').style.opacity = '0';
                    document.getElementById('login-screen').style.transition = 'opacity 1s';
                    setTimeout(() => {
                        document.getElementById('login-screen').style.display = 'none';
                        document.getElementById('terminal-container').classList.remove('hidden');
                        startGame();
                    }, 1000);
                }, 2000);

            } else {
                // Auth Fail
                msg.innerHTML = "ERROR: INVALID ACCESS CODE";
                msg.classList.add('glow-text-red');
                document.querySelector('#login-screen > div').classList.add('shake');
                playSound('wrong');

                setTimeout(() => {
                    document.querySelector('#login-screen > div').classList.remove('shake');
                    input.value = "";
                    input.focus();
                }, 500);
            }
        }

        // --- GAME LOGIC ---
        function startGame() {
            gameActive = true;
            document.getElementById('user-status').innerHTML = USER: <span class="text-green-300">${currentUser.name.toUpperCase()}</span>;
            document.getElementById('command-input').focus();
            
            typeWriter(SYSTEM INITIALIZED.\nUSER RECOGNIZED: ${currentUser.name}\nTITLE: ${currentUser.title}\nLOADING ENCRYPTED PROTOCOLS...\n, () => {
                setTimeout(() => { loadLevel(0); }, 500);
            });
        }

        function loadLevel(index) {
            if (index >= levels.length) {
                triggerSuccess();
                return;
            }
            currentLevelIndex = index;
            if(index > 0) playSound('whisper'); 
            addLogEntry(levels[index].text, true);
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

        function handleRiddleAnswer(input) {
            const currentAnswer = levels[currentLevelIndex].answer.toLowerCase();
            addLogEntry(> ${input}, false, 'text-gray-500');

            if (input.toLowerCase() === currentAnswer) {
                playSound('message');
                addLogEntry(">> ANSWER VERIFIED. DECRYPTING...", false, "text-green-300 font-bold mb-4");
                setTimeout(() => { loadLevel(currentLevelIndex + 1); }, 1000);
            } else {
                playSound('wrong');
                const term = document.getElementById('terminal-container');
                const inp = document.getElementById('command-input');
                term.classList.add('shake');
                inp.value = "";
                inp.placeholder = "ACCESS DENIED";
                inp.classList.add('placeholder-red-500');
                addLogEntry(">> ERROR: INCORRECT RESPONSE.", false, "text-red-500 font-bold");
                setTimeout(() => {
                    term.classList.remove('shake');
                    inp.placeholder = "Awaiting input...";
                    inp.classList.remove('placeholder-red-500');
                    inp.focus();
                }, 500);
            }
        }

        // --- SUCCESS / DOSSIER / RSVP ---
        function triggerSuccess() {
            // Instead of ending game, we enter RSVP Stage
            gameActive = true; 
            rsvpStage = true; 
            playSound('message');

            // Construct Dossier Display
            const dossierHTML = `
                <div class="dossier-card">
                    <h3 class="text-xl font-bold text-green-400 border-b border-green-800 pb-2 mb-2">CLASSIFIED DOSSIER: ${currentUser.title.toUpperCase()}</h3>
                    <p><strong class="text-green-600">TARGET:</strong> ${currentUser.name}</p>
                    <p><strong class="text-green-600">PROFILE:</strong> ${currentUser.description}</p>
                    <div class="mt-4 border-l-2 border-green-600 pl-4">
                        <p class="text-amber-400 font-bold">REQUIRED ATTIRE PROTOCOL:</p>
                        <p class="italic text-sm">${currentUser.costume}</p>
                    </div>
                </div>
                <div class="mt-6">
                    <p class="text-green-300 animate-pulse">>> INVITATION DECRYPTED.</p>
                    <p>>> TO CONFIRM ATTENDANCE, TYPE "CONFIRM" FOLLOWED BY DIETARY RESTRICTIONS (OR "NONE").</p>
                    <p class="text-gray-500 text-xs">(Example: "CONFIRM Vegan" or just "CONFIRM")</p>
                </div>
            `;

            // We use a slight hack to inject HTML via typeWriter's callback, or just append directly
            addLogEntry("\n--- FINAL DECRYPTION COMPLETE ---\n", false);
            
            const log = document.getElementById('output-log');
            const entry = document.createElement('div');
            entry.innerHTML = dossierHTML;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;

            // Reset input for RSVP
            document.getElementById('command-input').placeholder = "Type CONFIRM [DIETARY]...";
        }

        function handleRSVPInput(input) {
            addLogEntry(> ${input}, false, 'text-gray-500');
            
            if (input.toLowerCase().startsWith('confirm')) {
                const dietary = input.substring(7).trim() || "None";
                
                // Simulate Worker POST request
                playSound('message');
                document.getElementById('command-input').disabled = true;
                
                const successMsg = `
                \n>> RSVP TRANSMITTED.
                \n>> DIETARY NOTES: ${dietary.toUpperCase()}
                \n>> STATUS: CONFIRMED.
                \n
                \nWE AWAIT YOUR ARRIVAL.
                \nTERMINATING CONNECTION...
                `;
                
                typeWriter(successMsg, null);
                
                // Simulate saving state
                localStorage.setItem('puzzle_complete', 'true');
                localStorage.setItem('user_rsvp', 'true');

            } else {
                addLogEntry(">> COMMAND NOT RECOGNIZED. PLEASE TYPE 'CONFIRM' TO ACCEPT.", false, "text-amber-500");
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
            const delay = text.length * 25; 
            if(callback) setTimeout(callback, delay + 500);
        }

        function typeWriterEffect(element, text, speed = 20) {
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
                    // Only re-enable if game is active (RSVP end state might disable it)
                    if (!document.getElementById('command-input').placeholder.includes('TERMINATING')) {
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

        document.addEventListener('click', (e) => {
            const loginScreen = document.getElementById('login-screen');
            const terminal = document.getElementById('terminal-container');
            
            if (!loginScreen.classList.contains('hidden') && !loginScreen.style.opacity) {
                document.getElementById('login-input').focus();
            } else if (!terminal.classList.contains('hidden') && gameActive && !isTyping) {
                document.getElementById('command-input').focus();
            }
        });

    </script>