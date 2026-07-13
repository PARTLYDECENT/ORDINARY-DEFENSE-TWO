(function() {
    const CAMPAIGN_MISSIONS = [
        {
            id: 1,
            name: "Landing on Acheron Prime",
            biome: "jungle",
            description: "We have arrived at the Biolum Jungle of Acheron Prime. Deploy the Command HQ and establish a defensive perimeter against the localized hostiles. Harvest Biolum credits to fund our foothold.",
            victoryText: "Sector secured! The landing zone is fortified. Sensors detect massive underground movement in the solar dunes of Helios. Pack up and prepare for transit.",
            startGold: 150,
            maxWaves: 20,
            waves: [
                // Wave 1
                [
                    { type: 'scarab', count: 5 }
                ],
                // Wave 2
                [
                    { type: 'scarab', count: 6 },
                    { type: 'ant', count: 2 }
                ],
                // Wave 3
                [
                    { type: 'scarab', count: 4 },
                    { type: 'ant', count: 4 },
                    { type: 'wasp', count: 2 }
                ],
                // Wave 4 (Final Wave)
                [
                    { type: 'scarab', count: 8 },
                    { type: 'ant', count: 6 },
                    { type: 'wasp', count: 4 }
                ]
            ]
        },
        {
            id: 2,
            name: "Helios Dunes Harvesting",
            biome: "desert",
            description: "Establish a solar outpost in the Cyber Desert of Helios to power our weapon grids. Scout reports indicate robotic swarms and heavy hostiles converging on our position.",
            victoryText: "Outpost fully charged! Power lines are active. High-priority distress signals are arriving from the frozen cryo-mines on Gliese-9. We must reinforce them immediately.",
            startGold: 180,
            maxWaves: 20,
            waves: [
                // Wave 1
                [
                    { type: 'scarab', count: 6 },
                    { type: 'ant', count: 4 }
                ],
                // Wave 2
                [
                    { type: 'scarab', count: 6 },
                    { type: 'ant', count: 6 },
                    { type: 'wasp', count: 3 }
                ],
                // Wave 3
                [
                    { type: 'ant', count: 6 },
                    { type: 'wasp', count: 4 },
                    { type: 'ufo', count: 2 }
                ],
                // Wave 4
                [
                    { type: 'ant', count: 8 },
                    { type: 'wasp', count: 5 },
                    { type: 'ufo', count: 3 },
                    { type: 'golem', count: 1 }
                ],
                // Wave 5 (Final Wave)
                [
                    { type: 'scarab', count: 10 },
                    { type: 'ant', count: 8 },
                    { type: 'wasp', count: 6 },
                    { type: 'golem', count: 2 }
                ]
            ]
        },
        {
            id: 3,
            name: "Cryo-Shield at Gliese-9",
            biome: "glacial",
            description: "Temperatures are below freezing on Gliese-9. Erect a thermal defense generator dome to protect the cryo-miners. Be prepared for shielded stealth UFOs and armored vanguard hostiles.",
            victoryText: "Thermal shield operational! The miners are secure. However, seismic activity indicates the swarm source has breached the volcanic core of Sector Vulcan. Prepare for the final showdown.",
            startGold: 200,
            maxWaves: 20,
            waves: [
                // Wave 1
                [
                    { type: 'scarab', count: 8 },
                    { type: 'ant', count: 4 },
                    { type: 'ufo', count: 2 }
                ],
                // Wave 2
                [
                    { type: 'ant', count: 6 },
                    { type: 'wasp', count: 4 },
                    { type: 'ufo', count: 4 }
                ],
                // Wave 3
                [
                    { type: 'ant', count: 8 },
                    { type: 'wasp', count: 6 },
                    { type: 'golem', count: 2 },
                    { type: 'stealth', count: 3 }
                ],
                // Wave 4
                [
                    { type: 'ant', count: 10 },
                    { type: 'wasp', count: 6 },
                    { type: 'ufo', count: 5 },
                    { type: 'golem', count: 3 },
                    { type: 'ram', count: 1 }
                ],
                // Wave 5 (Final Wave)
                [
                    { type: 'scarab', count: 12 },
                    { type: 'ant', count: 8 },
                    { type: 'wasp', count: 6 },
                    { type: 'ufo', count: 4 },
                    { type: 'carrier', count: 2 },
                    { type: 'stealth', count: 4 },
                    { type: 'ram', count: 2 }
                ]
            ]
        },
        {
            id: 4,
            name: "Vulcan Crucible",
            biome: "volcanic",
            description: "This is it. The core magma relay in the Volcanic Ashlands. The alien swarm is launching a last-ditch apocalyptic assault to destroy our planetary gateway. Hold the line at all costs!",
            victoryText: "Colony secured! Planetary gateway activated. Humanity now has a permanent home on this world. You are a legendary commander!",
            startGold: 250,
            maxWaves: 20,
            waves: [
                // Wave 1
                [
                    { type: 'scarab', count: 10 },
                    { type: 'ant', count: 6 },
                    { type: 'ufo', count: 4 }
                ],
                // Wave 2
                [
                    { type: 'ant', count: 8 },
                    { type: 'wasp', count: 6 },
                    { type: 'golem', count: 3 }
                ],
                // Wave 3
                [
                    { type: 'ant', count: 10 },
                    { type: 'ufo', count: 6 },
                    { type: 'golem', count: 4 },
                    { type: 'stealth', count: 5 }
                ],
                // Wave 4
                [
                    { type: 'wasp', count: 8 },
                    { type: 'ufo', count: 6 },
                    { type: 'golem', count: 4 },
                    { type: 'carrier', count: 2 },
                    { type: 'scout', count: 4 },
                    { type: 'ram', count: 2 }
                ],
                // Wave 5
                [
                    { type: 'scarab', count: 15 },
                    { type: 'ant', count: 12 },
                    { type: 'wasp', count: 8 },
                    { type: 'golem', count: 5 },
                    { type: 'carrier', count: 2 },
                    { type: 'ram', count: 3 },
                    { type: 'stealth', count: 6 }
                ],
                // Wave 6 (Final Boss Wave)
                [
                    { type: 'scarab', count: 20 },
                    { type: 'ant', count: 15 },
                    { type: 'wasp', count: 10 },
                    { type: 'ufo', count: 8 },
                    { type: 'golem', count: 6 },
                    { type: 'carrier', count: 4 },
                    { type: 'ram', count: 4 },
                    { type: 'stealth', count: 8 },
                    { type: 'scout', count: 6 }
                ]
            ]
        },
        {
            id: 5,
            name: "Martian Canyons Expedition",
            biome: "mars",
            description: "Establishing a permanent presence on Mars. Setup the Command HQ inside the rocky Martian Canyons. Beware of massive sandstorms and radioactive alien swarms nesting in the ancient craters.",
            victoryText: "Mars colony successfully secured! Humanity has conquered the red planet, opening a new chapter of interstellar exploration. You have achieved absolute victory!",
            startGold: 300,
            maxWaves: 20,
            waves: [
                // Wave 1
                [
                    { type: 'scarab', count: 12 },
                    { type: 'ant', count: 8 }
                ],
                // Wave 2
                [
                    { type: 'scarab', count: 12 },
                    { type: 'ant', count: 10 },
                    { type: 'wasp', count: 6 }
                ],
                // Wave 3
                [
                    { type: 'ant', count: 12 },
                    { type: 'wasp', count: 8 },
                    { type: 'ufo', count: 5 }
                ],
                // Wave 4
                [
                    { type: 'wasp', count: 10 },
                    { type: 'ufo', count: 6 },
                    { type: 'golem', count: 4 },
                    { type: 'stealth', count: 4 }
                ],
                // Wave 5
                [
                    { type: 'ufo', count: 8 },
                    { type: 'golem', count: 6 },
                    { type: 'stealth', count: 6 },
                    { type: 'ram', count: 3 }
                ],
                // Wave 6
                [
                    { type: 'golem', count: 8 },
                    { type: 'stealth', count: 8 },
                    { type: 'ram', count: 4 },
                    { type: 'carrier', count: 3 },
                    { type: 'scout', count: 5 }
                ],
                // Wave 7 (Ultimate Boss Wave)
                [
                    { type: 'scarab', count: 25 },
                    { type: 'ant', count: 20 },
                    { type: 'wasp', count: 15 },
                    { type: 'ufo', count: 10 },
                    { type: 'golem', count: 8 },
                    { type: 'stealth', count: 10 },
                    { type: 'ram', count: 6 },
                    { type: 'carrier', count: 5 },
                    { type: 'scout', count: 8 }
                ]
            ]
        }
    ];

    window.CampaignManager = {
        isActive: false,
        currentMissionIndex: 0,
        unlockedMissionIndex: 0,
        missions: CAMPAIGN_MISSIONS,

        init: function() {
            const saved = localStorage.getItem('od2_campaign_unlocked');
            if (saved !== null) {
                this.unlockedMissionIndex = parseInt(saved, 10);
            }
        },

        getCurrentLevelMaxWaves: function() {
            return this.missions[this.currentMissionIndex].maxWaves;
        },

        startMission: function(index) {
            this.isActive = true;
            this.currentMissionIndex = index;
            
            const mission = this.missions[index];

            // Reset GameState variables
            gameState.wave = 1;
            gameState.health = 100;
            gameState.gold = mission.startGold;
            gameState.score = 0;
            gameState.isGameOver = false;

            // Load specified biome
            if (typeof loadBiome === 'function') {
                loadBiome(mission.biome);
            }

            // Sync Stats HUD readout
            if (typeof updateStatsUI === 'function') {
                updateStatsUI();
            }

            // Remove briefing popup
            const modal = document.getElementById('briefing-modal');
            if (modal) modal.remove();

            // Lock biome selector interaction
            const selectEl = document.getElementById('biome-select');
            if (selectEl) {
                selectEl.disabled = true;
                selectEl.classList.add('opacity-50', 'pointer-events-none');
            }

            showToast(`MISSION START: ${mission.name.toUpperCase()}`, "green");
        },

        completeMission: function() {
            const mission = this.missions[this.currentMissionIndex];
            
            if (this.currentMissionIndex === this.unlockedMissionIndex && this.unlockedMissionIndex < this.missions.length - 1) {
                this.unlockedMissionIndex += 1;
                localStorage.setItem('od2_campaign_unlocked', this.unlockedMissionIndex);
            }

            const overlay = document.createElement('div');
            overlay.className = "absolute inset-0 z-50 flex flex-col justify-center items-center bg-black/90 text-emerald-400 pointer-events-auto p-4";
            
            const isLastMission = this.currentMissionIndex === this.missions.length - 1;
            const actionButtonHTML = isLastMission 
                ? `<button onclick="location.reload()" class="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black orbitron text-base rounded-xl transition-all shadow-lg active:scale-95">REPLAY CAMPAIGN</button>`
                : `<button id="next-mission-btn" class="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black orbitron text-base rounded-xl transition-all shadow-lg active:scale-95">NEXT MISSION</button>`;

            overlay.innerHTML = `
                <div class="orbitron text-5xl font-black tracking-widest text-emerald-400 glow-text-green mb-2 animate-pulse">MISSION ACCOMPLISHED</div>
                <div class="text-xl text-yellow-300 mb-8 font-semibold uppercase tracking-wider">${mission.name}</div>
                <div class="blur-panel rounded-xl p-6 text-center max-w-lg space-y-4">
                    <span class="text-xs uppercase tracking-widest text-emerald-500 font-bold block">Transmission Log</span>
                    <p class="text-sm text-white/90 leading-relaxed font-medium">${mission.victoryText}</p>
                    <div class="h-[1px] bg-emerald-500/20 my-4"></div>
                    ${actionButtonHTML}
                    <button id="campaign-menu-btn" class="w-full py-2 bg-transparent hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold orbitron text-sm rounded-xl transition-all active:scale-95 mt-2">BACK TO MENU</button>
                </div>
            `;
            document.body.appendChild(overlay);

            if (!isLastMission) {
                document.getElementById('next-mission-btn').addEventListener('click', () => {
                    overlay.remove();
                    window.CampaignManager.showBriefing(this.currentMissionIndex + 1);
                });
            }
            document.getElementById('campaign-menu-btn').addEventListener('click', () => {
                location.reload();
            });
        },

        showBriefing: function(index) {
            const mission = this.missions[index];

            const modal = document.createElement('div');
            modal.id = 'briefing-modal';
            modal.className = "absolute inset-0 z-50 flex flex-col justify-center items-center bg-black/90 pointer-events-auto p-4";
            
            modal.innerHTML = `
                <div class="orbitron text-xs font-black tracking-widest text-emerald-500 uppercase mb-2">Space Colony Odyssey</div>
                <div class="orbitron text-3xl font-black tracking-wider text-white glow-text-green mb-6 uppercase text-center">Mission Briefing: Level ${mission.id}</div>
                
                <div class="blur-panel rounded-xl p-6 w-full max-w-lg space-y-5">
                    <div class="space-y-1">
                        <span class="text-[10px] uppercase tracking-widest text-emerald-500 font-bold block">Mission Name</span>
                        <span class="text-xl font-bold text-yellow-300 block">${mission.name}</span>
                    </div>
                    
                    <div class="space-y-1">
                        <span class="text-[10px] uppercase tracking-widest text-emerald-500 font-bold block">Sector Coordinates</span>
                        <span class="text-xs font-bold text-white capitalize block"><i class="fa-solid fa-map-location-dot mr-1 text-emerald-400"></i> ${mission.biome} Sector</span>
                    </div>
 
                    <div class="space-y-1">
                        <span class="text-[10px] uppercase tracking-widest text-emerald-500 font-bold block">Objective Overview</span>
                        <p class="text-sm text-white/90 leading-relaxed font-medium">${mission.description}</p>
                    </div>

                    <div class="flex justify-around items-center border-t border-b border-emerald-500/20 py-3 text-white">
                        <div class="text-center">
                            <span class="text-[10px] text-emerald-500 font-bold uppercase block">Starting Funds</span>
                            <span class="text-xl font-black text-yellow-400 orbitron">${mission.startGold}¢</span>
                        </div>
                        <div class="h-6 w-[1px] bg-emerald-500/20"></div>
                        <div class="text-center">
                            <span class="text-[10px] text-emerald-500 font-bold uppercase block">Alien Waves</span>
                            <span class="text-xl font-black text-emerald-400 orbitron">${mission.maxWaves}</span>
                        </div>
                    </div>

                    <div class="flex gap-3 pt-2">
                        <button id="briefing-cancel" class="flex-1 py-3 bg-transparent hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold orbitron text-sm rounded-xl transition-all active:scale-95">CANCEL</button>
                        <button id="briefing-start" class="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black orbitron text-sm rounded-xl transition-all shadow-lg active:scale-95">INITIALIZE OUTPOST</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('briefing-cancel').addEventListener('click', () => {
                modal.remove();
            });
            document.getElementById('briefing-start').addEventListener('click', () => {
                window.CampaignManager.startMission(index);
            });
        }
    };
})();
