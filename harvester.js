(function() {
    window.ScarabHarvester = class ScarabHarvester {
        constructor(scene, bunker) {
            this.scene = scene;
            this.bunker = bunker; // Reference to parent HarvesterBunker tower
            this.state = 'idle'; // idle, deploying, moving_to_plant, harvesting, returning, docking
            this.speed = 3.5; // units per second
            this.hasCargo = false;
            this.targetPlant = null;
            this.harvestTimer = 0;
            this.scale = 0.01;
            this.time = 0;

            // Spawn at bunker's position
            this.position = new THREE.Vector3().copy(bunker.position);
            // Slightly lift so it crawls on top of the ground
            this.position.y = 0.12;

            this.mesh = this.buildMesh();
            this.mesh.position.copy(this.position);
            this.mesh.scale.set(this.scale, this.scale, this.scale);
            this.scene.add(this.mesh);
        }

        buildMesh() {
            const group = new THREE.Group();
            group.userData = { isScarab: true, scarabInstance: this };

            // Materials
            const spaceWhite = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.15, metalness: 0.1 }); // Sleek white hull
            const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5, metalness: 0.8 }); // Heavy chassis/rims
            const rubberBlack = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9, metalness: 0.1 }); // Tire rubber
            const chromeMetal = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.05, metalness: 0.95 }); // Joints/hydraulics
            const laserGreen = new THREE.MeshStandardMaterial({
                color: 0x22c55e,
                emissive: 0x22c55e,
                emissiveIntensity: 0.0,
                roughness: 0.1
            });
            const glassMat = new THREE.MeshStandardMaterial({
                color: 0x38bdf8,
                roughness: 0.05,
                metalness: 0.9,
                transparent: true,
                opacity: 0.4
            });

            // 1. Sleek Space Chassis
            const chassisGeo = new THREE.BoxGeometry(0.38, 0.15, 0.52);
            const chassis = new THREE.Mesh(chassisGeo, spaceWhite);
            chassis.position.y = 0.04;
            chassis.castShadow = true;
            chassis.receiveShadow = true;
            group.add(chassis);

            // Bumper guard
            const bumperGeo = new THREE.BoxGeometry(0.32, 0.06, 0.06);
            const bumper = new THREE.Mesh(bumperGeo, darkMetal);
            bumper.position.set(0, -0.04, 0.28);
            group.add(bumper);

            // 2. Glowing Glass Bio-Reactor Cargo Chamber (at the back)
            const cageGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.22, 6);
            cageGeo.rotateX(Math.PI / 2);
            const cage = new THREE.Mesh(cageGeo, glassMat);
            cage.position.set(0, 0.18, -0.12);
            group.add(cage);

            this.cargoMat = laserGreen;
            const coreGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.18, 6);
            coreGeo.rotateX(Math.PI / 2);
            const core = new THREE.Mesh(coreGeo, this.cargoMat);
            core.position.set(0, 0.18, -0.12);
            group.add(core);

            // 3. 6 detailed rolling wheels (tires)
            this.wheels = [];
            const wheelGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 8);
            wheelGeo.rotateZ(Math.PI / 2); // Make cylinder roll forward/backward
            
            const wheelOffsets = [
                // Left side
                { x: -0.23, y: -0.05, z: 0.18 },
                { x: -0.23, y: -0.05, z: 0 },
                { x: -0.23, y: -0.05, z: -0.18 },
                // Right side
                { x: 0.23, y: -0.05, z: 0.18 },
                { x: 0.23, y: -0.05, z: 0 },
                { x: 0.23, y: -0.05, z: -0.18 }
            ];

            wheelOffsets.forEach(offset => {
                const wheelPivot = new THREE.Group();
                wheelPivot.position.set(offset.x, offset.y, offset.z);

                // Rubber Tire tread
                const tire = new THREE.Mesh(wheelGeo, rubberBlack);
                tire.castShadow = true;
                wheelPivot.add(tire);

                // Metal Rim hubcap inside tire
                const rimGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.065, 6);
                rimGeo.rotateZ(Math.PI / 2);
                const rim = new THREE.Mesh(rimGeo, darkMetal);
                wheelPivot.add(rim);

                group.add(wheelPivot);
                this.wheels.push(wheelPivot);
            });

            // 4. Articulated Robotic Harvester Arm
            this.armBase = new THREE.Group();
            this.armBase.position.set(0, 0.1, 0.16); // Mounted at the front top of chassis
            
            // Shoulder pivot
            this.armShoulder = new THREE.Group();
            this.armShoulder.position.set(0, 0.04, 0);

            // Upper Arm segment
            const upperArmGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.22, 4);
            upperArmGeo.translate(0, 0.11, 0); // Offset geometry so it pivots from base
            const upperArm = new THREE.Mesh(upperArmGeo, darkMetal);
            this.armShoulder.add(upperArm);

            // Elbow pivot
            this.armElbow = new THREE.Group();
            this.armElbow.position.set(0, 0.2, 0);

            // Forearm segment
            const foreArmGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.2, 4);
            foreArmGeo.translate(0, 0.1, 0);
            const foreArm = new THREE.Mesh(foreArmGeo, chromeMetal);
            this.armElbow.add(foreArm);

            // Harvester Head (with green laser emitter tip)
            this.harvesterHead = new THREE.Group();
            this.harvesterHead.position.set(0, 0.2, 0);
            
            const headGeo = new THREE.BoxGeometry(0.06, 0.06, 0.08);
            const headMesh = new THREE.Mesh(headGeo, darkMetal);
            this.harvesterHead.add(headMesh);

            const emitterGeo = new THREE.SphereGeometry(0.024, 4, 4);
            const emitter = new THREE.Mesh(emitterGeo, laserGreen);
            emitter.position.set(0, 0, 0.04);
            this.harvesterHead.add(emitter);

            // Chain joints together
            this.armElbow.add(this.harvesterHead);
            this.armShoulder.add(this.armElbow);
            this.armBase.add(this.armShoulder);
            
            group.add(this.armBase);

            // Set default arm pose (folded back)
            this.armShoulder.rotation.x = -0.8;
            this.armElbow.rotation.x = 1.4;

            return group;
        }

        update(dt) {
            this.time += dt;

            // State Machine
            switch (this.state) {
                case 'idle':
                    // Keep at bunker center, hidden
                    this.mesh.position.copy(this.bunker.position);
                    this.mesh.position.y = 0.12;
                    this.scale = 0.01;
                    this.mesh.scale.set(this.scale, this.scale, this.scale);
                    this.cargoMat.color.setHex(0x22c55e);
                    this.cargoMat.emissive.setHex(0x000000);
                    this.cargoMat.emissiveIntensity = 0.0;
                    this.hasCargo = false;

                    // Scan for polyplants
                    if (window.polyplants && window.polyplants.length > 0) {
                        // Find closest unharvested plant
                        let closestPlant = null;
                        let closestDist = Infinity;
                        for (let plant of window.polyplants) {
                            if (plant.isHarvested) continue;
                            const dist = this.position.distanceTo(plant.position);
                            if (dist < closestDist) {
                                closestDist = dist;
                                closestPlant = plant;
                            }
                        }
                        if (closestPlant) {
                            this.targetPlant = closestPlant;
                            this.state = 'deploying';
                        }
                    }
                    break;

                case 'deploying':
                    // Scale up to 1.4 (making it visually larger/badass)
                    this.scale = Math.min(1.4, this.scale + dt * 2.5);
                    this.mesh.scale.set(this.scale, this.scale, this.scale);
                    // Drive forward slightly
                    const emergenceDir = new THREE.Vector3(0, 0, 0.4).applyEuler(this.mesh.rotation);
                    this.mesh.position.addScaledVector(emergenceDir, dt);
                    this.animateLegs(dt, 2.0);

                    if (this.scale >= 1.4) {
                        this.state = 'moving_to_plant';
                    }
                    break;

                case 'moving_to_plant':
                    // Verify plant is still valid
                    if (!this.targetPlant || this.targetPlant.isHarvested) {
                        this.targetPlant = null;
                        this.state = 'returning';
                        break;
                    }

                    // Move towards plant
                    const targetPos = this.targetPlant.position.clone();
                    targetPos.y = 0.12;
                    const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position);
                    const dist = dir.length();

                    if (dist < 0.4) { // Stop slightly further back for the harvester arm range
                        this.state = 'harvesting';
                        this.harvestTimer = 1.4; // 1.4s harvest delay
                    } else {
                        dir.normalize();
                        // Look towards destination
                        const lookTarget = new THREE.Vector3(targetPos.x, this.mesh.position.y, targetPos.z);
                        this.mesh.lookAt(lookTarget);

                        // Move forward
                        this.mesh.position.addScaledVector(dir, this.speed * dt);
                        this.animateLegs(dt, 5.0);
                    }
                    break;

                case 'harvesting':
                    this.harvestTimer -= dt;
                    // Vibration effect
                    this.mesh.position.x += Math.sin(this.time * 60) * 0.008;
                    this.mesh.position.z += Math.cos(this.time * 60) * 0.008;

                    this.animateLegs(dt, 0); // Wheels stop, arm extends

                    // Trigger harvest beam particles
                    if (Math.random() < 0.25 && window.particles && this.targetPlant) {
                        window.particles.spawnExplosion(this.targetPlant.position, 0x4ade80, 2);
                    }

                    if (this.harvestTimer <= 0) {
                        if (this.targetPlant && !this.targetPlant.isHarvested) {
                            this.targetPlant.harvest();
                            this.hasCargo = true;
                            // Set cargo container core to glow bright green
                            this.cargoMat.emissiveIntensity = 1.6;
                        }
                        this.targetPlant = null;
                        this.state = 'returning';
                    }
                    break;

                case 'returning':
                    // Move towards bunker
                    const bunkerPos = this.bunker.position.clone();
                    bunkerPos.y = 0.12;
                    const returnDir = new THREE.Vector3().subVectors(bunkerPos, this.mesh.position);
                    const returnDist = returnDir.length();

                    if (returnDist < 0.35) {
                        this.state = 'docking';
                    } else {
                        returnDir.normalize();
                        // Look towards bunker
                        const lookTarget = new THREE.Vector3(bunkerPos.x, this.mesh.position.y, bunkerPos.z);
                        this.mesh.lookAt(lookTarget);

                        // Move forward
                        this.mesh.position.addScaledVector(returnDir, this.speed * dt);
                        this.animateLegs(dt, 5.0);
                    }
                    break;

                case 'docking':
                    // Scale down as it enters
                    this.scale = Math.max(0.01, this.scale - dt * 2.5);
                    this.mesh.scale.set(this.scale, this.scale, this.scale);
                    // Move inward
                    const dockDir = new THREE.Vector3(0, 0, 0.3).applyEuler(this.mesh.rotation);
                    this.mesh.position.addScaledVector(dockDir, dt);
                    this.animateLegs(dt, 2.0);

                    if (this.scale <= 0.01) {
                        if (this.hasCargo) {
                            // Deposit food
                            if (window.gameState) {
                                window.gameState.collectedFood++;
                                if (window.updateSurvivalHUD) window.updateSurvivalHUD();
                            }
                            if (window.showToast) {
                                window.showToast("+1 Polyplant Food Collected!", "green");
                            }
                            this.spawnFloatingFoodText();

                            // Trigger exhaust puff event on parent bunker
                            if (this.bunker && typeof this.bunker.triggerExhaustPuff === 'function') {
                                this.bunker.triggerExhaustPuff();
                            }
                        }
                        this.state = 'idle';
                    }
                    break;
            }

            if (window.getTerrainHeight) {
                this.mesh.position.y = window.getTerrainHeight(this.mesh.position.x, this.mesh.position.z) + 0.12;
            }
            // Sync coordinate positions for safety
            this.position.copy(this.mesh.position);
        }

        animateLegs(dt, speedMultiplier) {
            // 1. Rotate all 6 wheels based on travel time and speed
            if (speedMultiplier > 0) {
                const wheelSpeed = 16.0 * speedMultiplier;
                this.wheels.forEach(wheel => {
                    wheel.children.forEach(c => {
                        c.rotation.x += dt * wheelSpeed;
                    });
                });
            }

            // 2. Articulated Arm Animation states
            if (this.state === 'harvesting') {
                // Reach arm down towards the polyplant
                this.armShoulder.rotation.x = THREE.MathUtils.lerp(this.armShoulder.rotation.x, 0.6, dt * 6.0);
                this.armElbow.rotation.x = THREE.MathUtils.lerp(this.armElbow.rotation.x, 0.7, dt * 6.0);
                
                // Vibrate harvester head slightly
                this.harvesterHead.rotation.z = Math.sin(this.time * 40) * 0.12;
            } else if (this.state === 'idle') {
                // Completely folded, tucked in
                this.armShoulder.rotation.x = THREE.MathUtils.lerp(this.armShoulder.rotation.x, -1.1, dt * 4.0);
                this.armElbow.rotation.x = THREE.MathUtils.lerp(this.armElbow.rotation.x, 1.8, dt * 4.0);
                this.harvesterHead.rotation.set(0, 0, 0);
            } else {
                // Default driving pose (semi-folded, high off ground)
                this.armShoulder.rotation.x = THREE.MathUtils.lerp(this.armShoulder.rotation.x, -0.6, dt * 4.0);
                this.armElbow.rotation.x = THREE.MathUtils.lerp(this.armElbow.rotation.x, 1.3, dt * 4.0);
                this.harvesterHead.rotation.set(0, 0, 0);
            }

            // 3. Pulse cargo reactor core if full
            if (this.hasCargo) {
                const pulse = 1.2 + 0.6 * Math.sin(this.time * 8.0);
                this.cargoMat.emissiveIntensity = pulse;
            } else {
                this.cargoMat.emissiveIntensity = 0.05;
            }
        }

        spawnFloatingFoodText() {
            const feedText = document.createElement('div');
            feedText.className = 'orbitron font-black text-green-400 absolute text-sm glow-text-green';
            feedText.style.left = '50%';
            feedText.style.top = '40%';
            feedText.style.transform = 'translate(-50%, -50%)';
            feedText.style.zIndex = '15';
            feedText.style.pointerEvents = 'none';
            feedText.innerText = '+1 FOOD';
            document.body.appendChild(feedText);

            let top = 40;
            let opacity = 1.0;
            const floatInterval = setInterval(() => {
                top -= 1.2;
                opacity -= 0.04;
                feedText.style.top = `${top}%`;
                feedText.style.opacity = opacity;
                if (opacity <= 0) {
                    clearInterval(floatInterval);
                    feedText.remove();
                }
            }, 30);
        }

        destroy() {
            this.scene.remove(this.mesh);
            this.mesh.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
        }
    };
})();
