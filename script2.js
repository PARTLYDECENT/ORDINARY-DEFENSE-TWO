    <script>
        // Fallback SporeTower implementation in case tower.js fails to load
        if (typeof window.SporeTower === 'undefined') {
            window.SporeTower = class SporeTower {
                constructor(x, z, type = 'spore') {
                    this.gridX = x;
                    this.gridZ = z;
                    this.level = 1;
                    this.type = type;
                    this.specs = { ...TOWER_SPECS[this.type].base };
                    this.cooldown = 0;
                    this.target = null;
                    this.muzzleFlashTimer = 0;
                    this.disabledTimer = 0;

                    const worldPos = gridToWorld(x, z);
                    this.position = new THREE.Vector3(worldPos.x, 0, worldPos.z);

                    this.mesh = this.buildMesh();
                    this.mesh.position.copy(this.position);
                    scene.add(this.mesh);

                    if (this.type === 'harvester') {
                        if (window.ScarabHarvester) {
                            this.scarab = new window.ScarabHarvester(scene, this);
                        }
                    }
                }

                buildMesh() {
                    const group = new THREE.Group();
                    group.userData = { isTower: true, towerInstance: this };

                    const metalDark = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.9, roughness: 0.15 });
                    const metalSlate = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.8, roughness: 0.25 });
                    const camoOlive = new THREE.MeshStandardMaterial({ color: this.specs.color, metalness: 0.5, roughness: 0.45 });
                    const metalChrome = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.05 });
                    const lensGlass = new THREE.MeshBasicMaterial({ color: this.specs.color, transparent: true, opacity: 0.9 });

                    if (this.type === 'laser') {
                        const baseGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.4, 6);
                        const base = new THREE.Mesh(baseGeo, metalSlate);
                        base.position.y = 0.2;
                        base.castShadow = true;
                        group.add(base);

                        const stemGeo = new THREE.CylinderGeometry(0.14, 0.18, 1.1, 8);
                        const stem = new THREE.Mesh(stemGeo, metalChrome);
                        stem.position.y = 0.85;
                        stem.castShadow = true;
                        group.add(stem);

                        const coreGeo = new THREE.SphereGeometry(0.12, 8, 8);
                        this.pulseCore = new THREE.Mesh(coreGeo, lensGlass);
                        this.pulseCore.position.set(0, 0.85, 0.2);
                        group.add(this.pulseCore);

                        this.chestLight = new THREE.PointLight(this.specs.color, 1.2, 4);
                        this.chestLight.position.set(0, 0.85, 0.25);
                        group.add(this.chestLight);

                        this.turretHead = new THREE.Group();
                        this.turretHead.position.y = 1.4;

                        const headBoxGeo = new THREE.BoxGeometry(0.65, 0.45, 0.85);
                        const head = new THREE.Mesh(headBoxGeo, camoOlive);
                        head.castShadow = true;
                        this.turretHead.add(head);

                        this.laserBarrel = new THREE.Group();
                        this.laserBarrel.position.set(0, 0, 0.4);

                        const railGeo = new THREE.BoxGeometry(0.04, 0.08, 1.2);
                        const railL = new THREE.Mesh(railGeo, metalDark);
                        railL.position.x = -0.07;
                        const railR = new THREE.Mesh(railGeo, metalDark);
                        railR.position.x = 0.07;
                        this.laserBarrel.add(railL);
                        this.laserBarrel.add(railR);

                        this.shards = [];
                        this.orbitalGroup = new THREE.Group();
                        this.orbitalGroup.position.set(0, 0, 0.3);
                        const coilGeo = new THREE.TorusGeometry(0.12, 0.03, 5, 8);
                        const coilMat = new THREE.MeshBasicMaterial({ color: this.specs.bulletColor });
                        for (let i = 0; i < 3; i++) {
                            const coil = new THREE.Mesh(coilGeo, coilMat);
                            coil.position.z = i * 0.3 - 0.3;
                            this.orbitalGroup.add(coil);
                            this.shards.push(coil);
                        }
                        this.focusRing = this.shards[0];
                        this.laserBarrel.add(this.orbitalGroup);
                        this.turretHead.add(this.laserBarrel);

                        this.generatorFan = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 8), metalDark);
                        this.generatorFan.position.set(0, 0, -0.48);
                        this.generatorFan.rotation.x = Math.PI / 2;
                        this.turretHead.add(this.generatorFan);

                        this.muzzleFlash = new THREE.PointLight(this.specs.bulletColor, 0, 3);
                        this.muzzleFlash.position.set(0, 0, 1.05);
                        this.turretHead.add(this.muzzleFlash);

                        const flashGeo = new THREE.SphereGeometry(0.15, 6, 6);
                        const flashMat = new THREE.MeshBasicMaterial({ color: this.specs.bulletColor, transparent: true, opacity: 0 });
                        this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
                        this.muzzleFlashMesh.position.set(0, 0, 1.05);
                        this.turretHead.add(this.muzzleFlashMesh);

                        group.add(this.turretHead);
                    } else if (this.type === 'frost') {
                        const baseGeo = new THREE.BoxGeometry(1.0, 0.3, 1.0);
                        const base = new THREE.Mesh(baseGeo, metalSlate);
                        base.position.y = 0.15;
                        base.castShadow = true;
                        group.add(base);

                        const bracketGeo = new THREE.BoxGeometry(0.12, 1.1, 0.35);
                        const bracketL = new THREE.Mesh(bracketGeo, metalSlate);
                        bracketL.position.set(-0.35, 0.8, 0);
                        bracketL.castShadow = true;
                        group.add(bracketL);
                        const bracketR = new THREE.Mesh(bracketGeo, metalSlate);
                        bracketR.position.set(0.35, 0.8, 0);
                        bracketR.castShadow = true;
                        group.add(bracketR);

                        const coreGeo = new THREE.SphereGeometry(0.14, 8, 8);
                        this.pulseCore = new THREE.Mesh(coreGeo, lensGlass);
                        this.pulseCore.position.set(0, 0.8, 0);
                        group.add(this.pulseCore);

                        this.chestLight = new THREE.PointLight(this.specs.color, 1.0, 4);
                        this.chestLight.position.set(0, 0.8, 0.1);
                        group.add(this.chestLight);

                        this.turretHead = new THREE.Group();
                        this.turretHead.position.y = 1.35;

                        const podGeo = new THREE.BoxGeometry(0.6, 0.45, 0.85);
                        const pod = new THREE.Mesh(podGeo, camoOlive);
                        pod.castShadow = true;
                        this.turretHead.add(pod);

                        const tubeMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9 });
                        const tubeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 6);
                        for (let i = 0; i < 4; i++) {
                            const tube = new THREE.Mesh(tubeGeo, tubeMat);
                            tube.rotation.x = Math.PI / 2;
                            const ox = (i % 2 === 0 ? -1 : 1) * 0.15;
                            const oy = (i < 2 ? -1 : 1) * 0.11;
                            tube.position.set(ox, oy, 0.43);
                            this.turretHead.add(tube);
                        }

                        this.radarDish = new THREE.Group();
                        this.radarDish.position.set(0, 0.35, -0.1);
                        const dishGeo = new THREE.ConeGeometry(0.18, 0.08, 8);
                        dishGeo.rotateX(Math.PI / 4);
                        const dish = new THREE.Mesh(dishGeo, metalDark);
                        this.radarDish.add(dish);
                        const stemMini = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15), metalSlate);
                        stemMini.position.y = -0.08;
                        this.radarDish.add(stemMini);
                        this.turretHead.add(this.radarDish);

                        this.muzzleFlash = new THREE.PointLight(this.specs.bulletColor, 0, 3);
                        this.muzzleFlash.position.set(0, 0, 0.5);
                        this.turretHead.add(this.muzzleFlash);

                        const flashGeo = new THREE.SphereGeometry(0.18, 6, 6);
                        const flashMat = new THREE.MeshBasicMaterial({ color: this.specs.bulletColor, transparent: true, opacity: 0 });
                        this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
                        this.muzzleFlashMesh.position.set(0, 0, 0.5);
                        this.turretHead.add(this.muzzleFlashMesh);

                        group.add(this.turretHead);
                    } else if (this.type === 'harvester') {
                        const spaceWhite = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.15, metalness: 0.1 });
                        const windowMat = new THREE.MeshStandardMaterial({
                            color: 0x0ea5e9,
                            emissive: 0x0ea5e9,
                            emissiveIntensity: 0.9,
                            roughness: 0.05,
                            metalness: 0.9
                        });

                        // Clean High-tech Space Cube Base
                        const baseGeo = new THREE.BoxGeometry(1.3, 1.1, 1.3);
                        const base = new THREE.Mesh(baseGeo, spaceWhite);
                        base.position.y = 0.55;
                        base.castShadow = true;
                        base.receiveShadow = true;
                        group.add(base);

                        // Inset Space Glass Windows
                        const windowSideGeo = new THREE.BoxGeometry(0.02, 0.18, 0.45);
                        const winL = new THREE.Mesh(windowSideGeo, windowMat);
                        winL.position.set(-0.66, 0.7, 0);
                        group.add(winL);

                        const winR = new THREE.Mesh(windowSideGeo, windowMat);
                        winR.position.set(0.66, 0.7, 0);
                        group.add(winR);

                        const winFrontGeo = new THREE.BoxGeometry(0.2, 0.1, 0.02);
                        const winF1 = new THREE.Mesh(winFrontGeo, windowMat);
                        winF1.position.set(-0.25, 0.8, 0.66);
                        group.add(winF1);

                        const winF2 = new THREE.Mesh(winFrontGeo, windowMat);
                        winF2.position.set(0.25, 0.8, 0.66);
                        group.add(winF2);

                        const winBackGeo = new THREE.BoxGeometry(0.4, 0.15, 0.02);
                        const winB = new THREE.Mesh(winBackGeo, windowMat);
                        winB.position.set(0, 0.7, -0.66);
                        group.add(winB);

                        // Reinforced structural steel corner columns
                        const pillarGeo = new THREE.BoxGeometry(0.12, 1.12, 0.12);
                        const corners = [
                            { x: -0.66, z: 0.66 },
                            { x: 0.66, z: 0.66 },
                            { x: -0.66, z: -0.66 },
                            { x: 0.66, z: -0.66 }
                        ];
                        corners.forEach(c => {
                            const pillar = new THREE.Mesh(pillarGeo, metalDark);
                            pillar.position.set(c.x, 0.56, c.z);
                            pillar.castShadow = true;
                            group.add(pillar);
                        });

                        // Glowing Bio-conduits wrapping base
                        const conduitMat = new THREE.MeshStandardMaterial({
                            color: 0x22c55e,
                            emissive: 0x22c55e,
                            emissiveIntensity: 1.2
                        });
                        const conduitGeo = new THREE.TorusGeometry(0.92, 0.022, 4, 12);
                        conduitGeo.rotateX(Math.PI / 2);
                        const conduitL = new THREE.Mesh(conduitGeo, conduitMat);
                        conduitL.position.y = 0.2;
                        group.add(conduitL);

                        // Hatch door
                        const hatchGeo = new THREE.BoxGeometry(0.36, 0.32, 0.05);
                        const hatch = new THREE.Mesh(hatchGeo, metalDark);
                        hatch.position.set(0, 0.16, 0.66);
                        group.add(hatch);

                        // Physical hazard stripes overlaying the hatch door
                        const stripeGeo = new THREE.BoxGeometry(0.36, 0.03, 0.012);
                        for (let i = 0; i < 4; i++) {
                            const stripe = new THREE.Mesh(stripeGeo, new THREE.MeshBasicMaterial({ color: 0xeab308 }));
                            stripe.position.set(0, 0.06 + i * 0.07, 0.688);
                            stripe.rotation.z = 0.45;
                            group.add(stripe);
                        }

                        // Hydraulic Hatch Pistons
                        const pistonGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.24, 4);
                        pistonGeo.rotateX(Math.PI / 2);
                        
                        const pistonL = new THREE.Mesh(pistonGeo, metalChrome);
                        pistonL.position.set(-0.21, 0.16, 0.63);
                        pistonL.rotation.y = 0.15;
                        group.add(pistonL);

                        const pistonR = new THREE.Mesh(pistonGeo, metalChrome);
                        pistonR.position.set(0.21, 0.16, 0.63);
                        pistonR.rotation.y = -0.15;
                        group.add(pistonR);

                        // Exhaust stack chimney
                        const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.28, 4);
                        exhaustGeo.rotateX(-0.35); // Slanted backwards
                        this.exhaustStack = new THREE.Mesh(exhaustGeo, metalDark);
                        this.exhaustStack.position.set(-0.35, 1.2, -0.3);
                        this.exhaustStack.castShadow = true;
                        group.add(this.exhaustStack);

                        // Beacon Light
                        const beaconGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 4);
                        const beacon = new THREE.Mesh(beaconGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
                        beacon.position.set(0, 1.15, 0);
                        group.add(beacon);

                        this.beaconLight = new THREE.PointLight(0xef4444, 1.0, 2.0);
                        this.beaconLight.position.set(0, 1.2, 0);
                        group.add(this.beaconLight);

                    } else if (this.type === 'water_pump') {
                        // Water Pump Jack
                        const baseGeo = new THREE.BoxGeometry(0.7, 0.2, 1.2);
                        const base = new THREE.Mesh(baseGeo, metalSlate);
                        base.position.y = 0.1;
                        base.castShadow = true;
                        base.receiveShadow = true;
                        group.add(base);

                        // Triangular scaffold
                        const frameGeo = new THREE.BoxGeometry(0.06, 0.85, 0.06);
                        const frameL = new THREE.Mesh(frameGeo, metalDark);
                        frameL.position.set(-0.25, 0.5, -0.3);
                        frameL.rotation.z = -0.15;
                        const frameR = new THREE.Mesh(frameGeo, metalDark);
                        frameR.position.set(0.25, 0.5, -0.3);
                        frameR.rotation.z = 0.15;
                        group.add(frameL);
                        group.add(frameR);

                        // Bobbing pump arm (beam)
                        this.pumpArm = new THREE.Group();
                        this.pumpArm.position.set(0, 0.9, -0.3);
                        const beamGeo = new THREE.BoxGeometry(0.08, 0.08, 1.3);
                        const beam = new THREE.Mesh(beamGeo, camoOlive);
                        beam.position.set(0, 0, 0.25);
                        beam.castShadow = true;
                        this.pumpArm.add(beam);

                        // Head counterweight (horsehead shape)
                        const headGeo = new THREE.BoxGeometry(0.12, 0.35, 0.16);
                        const head = new THREE.Mesh(headGeo, metalDark);
                        head.position.set(0, -0.05, 0.9);
                        this.pumpArm.add(head);

                        group.add(this.pumpArm);

                        // Wellhead
                        const wellGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 6);
                        const well = new THREE.Mesh(wellGeo, metalChrome);
                        well.position.set(0, 0.25, 0.6);
                        group.add(well);

                        // Blue stripe ring
                        const stripeGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.05, 6);
                        const stripe = new THREE.Mesh(stripeGeo, new THREE.MeshBasicMaterial({ color: 0x0ea5e9 }));
                        stripe.position.set(0, 0.25, 0.6);
                        group.add(stripe);

                    } else if (this.type === 'generator') {
                        // Wind / Solar Generator
                        const baseGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.3, 8);
                        const base = new THREE.Mesh(baseGeo, metalSlate);
                        base.position.y = 0.15;
                        base.castShadow = true;
                        base.receiveShadow = true;
                        group.add(base);

                        // Tall Pole
                        const poleGeo = new THREE.CylinderGeometry(0.06, 0.1, 1.5, 6);
                        const pole = new THREE.Mesh(poleGeo, metalDark);
                        pole.position.y = 0.9;
                        pole.castShadow = true;
                        group.add(pole);

                        // Rotating turbine fan
                        this.turbineFan = new THREE.Group();
                        this.turbineFan.position.set(0, 1.6, 0);

                        const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 6);
                        hubGeo.rotateX(Math.PI / 2);
                        const hub = new THREE.Mesh(hubGeo, metalChrome);
                        this.turbineFan.add(hub);

                        // 3 blades
                        const bladeGeo = new THREE.BoxGeometry(0.7, 0.04, 0.015);
                        for (let i = 0; i < 3; i++) {
                            const bladePivot = new THREE.Group();
                            bladePivot.rotation.z = (i / 3) * Math.PI * 2;
                            const blade = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.15 }));
                            blade.position.x = 0.38;
                            blade.rotation.x = 0.3; // twist
                            bladePivot.add(blade);
                            this.turbineFan.add(bladePivot);
                        }

                        group.add(this.turbineFan);

                        // Solar panels underneath (tilted brackets)
                        const solarPanelGeo = new THREE.BoxGeometry(0.45, 0.03, 0.3);
                        const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.1, emissive: 0x1d4ed8, emissiveIntensity: 0.2 });
                        
                        const panelL = new THREE.Mesh(solarPanelGeo, solarMat);
                        panelL.position.set(-0.35, 0.6, 0);
                        panelL.rotation.set(0.4, 0, 0.4);
                        group.add(panelL);

                        const panelR = new THREE.Mesh(solarPanelGeo, solarMat);
                        panelR.position.set(0.35, 0.6, 0);
                        panelR.rotation.set(0.4, 0, -0.4);
                        group.add(panelR);

                    } else {
                        const baseGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.35, 8);
                        const base = new THREE.Mesh(baseGeo, metalSlate);
                        base.position.y = 0.17;
                        base.castShadow = true;
                        group.add(base);

                        const stemGeo = new THREE.CylinderGeometry(0.15, 0.22, 1.1, 8);
                        const stem = new THREE.Mesh(stemGeo, metalDark);
                        stem.position.y = 0.8;
                        stem.castShadow = true;
                        group.add(stem);

                        const shieldGeo = new THREE.BoxGeometry(0.65, 0.65, 0.06);
                        const shield = new THREE.Mesh(shieldGeo, camoOlive);
                        shield.position.set(0, 1.0, 0.25);
                        shield.castShadow = true;
                        group.add(shield);

                        const coreGeo = new THREE.SphereGeometry(0.1, 8, 8);
                        this.pulseCore = new THREE.Mesh(coreGeo, lensGlass);
                        this.pulseCore.position.set(0.2, 1.0, 0.26);
                        group.add(this.pulseCore);

                        this.chestLight = new THREE.PointLight(this.specs.color, 1.0, 4);
                        this.chestLight.position.set(0.2, 1.0, 0.3);
                        group.add(this.chestLight);

                        this.turretHead = new THREE.Group();
                        this.turretHead.position.y = 1.35;

                        const receiverGeo = new THREE.BoxGeometry(0.45, 0.4, 0.7);
                        const receiver = new THREE.Mesh(receiverGeo, metalDark);
                        receiver.castShadow = true;
                        this.turretHead.add(receiver);

                        this.barrelCluster = new THREE.Group();
                        this.barrelCluster.position.set(0, 0, 0.35);

                        const barrelLen = 0.75;
                        const singleBarrelGeo = new THREE.CylinderGeometry(0.015, 0.015, barrelLen, 4);
                        singleBarrelGeo.rotateX(Math.PI / 2);
                        
                        for (let i = 0; i < 6; i++) {
                            const barrelMesh = new THREE.Mesh(singleBarrelGeo, metalChrome);
                            const angle = (i / 6) * Math.PI * 2;
                            barrelMesh.position.set(Math.cos(angle) * 0.07, Math.sin(angle) * 0.07, barrelLen / 2);
                            this.barrelCluster.add(barrelMesh);
                        }

                        const discGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.03, 8);
                        discGeo.rotateX(Math.PI / 2);
                        const disc1 = new THREE.Mesh(discGeo, metalDark);
                        disc1.position.z = 0.05;
                        this.barrelCluster.add(disc1);

                        const disc2 = new THREE.Mesh(discGeo, metalDark);
                        disc2.position.z = barrelLen - 0.05;
                        this.barrelCluster.add(disc2);

                        this.turretHead.add(this.barrelCluster);

                        const ammoBoxGeo = new THREE.BoxGeometry(0.24, 0.32, 0.28);
                        const ammoBox = new THREE.Mesh(ammoBoxGeo, camoOlive);
                        ammoBox.position.set(-0.3, -0.05, -0.05);
                        this.turretHead.add(ammoBox);

                        this.muzzleFlash = new THREE.PointLight(this.specs.bulletColor, 0, 3);
                        this.muzzleFlash.position.set(0, 0, 1.15);
                        this.turretHead.add(this.muzzleFlash);

                        const flashGeo = new THREE.SphereGeometry(0.15, 6, 6);
                        const flashMat = new THREE.MeshBasicMaterial({ color: this.specs.bulletColor, transparent: true, opacity: 0 });
                        this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
                        this.muzzleFlashMesh.position.set(0, 0, 1.15);
                        this.turretHead.add(this.muzzleFlashMesh);

                        group.add(this.turretHead);
                    }

                    return group;
                }

                upgrade() {
                    if (this.level >= 2) return;
                    this.level = 2;
                    this.specs = { ...TOWER_SPECS[this.type].upgraded };

                    if (this.turretHead && this.turretHead.children[0]) {
                        this.turretHead.children[0].material.color.setHex(this.specs.color);
                    }
                    if (this.pulseCore) {
                        this.pulseCore.material.color.setHex(this.specs.color);
                    }
                    if (this.chestLight) {
                        this.chestLight.color.setHex(this.specs.color);
                    }
                    if (this.shards) {
                        this.shards.forEach(coil => coil.material.color.setHex(this.specs.bulletColor));
                    }
                    if (this.muzzleFlash) this.muzzleFlash.color.setHex(this.specs.bulletColor);
                    if (this.muzzleFlashMesh) this.muzzleFlashMesh.material.color.setHex(this.specs.bulletColor);

                    particles.spawnExplosion(this.position, 0xef4444, 20);
                    audio.playBuild();
                }

                triggerExhaustPuff() {
                    if (!this.exhaustStack) return;
                    if (window.particles) {
                        const worldExhaustPos = new THREE.Vector3().copy(this.exhaustStack.position);
                        worldExhaustPos.applyMatrix4(this.mesh.matrixWorld);
                        for (let i = 0; i < 5; i++) {
                            window.particles.spawnExplosion(worldExhaustPos, 0xd1d5db, 1);
                        }
                    }
                }

                update(dt) {
                    if (this.type === 'harvester') {
                        if (this.scarab) {
                            this.scarab.update(dt);
                        }
                        if (this.beaconLight) {
                            this.beaconLight.intensity = 0.5 + 0.5 * Math.sin(Date.now() * 0.015);
                        }
                        return;
                    }
                    if (this.type === 'water_pump') {
                        if (this.pumpArm) {
                            const speed = 2.5;
                            this.pumpArm.rotation.z = Math.sin(Date.now() * 0.0015 * speed) * 0.25;
                        }
                        return;
                    }
                    if (this.type === 'generator') {
                        if (this.turbineFan) {
                            this.turbineFan.rotation.y += dt * 2.0;
                        }
                        return;
                    }

                    if (this.disabledTimer > 0) {
                        this.disabledTimer -= dt;
                        if (this.chestLight) {
                            this.chestLight.color.setHex(0xef4444);
                            this.chestLight.intensity = Math.random() * 2.0;
                        }
                        if (this.pulseCore) {
                            const pulse = 0.5 + 0.3 * Math.sin(Date.now() * 0.02);
                            this.pulseCore.scale.set(pulse, pulse, pulse);
                        }
                        if (this.disabledTimer <= 0) {
                            if (this.chestLight) {
                                this.chestLight.color.setHex(this.specs.color);
                                this.chestLight.intensity = 1.0;
                            }
                        }
                        return;
                    }

                    if (this.cooldown > 0) {
                        this.cooldown -= dt;
                    }

                    if (this.type === 'spore' && this.barrelCluster) {
                        if (this.cooldown > 0) {
                            this.barrelCluster.rotation.z += dt * 28;
                        } else {
                            this.barrelCluster.rotation.z += dt * 1.5;
                        }
                    } else if (this.type === 'laser') {
                        if (this.generatorFan) {
                            this.generatorFan.rotation.y += dt * 7;
                        }
                        if (this.orbitalGroup) {
                            this.orbitalGroup.rotation.z += dt * 2.5;
                        }
                    } else if (this.type === 'frost') {
                        if (this.radarDish) {
                            this.radarDish.rotation.y += dt * 2.2;
                        }
                    }

                    const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.005);
                    this.pulseCore.scale.set(pulse, pulse, pulse);
                    this.chestLight.intensity = pulse * 1.5;

                    if (this.muzzleFlashTimer > 0) {
                        this.muzzleFlashTimer -= dt;
                        if (this.muzzleFlashTimer <= 0) {
                            this.muzzleFlash.intensity = 0;
                            this.muzzleFlashMesh.material.opacity = 0;
                        } else {
                            const ratio = this.muzzleFlashTimer / (this.type === 'laser' ? 0.08 : 0.15);
                            this.muzzleFlash.intensity = ratio * 3.0;
                            this.muzzleFlashMesh.material.opacity = ratio * 0.95;
                        }
                    }

                    this.turretHead.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 10);

                    this.target = this.findTarget();

                    if (this.target) {
                        const lookTarget = new THREE.Vector3(this.target.position.x, this.turretHead.position.y + this.position.y, this.target.position.z);
                        this.turretHead.lookAt(lookTarget);

                        if (this.cooldown <= 0) {
                            this.shoot();
                        }
                    }
                }

                findTarget() {
                    let closest = null;
                    let minDist = this.specs.range;

                    for (let enemy of enemies) {
                        if (enemy.isDead) continue;
                        let dist = this.position.distanceTo(enemy.position);
                        if (dist < minDist) {
                            minDist = dist;
                            closest = enemy;
                        }
                    }
                    return closest;
                }

                shoot() {
                    this.cooldown = this.specs.fireRate;

                    if (this.type === 'laser') {
                        const startPos = new THREE.Vector3(0, 0, 1.0).applyMatrix4(this.turretHead.matrixWorld);
                        const endPos = this.target.position.clone();
                        const distance = startPos.distanceTo(endPos);

                        const laserGeo = new THREE.CylinderGeometry(0.04, 0.04, distance, 4);
                        const laserMat = new THREE.MeshBasicMaterial({
                            color: this.specs.bulletColor,
                            transparent: true,
                            opacity: 0.95,
                            blending: THREE.AdditiveBlending
                        });
                        const laserMesh = new THREE.Mesh(laserGeo, laserMat);
                        laserMesh.position.copy(startPos).add(endPos).multiplyScalar(0.5);
                        laserMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endPos.clone().sub(startPos).normalize());
                        scene.add(laserMesh);

                        setTimeout(() => {
                            scene.remove(laserMesh);
                            laserGeo.dispose();
                            laserMat.dispose();
                        }, 50);

                        this.target.takeDamage(this.specs.damage);
                        particles.spawnHitBurst(this.target.position, this.specs.bulletColor);

                        this.turretHead.scale.set(1.0, 1.0, 0.72);

                        this.muzzleFlash.intensity = 3.5;
                        this.muzzleFlashMesh.material.opacity = 0.95;
                        this.muzzleFlashTimer = 0.08;

                        audio.playShoot();
                    } else if (this.type === 'frost') {
                        const launchTube = Math.floor(Math.random() * 4);
                        const ox = (launchTube % 2 === 0 ? -1 : 1) * 0.15;
                        const oy = (launchTube < 2 ? -1 : 1) * 0.11;
                        const startPos = new THREE.Vector3(ox, oy, 0.45).applyMatrix4(this.turretHead.matrixWorld);

                        projectiles.push(new BioSporeProjectile(
                            startPos, 
                            this.target, 
                            this.specs.damage, 
                            this.specs.projectileSpeed, 
                            this.specs.bulletColor, 
                            true, 
                            this.specs.slowFactor, 
                            this.specs.slowDuration
                        ));

                        this.turretHead.scale.set(1.15, 1.15, 0.85);

                        this.muzzleFlash.intensity = 2.8;
                        this.muzzleFlashMesh.material.opacity = 0.9;
                        this.muzzleFlashTimer = 0.12;

                        audio.playShoot();
                    } else {
                        const startPosLeft = new THREE.Vector3(-0.07, 0.07, 1.1).applyMatrix4(this.turretHead.matrixWorld);
                        const startPosRight = new THREE.Vector3(0.07, -0.07, 1.1).applyMatrix4(this.turretHead.matrixWorld);

                        projectiles.push(new BioSporeProjectile(startPosLeft, this.target, this.specs.damage, this.specs.projectileSpeed, this.specs.bulletColor, false));
                        projectiles.push(new BioSporeProjectile(startPosRight, this.target, this.specs.damage, this.specs.projectileSpeed, this.specs.bulletColor, false));

                        this.turretHead.scale.set(1.08, 1.08, 0.82);

                        this.muzzleFlash.intensity = 2.6;
                        this.muzzleFlashMesh.material.opacity = 0.9;
                        this.muzzleFlashTimer = 0.15;

                        audio.playShoot();
                    }
                }

                destroy() {
                    if (this.scarab) {
                        this.scarab.destroy();
                        this.scarab = null;
                    }
                    scene.remove(this.mesh);
                    particles.spawnExplosion(this.position, 0xef4444, 15);
                }
            };
        }

        /* ==========================================
           PROJECTILE CONTROLLER
           ========================================== */
        const projectiles = [];

        class BioSporeProjectile {
            constructor(startPos, target, damage, speed, colorHex, isFrost = false, slowFactor = 1.0, slowDuration = 0, isArtillery = false) {
                this.position = startPos.clone();
                this.target = target;
                this.damage = damage;
                this.speed = speed;
                this.color = colorHex;
                this.isDead = false;
                this.isFrost = isFrost;
                this.slowFactor = slowFactor;
                this.slowDuration = slowDuration;
                this.isArtillery = isArtillery;
                this.isInstanced = false;

                this.startPosition = startPos.clone();
                this.targetStartPosition = target.position.clone();

                if (this.isFrost) {
                    this.mesh = new THREE.Group();
                    const bodyGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 5);
                    bodyGeo.rotateX(Math.PI / 2);
                    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.85, roughness: 0.25 });
                    const body = new THREE.Mesh(bodyGeo, bodyMat);
                    body.castShadow = true;
                    this.mesh.add(body);

                    const tipGeo = new THREE.ConeGeometry(0.04, 0.14, 5);
                    tipGeo.rotateX(Math.PI / 2);
                    tipGeo.translate(0, 0, 0.245);
                    const tipMat = new THREE.MeshBasicMaterial({ color: this.color });
                    const tip = new THREE.Mesh(tipGeo, tipMat);
                    this.mesh.add(tip);

                    const finGeo = new THREE.BoxGeometry(0.01, 0.15, 0.08);
                    const finMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8 });
                    const finVert = new THREE.Mesh(finGeo, finMat);
                    finVert.position.set(0, 0, -0.13);
                    this.mesh.add(finVert);

                    const finHoriz = new THREE.Mesh(finGeo, finMat);
                    finHoriz.rotation.z = Math.PI / 2;
                    finHoriz.position.set(0, 0, -0.13);
                    this.mesh.add(finHoriz);

                    this.mesh.position.copy(this.position);
                    scene.add(this.mesh);
                } else if (this.isArtillery) {
                    const geo = new THREE.SphereGeometry(0.14, 8, 8);
                    const mat = new THREE.MeshBasicMaterial({ color: this.color });
                    this.mesh = new THREE.Mesh(geo, mat);
                    this.mesh.position.copy(this.position);
                    scene.add(this.mesh);
                } else {
                    if (window.projectileInstancer) {
                        this.instanceId = window.projectileInstancer.acquire(this.position, this.target.position, this.color);
                        if (this.instanceId !== null) {
                            this.isInstanced = true;
                        }
                    }

                    if (!this.isInstanced) {
                        const geo = new THREE.BoxGeometry(0.03, 0.03, 0.25);
                        const mat = new THREE.MeshBasicMaterial({ color: this.color });
                        this.mesh = new THREE.Mesh(geo, mat);
                        this.mesh.position.copy(this.position);
                        scene.add(this.mesh);
                    }
                }
            }

            update(dt) {
                if (this.isDead) return;

                if (!this.target || this.target.isDead) {
                    this.isDead = true;
                    this.cleanup();
                    return;
                }

                if (this.isArtillery) {
                    const totalDist = this.startPosition.distanceTo(this.targetStartPosition);
                    const currentDist = this.position.distanceTo(this.target.position);
                    const progress = Math.max(0.0, Math.min(1.0, 1.0 - (currentDist / totalDist)));
                    const arcHeight = Math.sin(progress * Math.PI) * (totalDist * 0.45);

                    const dir = new THREE.Vector3().subVectors(this.target.position, this.position).normalize();
                    const distToMove = this.speed * dt;

                    if (Math.random() < 0.5) {
                        particles.spawnSmoke(this.position.clone().add(new THREE.Vector3(0, arcHeight, 0)));
                    }

                    if (distToMove >= currentDist) {
                        for (let enemy of enemies) {
                            if (enemy.isDead) continue;
                            if (enemy.position.distanceTo(this.target.position) < 2.0) {
                                enemy.takeDamage(this.damage);
                                particles.spawnHitBurst(enemy.position, this.color);
                            }
                        }
                        particles.spawnExplosion(this.target.position, this.color, 30);
                        this.isDead = true;
                        this.cleanup();
                    } else {
                        this.position.addScaledVector(dir, distToMove);
                        this.mesh.position.copy(this.position);
                        this.mesh.position.y += arcHeight;
                    }
                } else {
                    const dir = new THREE.Vector3().subVectors(this.target.position, this.position).normalize();
                    const distToMove = this.speed * dt;
                    const distToTarget = this.position.distanceTo(this.target.position);

                    if (this.isFrost && Math.random() < 0.65) {
                        particles.spawnSmoke(this.position.clone());
                    }

                    if (distToMove >= distToTarget) {
                        this.target.takeDamage(this.damage);
                        if (this.isFrost && typeof this.target.applySlow === 'function') {
                            this.target.applySlow(this.slowFactor, this.slowDuration);
                        }
                        particles.spawnHitBurst(this.target.position, this.color);
                        this.isDead = true;
                        this.cleanup();
                    } else {
                        this.position.addScaledVector(dir, distToMove);
                        if (this.isInstanced) {
                            window.projectileInstancer.updateInstance(this.instanceId, this.position, this.target.position);
                        } else {
                            this.mesh.lookAt(this.target.position);
                            this.mesh.position.copy(this.position);
                        }
                    }
                }
            }

            cleanup() {
                if (this.isInstanced) {
                    window.projectileInstancer.release(this.instanceId);
                } else if (this.mesh) {
                    scene.remove(this.mesh);
                }
            }
        }

        /* ==========================================
           ENEMY CONTROLLER (BIOMECHANICAL SCARABS)
           ========================================== */
        const enemies = [];
        const ENEMY_SPECS = {
            hp: 60,
            speed: 2.8,
            goldReward: 12,
            damage: 1
        };

        class ScarabEnemy {
            constructor(spawnPoint) {
                this.gridX = spawnPoint.x;
                this.gridZ = spawnPoint.z;
                
                // Track actual path step points for flow field
                this.targetGridX = spawnPoint.x;
                this.targetGridZ = spawnPoint.z;

                const worldPos = gridToWorld(spawnPoint.x, spawnPoint.z);
                this.position = new THREE.Vector3(worldPos.x, 0.25, worldPos.z);

                this.levelScalar = 1.0 + (gameState.wave - 1) * 0.25;
                this.maxHp = Math.round(ENEMY_SPECS.hp * this.levelScalar);
                this.speed = ENEMY_SPECS.speed + (gameState.wave * 0.05);
                this.evolutionTier = 1;
                if (gameState.wave >= 9) {
                    this.evolutionTier = 3;
                } else if (gameState.wave >= 5) {
                    this.evolutionTier = 2;
                }
                if (this.evolutionTier === 2) {
                    this.maxHp = Math.round(this.maxHp * 1.25);
                    this.speed *= 1.15;
                } else if (this.evolutionTier === 3) {
                    this.maxHp = Math.round(this.maxHp * 1.55);
                    this.speed *= 1.3;
                }
                this.hp = this.maxHp;
                this.isDead = false;
                this.flashTimer = 0;
                this.slowTimer = 0;
                this.slowFactor = 1.0;

                this.mesh = this.buildMesh();
                this.mesh.position.copy(this.position);
                scene.add(this.mesh);
                
                // Walk leg animation cycle
                this.legCycle = Math.random() * 100;
            }

            buildMesh() {
                const group = new THREE.Group();

                // Scarab outer hard shell (Low Poly Capsule style)
                const shellGeo = new THREE.DodecahedronGeometry(0.35, 1);
                this.bodyMat = new THREE.MeshStandardMaterial({
                    color: 0x0f172a,
                    roughness: 0.1,
                    metalness: 0.9,
                    flatShading: true
                });
                const shell = new THREE.Mesh(shellGeo, this.bodyMat);
                shell.scale.set(1.3, 0.8, 1);
                shell.castShadow = true;
                group.add(shell);

                // Bioluminescent pattern under shell (glowing segment)
                const neonGeo = new THREE.BoxGeometry(0.1, 0.38, 0.5);
                this.neonMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
                const neonStrip = new THREE.Mesh(neonGeo, this.neonMat);
                neonStrip.position.y = 0.1;
                group.add(neonStrip);

                // 6 segmented spider/insect legs
                this.legs = [];
                const legGeo = new THREE.BoxGeometry(0.08, 0.4, 0.08);
                const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
                
                for (let i = 0; i < 6; i++) {
                    const leg = new THREE.Mesh(legGeo, legMat);
                    const isLeft = i % 2 === 0;
                    const side = isLeft ? -1 : 1;
                    const row = Math.floor(i / 2); // 0 (front), 1 (mid), 2 (back)

                    leg.position.set(0.35 * side, -0.25, (row - 1) * 0.25);
                    leg.rotation.z = 0.5 * side;
                    group.add(leg);
                    this.legs.push({ mesh: leg, side: side, row: row });
                }

                // Add simple HP bar floating above
                const barBackGeo = new THREE.PlaneGeometry(0.7, 0.08);
                const barBackMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
                this.hpBack = new THREE.Mesh(barBackGeo, barBackMat);
                this.hpBack.position.y = 1.0;
                group.add(this.hpBack);

                const barFillGeo = new THREE.PlaneGeometry(0.7, 0.08);
                this.hpFillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
                this.hpFill = new THREE.Mesh(barFillGeo, this.hpFillMat);
                this.hpFill.position.set(0, 1.0, 0.01);
                group.add(this.hpFill);

                addEnemyEvolutionSpikes(group, this.evolutionTier);
                if (this.evolutionTier === 2) {
                    group.scale.multiplyScalar(1.2);
                } else if (this.evolutionTier === 3) {
                    group.scale.multiplyScalar(1.4);
                }
                return group;
            }

            applySlow(factor, duration) {
                this.slowFactor = Math.min(this.slowFactor, factor);
                this.slowTimer = Math.max(this.slowTimer, duration);
            }

            takeDamage(dmg) {
                if (this.isDead) return;
                this.hp -= dmg;
                this.flashTimer = 0.12; // Flashes red

                // Scale HP bar dynamically
                const percent = Math.max(0, this.hp / this.maxHp);
                this.hpFill.scale.x = percent;
                this.hpFill.position.x = - (1 - percent) * 0.35; // adjust anchor pivot

                if (this.hp <= 0) {
                    this.isDead = true;
                    this.die();
                }
            }

            die() {
                gameState.score += Math.round(15 * this.levelScalar);
                gameState.gold += ENEMY_SPECS.goldReward;
                updateStatsUI();
                particles.spawnExplosion(this.position, 0x38bdf8, 25);
                audio.playExplosion();
                this.cleanup();
            }

            cleanup() {
                scene.remove(this.mesh);
            }

            update(dt) {
                if (this.isDead) return;

                if (this.evolutionTier === 3 && Math.random() < 0.18) {
                    particles.spawnExplosion(this.position, 0xd946ef, 1);
                }

                // Handle Hit Flash Color Timer
                if (this.flashTimer > 0) {
                    this.flashTimer -= dt;
                    this.neonMat.color.setHex(0xef4444); // Flash bright red
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(this.slowTimer > 0 ? 0x06b6d4 : 0x38bdf8);
                    }
                }

                // Slow Timer decay
                let currentSpeed = this.speed;
                if (this.slowTimer > 0) {
                    this.slowTimer -= dt;
                    currentSpeed *= this.slowFactor;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0x06b6d4); // Cyan indicator
                    }
                } else {
                    this.slowFactor = 1.0;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0x38bdf8); // Standard cyan
                    }
                }

                // Make the floating health bar always orient towards the camera view
                this.hpBack.lookAt(camera.position);
                this.hpFill.lookAt(camera.position);

                // Step leg wiggling animation while walking
                this.legCycle += dt * currentSpeed * 8;
                this.legs.forEach(leg => {
                    const phase = leg.row * 1.5 + (leg.side > 0 ? Math.PI : 0);
                    leg.mesh.rotation.x = Math.sin(this.legCycle + phase) * 0.4;
                    leg.mesh.rotation.z = (0.5 + Math.cos(this.legCycle + phase) * 0.25) * leg.side;
                });

                // Flow Field Nav Logic (SDF Gradient movement)
                const currentWorldPos = gridToWorld(this.targetGridX, this.targetGridZ);
                const targetPos = new THREE.Vector3(currentWorldPos.x, 0.25, currentWorldPos.z);

                const distToStep = this.position.distanceTo(targetPos);
                if (distToStep < 0.1) {
                    // Snap position
                    this.gridX = this.targetGridX;
                    this.gridZ = this.targetGridZ;

                    // Arrived at Base Crystal!
                    if (this.gridX === BASE_COORD.x && this.gridZ === BASE_COORD.z) {
                        this.isDead = true;
                        gameState.health -= ENEMY_SPECS.damage;
                        updateStatsUI();
                        audio.playBaseDamage();
                        showToast(`BASE BREACHED! -${ENEMY_SPECS.damage} HP`, "red");
                        
                        // Flash base color purple to red temporarily
                        baseCrystal.material.color.setHex(0xef4444);
                        setTimeout(() => baseCrystal.material.color.setHex(0xec4899), 300);

                        this.cleanup();
                        checkGameOver();
                        return;
                    }

                    // Query SDF for next step coordinates
                    const nextStep = this.findSDFStep(this.gridX, this.gridZ);
                    this.targetGridX = nextStep.x;
                    this.targetGridZ = nextStep.z;
                } else {
                    // Navigate towards current target coordinate center
                    const dir = new THREE.Vector3().subVectors(targetPos, this.position).normalize();
                    this.position.addScaledVector(dir, currentSpeed * dt);
                    this.mesh.position.copy(this.position);

                    // Smooth head turning
                    const lookTarget = this.position.clone().add(dir);
                    this.mesh.lookAt(lookTarget);
                }
            }

            // Inspect 8-directional neighbors and walk towards the lowest SDF value
            findSDFStep(cx, cz) {
                const neighbors = [
                    { dx: 1, dz: 0 },
                    { dx: -1, dz: 0 },
                    { dx: 0, dz: 1 },
                    { dx: 0, dz: -1 },
                    { dx: 1, dz: 1 },
                    { dx: -1, dz: -1 },
                    { dx: 1, dz: -1 },
                    { dx: -1, dz: 1 }
                ];

                let bestStep = { x: cx, z: cz };
                let bestDist = sdfGrid[cx][cz];

                for (let n of neighbors) {
                    let nx = cx + n.dx;
                    let nz = cz + n.dz;
                    if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                        if (sdfGrid[nx][nz] < bestDist) {
                            bestDist = sdfGrid[nx][nz];
                            bestStep = { x: nx, z: nz };
                        }
                    }
                }
                return bestStep;
            }
        }

        class AntEnemy {
            constructor(spawnPoint) {
                this.gridX = spawnPoint.x;
                this.gridZ = spawnPoint.z;
                this.targetGridX = spawnPoint.x;
                this.targetGridZ = spawnPoint.z;

                const worldPos = gridToWorld(spawnPoint.x, spawnPoint.z);
                this.position = new THREE.Vector3(worldPos.x, 0.2, worldPos.z);

                this.levelScalar = 1.0 + (gameState.wave - 1) * 0.25;
                this.maxHp = Math.round(ENEMY_SPECS.hp * this.levelScalar * 0.6);
                this.speed = (ENEMY_SPECS.speed + (gameState.wave * 0.05)) * 1.5;
                this.evolutionTier = 1;
                if (gameState.wave >= 9) {
                    this.evolutionTier = 3;
                } else if (gameState.wave >= 5) {
                    this.evolutionTier = 2;
                }
                if (this.evolutionTier === 2) {
                    this.maxHp = Math.round(this.maxHp * 1.25);
                    this.speed *= 1.15;
                } else if (this.evolutionTier === 3) {
                    this.maxHp = Math.round(this.maxHp * 1.55);
                    this.speed *= 1.3;
                }
                this.hp = this.maxHp;
                this.isDead = false;
                this.flashTimer = 0;
                this.slowTimer = 0;
                this.slowFactor = 1.0;

                this.mesh = this.buildMesh();
                this.mesh.position.copy(this.position);
                scene.add(this.mesh);
                
                this.legCycle = Math.random() * 100;
            }

            buildMesh() {
                const group = new THREE.Group();

                // Segmented Ant body: Abdomen, Thorax, Head
                this.bodyMat = new THREE.MeshStandardMaterial({
                    color: 0x5a189a, // Deep violet
                    roughness: 0.2,
                    metalness: 0.8,
                    flatShading: true
                });

                // 1. Abdomen
                const abGeo = new THREE.SphereGeometry(0.24, 6, 6);
                const abdomen = new THREE.Mesh(abGeo, this.bodyMat);
                abdomen.position.set(0, 0, -0.35);
                abdomen.scale.set(1, 0.8, 1.4);
                abdomen.castShadow = true;
                group.add(abdomen);

                // 2. Thorax
                const thGeo = new THREE.SphereGeometry(0.16, 6, 6);
                const thorax = new THREE.Mesh(thGeo, this.bodyMat);
                thorax.position.set(0, 0.05, 0);
                thorax.scale.set(0.9, 0.9, 1.1);
                thorax.castShadow = true;
                group.add(thorax);

                // 3. Head
                const hdGeo = new THREE.SphereGeometry(0.18, 6, 6);
                const head = new THREE.Mesh(hdGeo, this.bodyMat);
                head.position.set(0, 0.08, 0.3);
                head.castShadow = true;
                group.add(head);

                // Bioluminescent strip (thorax top)
                const neonGeo = new THREE.BoxGeometry(0.06, 0.1, 0.25);
                this.neonMat = new THREE.MeshBasicMaterial({ color: 0xf97316 }); // Orange neon
                const neonStrip = new THREE.Mesh(neonGeo, this.neonMat);
                neonStrip.position.set(0, 0.2, 0);
                group.add(neonStrip);

                // Ant legs (6 legs)
                this.legs = [];
                const legGeo = new THREE.BoxGeometry(0.05, 0.35, 0.05);
                const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
                
                for (let i = 0; i < 6; i++) {
                    const leg = new THREE.Mesh(legGeo, legMat);
                    const isLeft = i % 2 === 0;
                    const side = isLeft ? -1 : 1;
                    const row = Math.floor(i / 2);

                    leg.position.set(0.25 * side, -0.15, (row - 1) * 0.18);
                    leg.rotation.z = 0.6 * side;
                    group.add(leg);
                    this.legs.push({ mesh: leg, side: side, row: row });
                }

                // HP Bar
                const barBackGeo = new THREE.PlaneGeometry(0.55, 0.06);
                const barBackMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
                this.hpBack = new THREE.Mesh(barBackGeo, barBackMat);
                this.hpBack.position.y = 0.7;
                group.add(this.hpBack);

                const barFillGeo = new THREE.PlaneGeometry(0.55, 0.06);
                this.hpFillMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 }); // Red HP fill
                this.hpFill = new THREE.Mesh(barFillGeo, this.hpFillMat);
                this.hpFill.position.set(0, 0.7, 0.01);
                group.add(this.hpFill);

                addEnemyEvolutionSpikes(group, this.evolutionTier);
                if (this.evolutionTier === 2) {
                    group.scale.multiplyScalar(1.2);
                } else if (this.evolutionTier === 3) {
                    group.scale.multiplyScalar(1.4);
                }
                return group;
            }

            applySlow(factor, duration) {
                this.slowFactor = Math.min(this.slowFactor, factor);
                this.slowTimer = Math.max(this.slowTimer, duration);
            }

            takeDamage(dmg) {
                if (this.isDead) return;
                this.hp -= dmg;
                this.flashTimer = 0.12;

                const percent = Math.max(0, this.hp / this.maxHp);
                this.hpFill.scale.x = percent;
                this.hpFill.position.x = - (1 - percent) * 0.275;

                if (this.hp <= 0) {
                    this.isDead = true;
                    this.die();
                }
            }

            die() {
                gameState.score += Math.round(10 * this.levelScalar);
                gameState.gold += 8;
                updateStatsUI();
                particles.spawnExplosion(this.position, 0xf97316, 15);
                audio.playExplosion();
                this.cleanup();
            }

            cleanup() {
                scene.remove(this.mesh);
            }

            update(dt) {
                if (this.isDead) return;

                if (this.evolutionTier === 3 && Math.random() < 0.18) {
                    particles.spawnExplosion(this.position, 0xd946ef, 1);
                }

                if (this.flashTimer > 0) {
                    this.flashTimer -= dt;
                    this.neonMat.color.setHex(0xef4444);
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(this.slowTimer > 0 ? 0x06b6d4 : 0xf97316);
                    }
                }

                let currentSpeed = this.speed;
                if (this.slowTimer > 0) {
                    this.slowTimer -= dt;
                    currentSpeed *= this.slowFactor;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0x06b6d4);
                    }
                } else {
                    this.slowFactor = 1.0;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0xf97316);
                    }
                }

                this.hpBack.lookAt(camera.position);
                this.hpFill.lookAt(camera.position);

                this.legCycle += dt * currentSpeed * 12;
                this.legs.forEach(leg => {
                    const phase = leg.row * 1.5 + (leg.side > 0 ? Math.PI : 0);
                    leg.mesh.rotation.x = Math.sin(this.legCycle + phase) * 0.45;
                    leg.mesh.rotation.z = (0.6 + Math.cos(this.legCycle + phase) * 0.2) * leg.side;
                });

                const currentWorldPos = gridToWorld(this.targetGridX, this.targetGridZ);
                const targetPos = new THREE.Vector3(currentWorldPos.x, 0.2, currentWorldPos.z);

                const distToStep = this.position.distanceTo(targetPos);
                if (distToStep < 0.15) {
                    this.gridX = this.targetGridX;
                    this.gridZ = this.targetGridZ;

                    if (this.gridX === BASE_COORD.x && this.gridZ === BASE_COORD.z) {
                        this.isDead = true;
                        gameState.health -= 1;
                        updateStatsUI();
                        audio.playBaseDamage();
                        showToast(`BASE BREACHED! -1 HP`, "red");
                        baseCrystal.material.color.setHex(0xef4444);
                        setTimeout(() => baseCrystal.material.color.setHex(0xec4899), 300);
                        this.cleanup();
                        checkGameOver();
                        return;
                    }

                    const nextStep = this.findSDFStep(this.gridX, this.gridZ);
                    this.targetGridX = nextStep.x;
                    this.targetGridZ = nextStep.z;
                } else {
                    const dir = new THREE.Vector3().subVectors(targetPos, this.position).normalize();
                    this.position.addScaledVector(dir, currentSpeed * dt);
                    this.mesh.position.copy(this.position);

                    const lookTarget = this.position.clone().add(dir);
                    this.mesh.lookAt(lookTarget);
                }
            }

            findSDFStep(cx, cz) {
                const neighbors = [
                    { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 },
                    { dx: 1, dz: 1 }, { dx: -1, dz: -1 }, { dx: 1, dz: -1 }, { dx: -1, dz: 1 }
                ];
                let bestStep = { x: cx, z: cz };
                let bestDist = sdfGrid[cx][cz];
                for (let n of neighbors) {
                    let nx = cx + n.dx;
                    let nz = cz + n.dz;
                    if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                        if (sdfGrid[nx][nz] < bestDist) {
                            bestDist = sdfGrid[nx][nz];
                            bestStep = { x: nx, z: nz };
                        }
                    }
                }
                return bestStep;
            }
        }

        class GolemEnemy {
            constructor(spawnPoint) {
                this.gridX = spawnPoint.x;
                this.gridZ = spawnPoint.z;
                this.targetGridX = spawnPoint.x;
                this.targetGridZ = spawnPoint.z;

                const worldPos = gridToWorld(spawnPoint.x, spawnPoint.z);
                this.position = new THREE.Vector3(worldPos.x, 0.35, worldPos.z);

                this.levelScalar = 1.0 + (gameState.wave - 1) * 0.25;
                this.maxHp = Math.round(ENEMY_SPECS.hp * this.levelScalar * 2.5);
                this.speed = (ENEMY_SPECS.speed + (gameState.wave * 0.05)) * 0.65;
                this.evolutionTier = 1;
                if (gameState.wave >= 9) {
                    this.evolutionTier = 3;
                } else if (gameState.wave >= 5) {
                    this.evolutionTier = 2;
                }
                if (this.evolutionTier === 2) {
                    this.maxHp = Math.round(this.maxHp * 1.25);
                    this.speed *= 1.15;
                } else if (this.evolutionTier === 3) {
                    this.maxHp = Math.round(this.maxHp * 1.55);
                    this.speed *= 1.3;
                }
                this.hp = this.maxHp;
                this.isDead = false;
                this.flashTimer = 0;
                this.slowTimer = 0;
                this.slowFactor = 1.0;

                this.mesh = this.buildMesh();
                this.mesh.position.copy(this.position);
                scene.add(this.mesh);
                
                this.legCycle = Math.random() * 100;
            }

            buildMesh() {
                const group = new THREE.Group();

                // Heavy stone carapace
                this.bodyMat = new THREE.MeshStandardMaterial({
                    color: 0x4b5563, // Stone grey
                    roughness: 0.95,
                    metalness: 0.05,
                    flatShading: true
                });

                const bodyGeo = new THREE.DodecahedronGeometry(0.5, 0);
                const body = new THREE.Mesh(bodyGeo, this.bodyMat);
                body.scale.set(1.1, 0.9, 1.2);
                body.castShadow = true;
                group.add(body);

                // Magma glows
                const neonGeo = new THREE.BoxGeometry(0.2, 0.1, 0.6);
                this.neonMat = new THREE.MeshBasicMaterial({ color: 0xea580c }); // Magma orange
                const magma = new THREE.Mesh(neonGeo, this.neonMat);
                magma.position.set(0, 0.45, 0);
                group.add(magma);

                // 4 thick stubby legs
                this.legs = [];
                const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 5);
                const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
                
                const legOffsets = [
                    { x: -0.4, z: -0.3, sx: -1, sz: -1 },
                    { x: 0.4, z: -0.3, sx: 1, sz: -1 },
                    { x: -0.4, z: 0.3, sx: -1, sz: 1 },
                    { x: 0.4, z: 0.3, sx: 1, sz: 1 }
                ];

                legOffsets.forEach((offset, i) => {
                    const leg = new THREE.Mesh(legGeo, legMat);
                    leg.position.set(offset.x, -0.3, offset.z);
                    leg.rotation.z = 0.3 * offset.sx;
                    group.add(leg);
                    this.legs.push({ mesh: leg, side: offset.sx, row: i < 2 ? 0 : 1 });
                });

                // HP Bar
                const barBackGeo = new THREE.PlaneGeometry(0.8, 0.08);
                const barBackMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
                this.hpBack = new THREE.Mesh(barBackGeo, barBackMat);
                this.hpBack.position.y = 1.3;
                group.add(this.hpBack);

                const barFillGeo = new THREE.PlaneGeometry(0.8, 0.08);
                this.hpFillMat = new THREE.MeshBasicMaterial({ color: 0xea580c });
                this.hpFill = new THREE.Mesh(barFillGeo, this.hpFillMat);
                this.hpFill.position.set(0, 1.3, 0.01);
                group.add(this.hpFill);

                addEnemyEvolutionSpikes(group, this.evolutionTier);
                if (this.evolutionTier === 2) {
                    group.scale.multiplyScalar(1.2);
                } else if (this.evolutionTier === 3) {
                    group.scale.multiplyScalar(1.4);
                }
                return group;
            }

            applySlow(factor, duration) {
                this.slowFactor = Math.min(this.slowFactor, factor);
                this.slowTimer = Math.max(this.slowTimer, duration);
            }

            takeDamage(dmg) {
                if (this.isDead) return;
                this.hp -= dmg;
                this.flashTimer = 0.12;

                const percent = Math.max(0, this.hp / this.maxHp);
                this.hpFill.scale.x = percent;
                this.hpFill.position.x = - (1 - percent) * 0.4;

                if (this.hp <= 0) {
                    this.isDead = true;
                    this.die();
                }
            }

            die() {
                gameState.score += Math.round(30 * this.levelScalar);
                gameState.gold += ENEMY_SPECS.goldReward * 2;
                updateStatsUI();
                particles.spawnExplosion(this.position, 0xea580c, 30);
                audio.playExplosion();
                this.cleanup();
            }

            cleanup() {
                scene.remove(this.mesh);
            }

            update(dt) {
                if (this.isDead) return;

                if (this.evolutionTier === 3 && Math.random() < 0.18) {
                    particles.spawnExplosion(this.position, 0xd946ef, 1);
                }

                if (this.flashTimer > 0) {
                    this.flashTimer -= dt;
                    this.neonMat.color.setHex(0xef4444);
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(this.slowTimer > 0 ? 0x06b6d4 : 0xea580c);
                    }
                }

                let currentSpeed = this.speed;
                if (this.slowTimer > 0) {
                    this.slowTimer -= dt;
                    currentSpeed *= this.slowFactor;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0x06b6d4);
                    }
                } else {
                    this.slowFactor = 1.0;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0xea580c);
                    }
                }

                this.hpBack.lookAt(camera.position);
                this.hpFill.lookAt(camera.position);

                // Heavy stamp animation
                this.legCycle += dt * currentSpeed * 6;
                this.legs.forEach(leg => {
                    const phase = leg.row * 2.0 + (leg.side > 0 ? Math.PI : 0);
                    leg.mesh.rotation.x = Math.sin(this.legCycle + phase) * 0.35;
                    leg.mesh.rotation.z = (0.3 + Math.cos(this.legCycle + phase) * 0.15) * leg.side;
                });

                const currentWorldPos = gridToWorld(this.targetGridX, this.targetGridZ);
                const targetPos = new THREE.Vector3(currentWorldPos.x, 0.35, currentWorldPos.z);

                const distToStep = this.position.distanceTo(targetPos);
                if (distToStep < 0.1) {
                    this.gridX = this.targetGridX;
                    this.gridZ = this.targetGridZ;

                    if (this.gridX === BASE_COORD.x && this.gridZ === BASE_COORD.z) {
                        this.isDead = true;
                        gameState.health -= 2;
                        updateStatsUI();
                        audio.playBaseDamage();
                        showToast(`BASE BREACHED! -2 HP`, "red");
                        baseCrystal.material.color.setHex(0xef4444);
                        setTimeout(() => baseCrystal.material.color.setHex(0xec4899), 300);
                        this.cleanup();
                        checkGameOver();
                        return;
                    }

                    const nextStep = this.findSDFStep(this.gridX, this.gridZ);
                    this.targetGridX = nextStep.x;
                    this.targetGridZ = nextStep.z;
                } else {
                    const dir = new THREE.Vector3().subVectors(targetPos, this.position).normalize();
                    this.position.addScaledVector(dir, currentSpeed * dt);
                    this.mesh.position.copy(this.position);

                    const lookTarget = this.position.clone().add(dir);
                    this.mesh.lookAt(lookTarget);
                }
            }

            findSDFStep(cx, cz) {
                const neighbors = [
                    { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 },
                    { dx: 1, dz: 1 }, { dx: -1, dz: -1 }, { dx: 1, dz: -1 }, { dx: -1, dz: 1 }
                ];
                let bestStep = { x: cx, z: cz };
                let bestDist = sdfGrid[cx][cz];
                for (let n of neighbors) {
                    let nx = cx + n.dx;
                    let nz = cz + n.dz;
                    if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                        if (sdfGrid[nx][nz] < bestDist) {
                            bestDist = sdfGrid[nx][nz];
                            bestStep = { x: nx, z: nz };
                        }
                    }
                }
                return bestStep;
            }
        }

        class WaspEnemy {
            constructor(spawnPoint) {
                this.gridX = spawnPoint.x;
                this.gridZ = spawnPoint.z;
                this.targetGridX = spawnPoint.x;
                this.targetGridZ = spawnPoint.z;

                const worldPos = gridToWorld(spawnPoint.x, spawnPoint.z);
                this.position = new THREE.Vector3(worldPos.x, 1.0, worldPos.z);

                this.levelScalar = 1.0 + (gameState.wave - 1) * 0.25;
                this.maxHp = Math.round(ENEMY_SPECS.hp * this.levelScalar * 0.5);
                this.speed = (ENEMY_SPECS.speed + (gameState.wave * 0.05)) * 1.7;
                this.evolutionTier = 1;
                if (gameState.wave >= 9) {
                    this.evolutionTier = 3;
                } else if (gameState.wave >= 5) {
                    this.evolutionTier = 2;
                }
                if (this.evolutionTier === 2) {
                    this.maxHp = Math.round(this.maxHp * 1.25);
                    this.speed *= 1.15;
                } else if (this.evolutionTier === 3) {
                    this.maxHp = Math.round(this.maxHp * 1.55);
                    this.speed *= 1.3;
                }
                this.hp = this.maxHp;
                this.isDead = false;
                this.flashTimer = 0;
                this.slowTimer = 0;
                this.slowFactor = 1.0;

                this.mesh = this.buildMesh();
                this.mesh.position.copy(this.position);
                scene.add(this.mesh);
                
                this.wingCycle = Math.random() * 100;
            }

            buildMesh() {
                const group = new THREE.Group();

                this.bodyMat = new THREE.MeshStandardMaterial({
                    color: 0xca8a04, // Yellow wasp
                    roughness: 0.15,
                    metalness: 0.8,
                    flatShading: true
                });

                // Abdomen
                const abGeo = new THREE.ConeGeometry(0.18, 0.8, 5);
                const abdomen = new THREE.Mesh(abGeo, this.bodyMat);
                abdomen.rotation.x = -Math.PI / 3;
                abdomen.position.set(0, 0, -0.3);
                abdomen.castShadow = true;
                group.add(abdomen);

                // Thorax
                const thGeo = new THREE.SphereGeometry(0.15, 6, 6);
                const thorax = new THREE.Mesh(thGeo, this.bodyMat);
                thorax.position.set(0, 0.05, 0.1);
                thorax.castShadow = true;
                group.add(thorax);

                // Head
                const hdGeo = new THREE.SphereGeometry(0.14, 6, 6);
                const head = new THREE.Mesh(hdGeo, this.bodyMat);
                head.position.set(0, 0.08, 0.25);
                group.add(head);

                // Glowing yellow stripe
                const neonGeo = new THREE.BoxGeometry(0.04, 0.08, 0.2);
                this.neonMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
                const neon = new THREE.Mesh(neonGeo, this.neonMat);
                neon.position.set(0, 0.2, 0.1);
                group.add(neon);

                // Wing Left
                const wingGeo = new THREE.BoxGeometry(0.4, 0.02, 0.15);
                const wingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
                
                this.wingL = new THREE.Mesh(wingGeo, wingMat);
                this.wingL.position.set(-0.35, 0.15, 0);
                this.wingL.rotation.y = 0.2;
                group.add(this.wingL);

                // Wing Right
                this.wingR = new THREE.Mesh(wingGeo, wingMat);
                this.wingR.position.set(0.35, 0.15, 0);
                this.wingR.rotation.y = -0.2;
                group.add(this.wingR);

                // HP Bar
                const barBackGeo = new THREE.PlaneGeometry(0.5, 0.06);
                const barBackMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
                this.hpBack = new THREE.Mesh(barBackGeo, barBackMat);
                this.hpBack.position.y = 0.8;
                group.add(this.hpBack);

                const barFillGeo = new THREE.PlaneGeometry(0.5, 0.06);
                this.hpFillMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
                this.hpFill = new THREE.Mesh(barFillGeo, this.hpFillMat);
                this.hpFill.position.set(0, 0.8, 0.01);
                group.add(this.hpFill);

                addEnemyEvolutionSpikes(group, this.evolutionTier);
                if (this.evolutionTier === 2) {
                    group.scale.multiplyScalar(1.2);
                } else if (this.evolutionTier === 3) {
                    group.scale.multiplyScalar(1.4);
                }
                return group;
            }

            applySlow(factor, duration) {
                this.slowFactor = Math.min(this.slowFactor, factor);
                this.slowTimer = Math.max(this.slowTimer, duration);
            }

            takeDamage(dmg) {
                if (this.isDead) return;
                this.hp -= dmg;
                this.flashTimer = 0.12;

                const percent = Math.max(0, this.hp / this.maxHp);
                this.hpFill.scale.x = percent;
                this.hpFill.position.x = - (1 - percent) * 0.25;

                if (this.hp <= 0) {
                    this.isDead = true;
                    this.die();
                }
            }

            die() {
                gameState.score += Math.round(10 * this.levelScalar);
                gameState.gold += ENEMY_SPECS.goldReward;
                updateStatsUI();
                particles.spawnExplosion(this.position, 0xfacc15, 20);
                audio.playExplosion();
                this.cleanup();
            }

            cleanup() {
                scene.remove(this.mesh);
            }

            update(dt) {
                if (this.isDead) return;

                if (this.evolutionTier === 3 && Math.random() < 0.18) {
                    particles.spawnExplosion(this.position, 0xd946ef, 1);
                }

                if (this.flashTimer > 0) {
                    this.flashTimer -= dt;
                    this.neonMat.color.setHex(0xef4444);
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(this.slowTimer > 0 ? 0x06b6d4 : 0xfacc15);
                    }
                }

                let currentSpeed = this.speed;
                if (this.slowTimer > 0) {
                    this.slowTimer -= dt;
                    currentSpeed *= this.slowFactor;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0x06b6d4);
                    }
                } else {
                    this.slowFactor = 1.0;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0xfacc15);
                    }
                }

                this.hpBack.lookAt(camera.position);
                this.hpFill.lookAt(camera.position);

                // Wing flap
                this.wingCycle += dt * 38;
                this.wingL.rotation.z = Math.sin(this.wingCycle) * 0.5;
                this.wingR.rotation.z = -Math.sin(this.wingCycle) * 0.5;

                // Bobbing flight
                this.position.y = 1.0 + Math.sin(this.wingCycle * 0.15) * 0.12;

                const currentWorldPos = gridToWorld(this.targetGridX, this.targetGridZ);
                const targetPos = new THREE.Vector3(currentWorldPos.x, this.position.y, currentWorldPos.z);

                const distToStep = this.position.distanceTo(targetPos);
                if (distToStep < 0.15) {
                    this.gridX = this.targetGridX;
                    this.gridZ = this.targetGridZ;

                    if (this.gridX === BASE_COORD.x && this.gridZ === BASE_COORD.z) {
                        this.isDead = true;
                        gameState.health -= 1;
                        updateStatsUI();
                        audio.playBaseDamage();
                        showToast(`BASE BREACHED! -1 HP`, "red");
                        baseCrystal.material.color.setHex(0xef4444);
                        setTimeout(() => baseCrystal.material.color.setHex(0xec4899), 300);
                        this.cleanup();
                        checkGameOver();
                        return;
                    }

                    const nextStep = this.findSDFStep(this.gridX, this.gridZ);
                    this.targetGridX = nextStep.x;
                    this.targetGridZ = nextStep.z;
                } else {
                    const dir = new THREE.Vector3().subVectors(targetPos, this.position).normalize();
                    this.position.addScaledVector(dir, currentSpeed * dt);
                    this.mesh.position.copy(this.position);

                    const lookTarget = this.position.clone().add(dir);
                    this.mesh.lookAt(lookTarget);
                }
            }

            findSDFStep(cx, cz) {
                const neighbors = [
                    { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 },
                    { dx: 1, dz: 1 }, { dx: -1, dz: -1 }, { dx: 1, dz: -1 }, { dx: -1, dz: 1 }
                ];
                let bestStep = { x: cx, z: cz };
                let bestDist = sdfGrid[cx][cz];
                for (let n of neighbors) {
                    let nx = cx + n.dx;
                    let nz = cz + n.dz;
                    if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                        if (sdfGrid[nx][nz] < bestDist) {
                            bestDist = sdfGrid[nx][nz];
                            bestStep = { x: nx, z: nz };
                        }
                    }
                }
                return bestStep;
            }
        }

        class CarrierEnemy {
            constructor(spawnPoint) {
                this.gridX = spawnPoint.x;
                this.gridZ = spawnPoint.z;
                this.targetGridX = spawnPoint.x;
                this.targetGridZ = spawnPoint.z;

                const worldPos = gridToWorld(spawnPoint.x, spawnPoint.z);
                this.position = new THREE.Vector3(worldPos.x, 0.3, worldPos.z);

                this.levelScalar = 1.0 + (gameState.wave - 1) * 0.25;
                this.maxHp = Math.round(ENEMY_SPECS.hp * this.levelScalar * 1.8);
                this.speed = (ENEMY_SPECS.speed + (gameState.wave * 0.05)) * 0.8;
                this.evolutionTier = 1;
                if (gameState.wave >= 9) {
                    this.evolutionTier = 3;
                } else if (gameState.wave >= 5) {
                    this.evolutionTier = 2;
                }
                if (this.evolutionTier === 2) {
                    this.maxHp = Math.round(this.maxHp * 1.25);
                    this.speed *= 1.15;
                } else if (this.evolutionTier === 3) {
                    this.maxHp = Math.round(this.maxHp * 1.55);
                    this.speed *= 1.3;
                }
                this.hp = this.maxHp;
                this.isDead = false;
                this.flashTimer = 0;
                this.slowTimer = 0;
                this.slowFactor = 1.0;

                this.mesh = this.buildMesh();
                this.mesh.position.copy(this.position);
                scene.add(this.mesh);
                
                this.legCycle = Math.random() * 100;
            }

            buildMesh() {
                const group = new THREE.Group();
                group.scale.set(1.25, 1.25, 1.25);

                this.bodyMat = new THREE.MeshStandardMaterial({
                    color: 0x701a75, // Bloated purple
                    roughness: 0.35,
                    metalness: 0.7,
                    flatShading: true
                });

                // Abdomen
                const abGeo = new THREE.SphereGeometry(0.3, 8, 8);
                const abdomen = new THREE.Mesh(abGeo, this.bodyMat);
                abdomen.scale.set(1.1, 1.0, 1.5);
                abdomen.position.set(0, 0, -0.3);
                abdomen.castShadow = true;
                group.add(abdomen);

                // Thorax
                const thGeo = new THREE.SphereGeometry(0.2, 6, 6);
                const thorax = new THREE.Mesh(thGeo, this.bodyMat);
                thorax.position.set(0, 0.05, 0.15);
                thorax.castShadow = true;
                group.add(thorax);

                // Head
                const hdGeo = new THREE.SphereGeometry(0.18, 6, 6);
                const head = new THREE.Mesh(hdGeo, this.bodyMat);
                head.position.set(0, 0.08, 0.4);
                group.add(head);

                // Spore pods
                const podGeo = new THREE.SphereGeometry(0.1, 5, 5);
                this.neonMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
                
                const pod1 = new THREE.Mesh(podGeo, this.neonMat);
                pod1.position.set(-0.15, 0.28, -0.2);
                group.add(pod1);

                const pod2 = new THREE.Mesh(podGeo, this.neonMat);
                pod2.position.set(0.15, 0.28, -0.2);
                group.add(pod2);

                const pod3 = new THREE.Mesh(podGeo, this.neonMat);
                pod3.position.set(0, 0.32, -0.45);
                group.add(pod3);

                // Legs
                this.legs = [];
                const legGeo = new THREE.BoxGeometry(0.06, 0.4, 0.06);
                const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
                
                for (let i = 0; i < 6; i++) {
                    const leg = new THREE.Mesh(legGeo, legMat);
                    const isLeft = i % 2 === 0;
                    const side = isLeft ? -1 : 1;
                    const row = Math.floor(i / 2);

                    leg.position.set(0.35 * side, -0.2, (row - 1) * 0.2);
                    leg.rotation.z = 0.55 * side;
                    group.add(leg);
                    this.legs.push({ mesh: leg, side: side, row: row });
                }

                // HP Bar
                const barBackGeo = new THREE.PlaneGeometry(0.7, 0.07);
                const barBackMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
                this.hpBack = new THREE.Mesh(barBackGeo, barBackMat);
                this.hpBack.position.y = 1.0;
                group.add(this.hpBack);

                const barFillGeo = new THREE.PlaneGeometry(0.7, 0.07);
                this.hpFillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
                this.hpFill = new THREE.Mesh(barFillGeo, this.hpFillMat);
                this.hpFill.position.set(0, 1.0, 0.01);
                group.add(this.hpFill);

                addEnemyEvolutionSpikes(group, this.evolutionTier);
                if (this.evolutionTier === 2) {
                    group.scale.multiplyScalar(1.2);
                } else if (this.evolutionTier === 3) {
                    group.scale.multiplyScalar(1.4);
                }
                return group;
            }

            applySlow(factor, duration) {
                this.slowFactor = Math.min(this.slowFactor, factor);
                this.slowTimer = Math.max(this.slowTimer, duration);
            }

            takeDamage(dmg) {
                if (this.isDead) return;
                this.hp -= dmg;
                this.flashTimer = 0.12;

                const percent = Math.max(0, this.hp / this.maxHp);
                this.hpFill.scale.x = percent;
                this.hpFill.position.x = - (1 - percent) * 0.35;

                if (this.hp <= 0) {
                    this.isDead = true;
                    this.die();
                }
            }

            die() {
                gameState.score += Math.round(40 * this.levelScalar);
                gameState.gold += ENEMY_SPECS.goldReward * 1.5;
                updateStatsUI();
                particles.spawnExplosion(this.position, 0x86198f, 35);
                audio.playExplosion();
                
                if (enemies.length < 150) {
                    const spawn = { x: this.gridX, z: this.gridZ };
                    enemies.push(new ScarabEnemy(spawn));
                    enemies.push(new ScarabEnemy(spawn));
                }

                this.cleanup();
            }

            cleanup() {
                scene.remove(this.mesh);
            }

            update(dt) {
                if (this.isDead) return;

                if (this.evolutionTier === 3 && Math.random() < 0.18) {
                    particles.spawnExplosion(this.position, 0xd946ef, 1);
                }

                if (this.flashTimer > 0) {
                    this.flashTimer -= dt;
                    this.neonMat.color.setHex(0xef4444);
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(this.slowTimer > 0 ? 0x06b6d4 : 0x22c55e);
                    }
                }

                let currentSpeed = this.speed;
                if (this.slowTimer > 0) {
                    this.slowTimer -= dt;
                    currentSpeed *= this.slowFactor;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0x06b6d4);
                    }
                } else {
                    this.slowFactor = 1.0;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0x22c55e);
                    }
                }

                this.hpBack.lookAt(camera.position);
                this.hpFill.lookAt(camera.position);

                // Legs walking
                this.legCycle += dt * currentSpeed * 9;
                this.legs.forEach(leg => {
                    const phase = leg.row * 1.5 + (leg.side > 0 ? Math.PI : 0);
                    leg.mesh.rotation.x = Math.sin(this.legCycle + phase) * 0.4;
                    leg.mesh.rotation.z = (0.55 + Math.cos(this.legCycle + phase) * 0.2) * leg.side;
                });

                const currentWorldPos = gridToWorld(this.targetGridX, this.targetGridZ);
                const targetPos = new THREE.Vector3(currentWorldPos.x, 0.3, currentWorldPos.z);

                const distToStep = this.position.distanceTo(targetPos);
                if (distToStep < 0.1) {
                    this.gridX = this.targetGridX;
                    this.gridZ = this.targetGridZ;

                    if (this.gridX === BASE_COORD.x && this.gridZ === BASE_COORD.z) {
                        this.isDead = true;
                        gameState.health -= 1;
                        updateStatsUI();
                        audio.playBaseDamage();
                        showToast(`BASE BREACHED! -1 HP`, "red");
                        baseCrystal.material.color.setHex(0xef4444);
                        setTimeout(() => baseCrystal.material.color.setHex(0xec4899), 300);
                        this.cleanup();
                        checkGameOver();
                        return;
                    }

                    const nextStep = this.findSDFStep(this.gridX, this.gridZ);
                    this.targetGridX = nextStep.x;
                    this.targetGridZ = nextStep.z;
                } else {
                    const dir = new THREE.Vector3().subVectors(targetPos, this.position).normalize();
                    this.position.addScaledVector(dir, currentSpeed * dt);
                    this.mesh.position.copy(this.position);

                    const lookTarget = this.position.clone().add(dir);
                    this.mesh.lookAt(lookTarget);
                }
            }

            findSDFStep(cx, cz) {
                const neighbors = [
                    { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 },
                    { dx: 1, dz: 1 }, { dx: -1, dz: -1 }, { dx: 1, dz: -1 }, { dx: -1, dz: 1 }
                ];
                let bestStep = { x: cx, z: cz };
                let bestDist = sdfGrid[cx][cz];
                for (let n of neighbors) {
                    let nx = cx + n.dx;
                    let nz = cz + n.dz;
                    if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                        if (sdfGrid[nx][nz] < bestDist) {
                            bestDist = sdfGrid[nx][nz];
                            bestStep = { x: nx, z: nz };
                        }
                    }
                }
                return bestStep;
            }
        }

        class UfoEnemy {
            constructor(spawnPoint) {
                this.gridX = spawnPoint.x;
                this.gridZ = spawnPoint.z;

                const worldPos = gridToWorld(spawnPoint.x, spawnPoint.z);
                this.position = new THREE.Vector3(worldPos.x, 1.8, worldPos.z);

                const baseWorld = gridToWorld(BASE_COORD.x, BASE_COORD.z);
                this.targetPos = new THREE.Vector3(baseWorld.x, 1.8, baseWorld.z);

                this.levelScalar = 1.0 + (gameState.wave - 1) * 0.25;
                this.maxHp = Math.round(ENEMY_SPECS.hp * this.levelScalar * 1.3);
                this.speed = (ENEMY_SPECS.speed + (gameState.wave * 0.05)) * 0.75;
                this.evolutionTier = 1;
                if (gameState.wave >= 9) {
                    this.evolutionTier = 3;
                } else if (gameState.wave >= 5) {
                    this.evolutionTier = 2;
                }
                if (this.evolutionTier === 2) {
                    this.maxHp = Math.round(this.maxHp * 1.25);
                    this.speed *= 1.15;
                } else if (this.evolutionTier === 3) {
                    this.maxHp = Math.round(this.maxHp * 1.55);
                    this.speed *= 1.3;
                }
                this.hp = this.maxHp;
                this.isDead = false;
                this.flashTimer = 0;
                this.slowTimer = 0;
                this.slowFactor = 1.0;
                this.attackCooldown = Math.random() * 2.0 + 1.0; // Randomize initial attack delay

                this.mesh = this.buildMesh();
                this.mesh.position.copy(this.position);
                scene.add(this.mesh);
            }

            buildMesh() {
                const group = new THREE.Group();

                // 1. Saucer body (Flattened Cylinder)
                const bodyGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.12, 10);
                this.bodyMat = new THREE.MeshStandardMaterial({
                    color: 0x334155,
                    roughness: 0.1,
                    metalness: 0.95
                });
                const saucer = new THREE.Mesh(bodyGeo, this.bodyMat);
                saucer.scale.set(1.4, 1.0, 1.4);
                saucer.castShadow = true;
                group.add(saucer);

                // 2. Glass Dome
                const domeGeo = new THREE.SphereGeometry(0.24, 8, 8, 0, Math.PI*2, 0, Math.PI/2);
                const domeMat = new THREE.MeshStandardMaterial({
                    color: 0x0284c7,
                    transparent: true,
                    opacity: 0.6,
                    roughness: 0.05
                });
                const dome = new THREE.Mesh(domeGeo, domeMat);
                dome.position.y = 0.06;
                dome.scale.set(1.1, 1.1, 1.1);
                group.add(dome);

                // 3. Central Thruster
                const thrustGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.1, 8);
                this.neonMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
                const thruster = new THREE.Mesh(thrustGeo, this.neonMat);
                thruster.position.y = -0.08;
                group.add(thruster);

                // 4. Downward glowing tractor beam visual (Translucent Cone)
                const coneGeo = new THREE.ConeGeometry(0.35, 1.8, 8, 1, true);
                const coneMat = new THREE.MeshBasicMaterial({
                    color: 0xa855f7,
                    transparent: true,
                    opacity: 0.12,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide
                });
                const beam = new THREE.Mesh(coneGeo, coneMat);
                beam.position.y = -0.9;
                group.add(beam);

                // HP Bar
                const barBackGeo = new THREE.PlaneGeometry(0.8, 0.08);
                const barBackMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
                this.hpBack = new THREE.Mesh(barBackGeo, barBackMat);
                this.hpBack.position.y = 0.6;
                group.add(this.hpBack);

                const barFillGeo = new THREE.PlaneGeometry(0.8, 0.08);
                this.hpFillMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
                this.hpFill = new THREE.Mesh(barFillGeo, this.hpFillMat);
                this.hpFill.position.set(0, 0.6, 0.01);
                group.add(this.hpFill);

                addEnemyEvolutionSpikes(group, this.evolutionTier);
                if (this.evolutionTier === 2) {
                    group.scale.multiplyScalar(1.2);
                } else if (this.evolutionTier === 3) {
                    group.scale.multiplyScalar(1.4);
                }
                return group;
            }

            applySlow(factor, duration) {
                this.slowFactor = Math.min(this.slowFactor, factor);
                this.slowTimer = Math.max(this.slowTimer, duration);
            }

            takeDamage(dmg) {
                if (this.isDead) return;
                this.hp -= dmg;
                this.flashTimer = 0.12;

                const percent = Math.max(0, this.hp / this.maxHp);
                this.hpFill.scale.x = percent;
                this.hpFill.position.x = - (1 - percent) * 0.4;

                if (this.hp <= 0) {
                    this.isDead = true;
                    this.die();
                }
            }

            die() {
                gameState.score += Math.round(20 * this.levelScalar);
                gameState.gold += 18;
                updateStatsUI();
                particles.spawnExplosion(this.position, 0xa855f7, 30);
                audio.playExplosion();
                this.cleanup();
            }

            cleanup() {
                scene.remove(this.mesh);
            }

            update(dt) {
                if (this.isDead) return;

                if (this.evolutionTier === 3 && Math.random() < 0.18) {
                    particles.spawnExplosion(this.position, 0xd946ef, 1);
                }

                // Disabling EMP beam weapon attacks towers
                this.attackCooldown -= dt;
                if (this.attackCooldown <= 0) {
                    this.attackCooldown = 4.0; // 4 second attack rate
                    let targetTower = null;
                    let closestDist = 12.0; // 12 unit weapon range
                    
                    for (let tower of towers) {
                        if (tower.disabledTimer && tower.disabledTimer > 0) continue;
                        const dist = this.position.distanceTo(tower.position);
                        if (dist < closestDist) {
                            closestDist = dist;
                            targetTower = tower;
                        }
                    }

                    if (targetTower) {
                        targetTower.disabledTimer = 3.0; // Disable for 3 seconds
                        
                        // Spawn Cylinder Beam mesh representing the tractor energy
                        const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, closestDist, 6);
                        const beamMat = new THREE.MeshBasicMaterial({
                            color: 0xa855f7,
                            transparent: true,
                            opacity: 0.8,
                            blending: THREE.AdditiveBlending
                        });
                        const beamMesh = new THREE.Mesh(beamGeo, beamMat);
                        
                        const midPoint = new THREE.Vector3().addVectors(this.position, targetTower.position).multiplyScalar(0.5);
                        beamMesh.position.copy(midPoint);
                        
                        beamMesh.lookAt(targetTower.position);
                        beamMesh.rotation.x += Math.PI / 2;
                        scene.add(beamMesh);

                        audio.playLaserShoot();

                        setTimeout(() => {
                            scene.remove(beamMesh);
                            beamGeo.dispose();
                            beamMat.dispose();
                        }, 180);
                    }
                }

                if (this.flashTimer > 0) {
                    this.flashTimer -= dt;
                    this.neonMat.color.setHex(0xef4444);
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(this.slowTimer > 0 ? 0x06b6d4 : 0xa855f7);
                    }
                }

                let currentSpeed = this.speed;
                if (this.slowTimer > 0) {
                    this.slowTimer -= dt;
                    currentSpeed *= this.slowFactor;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0x06b6d4);
                    }
                } else {
                    this.slowFactor = 1.0;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0xa855f7);
                    }
                }

                this.hpBack.lookAt(camera.position);
                this.hpFill.lookAt(camera.position);

                // Saucer spin animation
                this.mesh.rotation.y += dt * 2.0;

                // Move directly toward target center in straight line (ignores SDF grid mapping)
                const distToTarget = this.position.distanceTo(this.targetPos);
                if (distToTarget < 0.25) {
                    this.isDead = true;
                    gameState.health -= 2; // Deals double damage
                    updateStatsUI();
                    audio.playBaseDamage();
                    showToast(`NEXUS BREACHED by UFO! -2 HP`, "red");
                    baseCrystal.material.color.setHex(0xef4444);
                    setTimeout(() => baseCrystal.material.color.setHex(0xec4899), 300);
                    this.cleanup();
                    checkGameOver();
                    return;
                }

                const dir = new THREE.Vector3().subVectors(this.targetPos, this.position).normalize();
                this.position.addScaledVector(dir, currentSpeed * dt);
                this.mesh.position.copy(this.position);
            }
        }

        /* ==========================================
           TACTICAL CAMOUFLAGE INFILTRATOR (Stealth)
           ========================================== */
        class StealthEnemy {
            constructor(spawnPoint) {
                this.gridX = spawnPoint.x;
                this.gridZ = spawnPoint.z;
                this.targetGridX = spawnPoint.x;
                this.targetGridZ = spawnPoint.z;

                const worldPos = gridToWorld(spawnPoint.x, spawnPoint.z);
                this.position = new THREE.Vector3(worldPos.x, 0.22, worldPos.z);

                this.levelScalar = 1.0 + (gameState.wave - 1) * 0.25;
                this.maxHp = Math.round(ENEMY_SPECS.hp * this.levelScalar * 0.75);
                this.speed = (ENEMY_SPECS.speed + (gameState.wave * 0.05)) * 1.25;
                this.evolutionTier = 1;
                this.hp = this.maxHp;
                this.isDead = false;
                this.isStealth = true;
                this.flashTimer = 0;
                this.slowTimer = 0;
                this.slowFactor = 1.0;

                this.mesh = this.buildMesh();
                this.mesh.position.copy(this.position);
                scene.add(this.mesh);

                this.legCycle = Math.random() * 100;
            }

            buildMesh() {
                const group = new THREE.Group();

                // Stealth cloaked shell (highly translucent)
                const shellGeo = new THREE.OctahedronGeometry(0.3, 1);
                this.bodyMat = new THREE.MeshStandardMaterial({
                    color: 0x6b21a8,
                    transparent: true,
                    opacity: 0.18,
                    roughness: 0.05,
                    metalness: 0.95
                });
                const shell = new THREE.Mesh(shellGeo, this.bodyMat);
                shell.scale.set(1.1, 0.7, 1.4);
                shell.castShadow = true;
                group.add(shell);

                // Small purple glowing visor lens
                const visorGeo = new THREE.BoxGeometry(0.12, 0.03, 0.03);
                this.neonMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.8 });
                const visor = new THREE.Mesh(visorGeo, this.neonMat);
                visor.position.set(0, 0.05, 0.25);
                group.add(visor);

                // 6 thin insect legs
                this.legs = [];
                const legGeo = new THREE.BoxGeometry(0.04, 0.35, 0.04);
                const legMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.5, transparent: true, opacity: 0.25 });
                for (let i = 0; i < 6; i++) {
                    const leg = new THREE.Mesh(legGeo, legMat);
                    const isLeft = i % 2 === 0;
                    const side = isLeft ? -1 : 1;
                    const row = Math.floor(i / 2);
                    leg.position.set(0.3 * side, -0.18, (row - 1) * 0.2);
                    leg.rotation.z = 0.65 * side;
                    group.add(leg);
                    this.legs.push({ mesh: leg, side: side, row: row });
                }

                // HP Bar
                const barBackGeo = new THREE.PlaneGeometry(0.55, 0.07);
                const barBackMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
                this.hpBack = new THREE.Mesh(barBackGeo, barBackMat);
                this.hpBack.position.y = 0.8;
                group.add(this.hpBack);

                const barFillGeo = new THREE.PlaneGeometry(0.55, 0.07);
                this.hpFillMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
                this.hpFill = new THREE.Mesh(barFillGeo, this.hpFillMat);
                this.hpFill.position.set(0, 0.8, 0.01);
                group.add(this.hpFill);

                return group;
            }

            applySlow(factor, duration) {
                this.slowFactor = Math.min(this.slowFactor, factor);
                this.slowTimer = Math.max(this.slowTimer, duration);
            }

            takeDamage(dmg, isExplosionOrLaser = false) {
                if (this.isDead) return;
                this.hp -= dmg;
                this.flashTimer = 0.12;

                const percent = Math.max(0, this.hp / this.maxHp);
                this.hpFill.scale.x = percent;
                this.hpFill.position.x = - (1 - percent) * 0.275;

                if (this.hp <= 0) {
                    this.isDead = true;
                    this.die();
                }
            }

            die() {
                gameState.score += Math.round(18 * this.levelScalar);
                gameState.gold += 15;
                updateStatsUI();
                particles.spawnExplosion(this.position, 0xc084fc, 18);
                audio.playExplosion();
                this.cleanup();
            }

            cleanup() {
                scene.remove(this.mesh);
            }

            update(dt) {
                if (this.isDead) return;

                if (this.flashTimer > 0) {
                    this.flashTimer -= dt;
                    this.neonMat.color.setHex(0xef4444);
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(this.slowTimer > 0 ? 0x06b6d4 : 0xc084fc);
                    }
                }

                let currentSpeed = this.speed;
                if (this.slowTimer > 0) {
                    this.slowTimer -= dt;
                    currentSpeed *= this.slowFactor;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0x06b6d4);
                    }
                } else {
                    this.slowFactor = 1.0;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0xc084fc);
                    }
                }

                this.hpBack.lookAt(camera.position);
                this.hpFill.lookAt(camera.position);

                // Leg movement
                this.legCycle += dt * currentSpeed * 9;
                this.legs.forEach(leg => {
                    const phase = leg.row * 1.5 + (leg.side > 0 ? Math.PI : 0);
                    leg.mesh.rotation.x = Math.sin(this.legCycle + phase) * 0.4;
                    leg.mesh.rotation.z = (0.65 + Math.cos(this.legCycle + phase) * 0.25) * leg.side;
                });

                // Follow flow field path
                const currentWorldPos = gridToWorld(this.targetGridX, this.targetGridZ);
                const targetPos = new THREE.Vector3(currentWorldPos.x, 0.22, currentWorldPos.z);
                const distToStep = this.position.distanceTo(targetPos);

                if (distToStep < 0.1) {
                    this.gridX = this.targetGridX;
                    this.gridZ = this.targetGridZ;

                    if (this.gridX === BASE_COORD.x && this.gridZ === BASE_COORD.z) {
                        this.isDead = true;
                        gameState.health -= 1;
                        updateStatsUI();
                        audio.playBaseDamage();
                        showToast(`BASE CLOAK BREACHED! -1 HP`, "red");
                        
                        baseCrystal.material.color.setHex(0xef4444);
                        setTimeout(() => baseCrystal.material.color.setHex(0xec4899), 300);

                        this.cleanup();
                        checkGameOver();
                        return;
                    }

                    const nextStep = this.findSDFStep(this.gridX, this.gridZ);
                    this.targetGridX = nextStep.x;
                    this.targetGridZ = nextStep.z;
                } else {
                    const dir = new THREE.Vector3().subVectors(targetPos, this.position).normalize();
                    this.position.addScaledVector(dir, currentSpeed * dt);
                    this.mesh.position.copy(this.position);

                    const lookTarget = this.position.clone().add(dir);
                    this.mesh.lookAt(lookTarget);
                }
            }

            findSDFStep(cx, cz) {
                const neighbors = [
                    { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 },
                    { dx: 1, dz: 1 }, { dx: -1, dz: -1 }, { dx: 1, dz: -1 }, { dx: -1, dz: 1 }
                ];
                let bestStep = { x: cx, z: cz };
                let bestDist = sdfGrid[cx][cz];
                for (let n of neighbors) {
                    let nx = cx + n.dx;
                    let nz = cz + n.dz;
                    if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                        if (sdfGrid[nx][nz] < bestDist) {
                            bestDist = sdfGrid[nx][nz];
                            bestStep = { x: nx, z: nz };
                        }
                    }
                }
                return bestStep;
            }
        }

        /* ==========================================
           ARMORED LEVIATHAN WALKER (Ram Shield)
           ========================================== */
        class RamEnemy {
            constructor(spawnPoint) {
                this.gridX = spawnPoint.x;
                this.gridZ = spawnPoint.z;
                this.targetGridX = spawnPoint.x;
                this.targetGridZ = spawnPoint.z;

                const worldPos = gridToWorld(spawnPoint.x, spawnPoint.z);
                this.position = new THREE.Vector3(worldPos.x, 0.4, worldPos.z);

                this.levelScalar = 1.0 + (gameState.wave - 1) * 0.25;
                this.maxHp = Math.round(ENEMY_SPECS.hp * this.levelScalar * 3.8);
                this.speed = (ENEMY_SPECS.speed + (gameState.wave * 0.05)) * 0.6;
                this.evolutionTier = 1;
                this.hp = this.maxHp;
                this.isDead = false;
                this.isShielded = true;
                this.flashTimer = 0;
                this.slowTimer = 0;
                this.slowFactor = 1.0;

                this.mesh = this.buildMesh();
                this.mesh.position.copy(this.position);
                scene.add(this.mesh);

                this.legCycle = Math.random() * 100;
            }

            buildMesh() {
                const group = new THREE.Group();
                group.scale.set(1.4, 1.4, 1.4);

                // Heavy walker chassis box
                const chassisGeo = new THREE.BoxGeometry(0.55, 0.45, 0.65);
                this.bodyMat = new THREE.MeshStandardMaterial({
                    color: 0x3f3f46,
                    roughness: 0.25,
                    metalness: 0.9,
                });
                const chassis = new THREE.Mesh(chassisGeo, this.bodyMat);
                chassis.castShadow = true;
                group.add(chassis);

                // Bioluminescent charging power cell
                const powerGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 6);
                powerGeo.rotateX(Math.PI/2);
                this.neonMat = new THREE.MeshBasicMaterial({ color: 0xeab308 }); // glowing amber
                const cell = new THREE.Mesh(powerGeo, this.neonMat);
                cell.position.y = 0.26;
                group.add(cell);

                // Dual Heavy Front Shields
                const shieldMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.95, roughness: 0.15 });
                const shieldGeo = new THREE.BoxGeometry(0.16, 0.6, 0.45);
                const shieldL = new THREE.Mesh(shieldGeo, shieldMat);
                shieldL.position.set(-0.35, 0.05, 0.22);
                shieldL.rotation.y = 0.2;
                group.add(shieldL);

                const shieldR = new THREE.Mesh(shieldGeo, shieldMat);
                shieldR.position.set(0.35, 0.05, 0.22);
                shieldR.rotation.y = -0.2;
                group.add(shieldR);

                // 4 heavy thick hydraulic legs
                this.legs = [];
                const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6);
                const legMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
                for (let i = 0; i < 4; i++) {
                    const leg = new THREE.Mesh(legGeo, legMat);
                    const isLeft = i % 2 === 0;
                    const side = isLeft ? -1 : 1;
                    const isFront = i < 2;
                    leg.position.set(0.28 * side, -0.32, (isFront ? 1 : -1) * 0.2);
                    leg.rotation.z = 0.4 * side;
                    group.add(leg);
                    this.legs.push({ mesh: leg, side: side, isFront: isFront });
                }

                // HP Bar
                const barBackGeo = new THREE.PlaneGeometry(0.9, 0.09);
                const barBackMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
                this.hpBack = new THREE.Mesh(barBackGeo, barBackMat);
                this.hpBack.position.y = 0.9;
                group.add(this.hpBack);

                const barFillGeo = new THREE.PlaneGeometry(0.9, 0.09);
                this.hpFillMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
                this.hpFill = new THREE.Mesh(barFillGeo, this.hpFillMat);
                this.hpFill.position.set(0, 0.9, 0.01);
                group.add(this.hpFill);

                return group;
            }

            applySlow(factor, duration) {
                this.slowFactor = Math.min(this.slowFactor, factor);
                this.slowTimer = Math.max(this.slowTimer, duration);
            }

            takeDamage(dmg, isExplosionOrLaser = false) {
                if (this.isDead) return;
                // Direct gun projectiles deal 40% reduced damage due to front plating!
                const actualDmg = isExplosionOrLaser ? dmg : dmg * 0.6;
                this.hp -= actualDmg;
                this.flashTimer = 0.12;

                const percent = Math.max(0, this.hp / this.maxHp);
                this.hpFill.scale.x = percent;
                this.hpFill.position.x = - (1 - percent) * 0.45;

                if (this.hp <= 0) {
                    this.isDead = true;
                    this.die();
                }
            }

            die() {
                gameState.score += Math.round(30 * this.levelScalar);
                gameState.gold += 30; // heavy reward
                particles.spawnExplosion(this.position, 0xeab308, 35);
                audio.playExplosion();
                this.cleanup();
            }

            cleanup() {
                scene.remove(this.mesh);
            }

            update(dt) {
                if (this.isDead) return;

                if (this.flashTimer > 0) {
                    this.flashTimer -= dt;
                    this.neonMat.color.setHex(0xef4444);
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(this.slowTimer > 0 ? 0x06b6d4 : 0xeab308);
                    }
                }

                let currentSpeed = this.speed;
                if (this.slowTimer > 0) {
                    this.slowTimer -= dt;
                    currentSpeed *= this.slowFactor;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0x06b6d4);
                    }
                } else {
                    this.slowFactor = 1.0;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0xeab308);
                    }
                }

                this.hpBack.lookAt(camera.position);
                this.hpFill.lookAt(camera.position);

                // Hydraulics walker animation
                this.legCycle += dt * currentSpeed * 7;
                this.legs.forEach(leg => {
                    const phase = (leg.isFront ? 0 : Math.PI) + (leg.side > 0 ? Math.PI / 2 : 0);
                    leg.mesh.rotation.x = Math.sin(this.legCycle + phase) * 0.35;
                    leg.mesh.rotation.z = (0.4 + Math.cos(this.legCycle + phase) * 0.15) * leg.side;
                });

                // SDF Movement
                const currentWorldPos = gridToWorld(this.targetGridX, this.targetGridZ);
                const targetPos = new THREE.Vector3(currentWorldPos.x, 0.4, currentWorldPos.z);
                const distToStep = this.position.distanceTo(targetPos);

                if (distToStep < 0.1) {
                    this.gridX = this.targetGridX;
                    this.gridZ = this.targetGridZ;

                    if (this.gridX === BASE_COORD.x && this.gridZ === BASE_COORD.z) {
                        this.isDead = true;
                        gameState.health -= 3; // massive damage
                        updateStatsUI();
                        audio.playBaseDamage();
                        showToast(`BASE RAMMED BY LEVIATHAN! -3 HP`, "red");
                        
                        baseCrystal.material.color.setHex(0xef4444);
                        setTimeout(() => baseCrystal.material.color.setHex(0xec4899), 300);

                        this.cleanup();
                        checkGameOver();
                        return;
                    }

                    const nextStep = this.findSDFStep(this.gridX, this.gridZ);
                    this.targetGridX = nextStep.x;
                    this.targetGridZ = nextStep.z;
                } else {
                    const dir = new THREE.Vector3().subVectors(targetPos, this.position).normalize();
                    this.position.addScaledVector(dir, currentSpeed * dt);
                    this.mesh.position.copy(this.position);

                    const lookTarget = this.position.clone().add(dir);
                    this.mesh.lookAt(lookTarget);
                }
            }

            findSDFStep(cx, cz) {
                const neighbors = [
                    { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 },
                    { dx: 1, dz: 1 }, { dx: -1, dz: -1 }, { dx: 1, dz: -1 }, { dx: -1, dz: 1 }
                ];
                let bestStep = { x: cx, z: cz };
                let bestDist = sdfGrid[cx][cz];
                for (let n of neighbors) {
                    let nx = cx + n.dx;
                    let nz = cz + n.dz;
                    if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                        if (sdfGrid[nx][nz] < bestDist) {
                            bestDist = sdfGrid[nx][nz];
                            bestStep = { x: nx, z: nz };
                        }
                    }
                }
                return bestStep;
            }
        }

        /* ==========================================
           RECON SCOUT DRONE (Zig-zag Air Scout)
           ========================================== */
        class ScoutEnemy {
            constructor(spawnPoint) {
                this.gridX = spawnPoint.x;
                this.gridZ = spawnPoint.z;

                const worldPos = gridToWorld(spawnPoint.x, spawnPoint.z);
                this.position = new THREE.Vector3(worldPos.x, 1.4, worldPos.z);

                const baseWorld = gridToWorld(BASE_COORD.x, BASE_COORD.z);
                this.targetPos = new THREE.Vector3(baseWorld.x, 1.4, baseWorld.z);

                this.levelScalar = 1.0 + (gameState.wave - 1) * 0.25;
                this.maxHp = Math.round(ENEMY_SPECS.hp * this.levelScalar * 0.5);
                this.speed = (ENEMY_SPECS.speed + (gameState.wave * 0.05)) * 1.65;
                this.evolutionTier = 1;
                this.hp = this.maxHp;
                this.isDead = false;
                this.flashTimer = 0;
                this.slowTimer = 0;
                this.slowFactor = 1.0;
                this.wigglePhase = Math.random() * Math.PI * 2;

                this.mesh = this.buildMesh();
                this.mesh.position.copy(this.position);
                scene.add(this.mesh);
            }

            buildMesh() {
                const group = new THREE.Group();

                // Delta wing jet design
                const jetGeo = new THREE.ConeGeometry(0.24, 0.85, 4);
                jetGeo.rotateX(Math.PI / 2);
                jetGeo.scale(1.8, 0.35, 1.0);
                this.bodyMat = new THREE.MeshStandardMaterial({
                    color: 0x064e3b,
                    metalness: 0.82,
                    roughness: 0.22
                });
                const jet = new THREE.Mesh(jetGeo, this.bodyMat);
                jet.castShadow = true;
                group.add(jet);

                // Mini green glow visor/lens
                const visorGeo = new THREE.BoxGeometry(0.08, 0.02, 0.02);
                this.neonMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
                const visor = new THREE.Mesh(visorGeo, this.neonMat);
                visor.position.set(0, 0.04, 0.42);
                group.add(visor);

                // Back green exhaust thrusters
                const thrusterGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 6);
                thrusterGeo.rotateX(Math.PI/2);
                const thrustMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
                const thrustL = new THREE.Mesh(thrusterGeo, thrustMat);
                thrustL.position.set(-0.15, -0.02, -0.42);
                group.add(thrustL);

                const thrustR = thrustL.clone();
                thrustR.position.x = 0.15;
                group.add(thrustR);

                // HP Bar
                const barBackGeo = new THREE.PlaneGeometry(0.6, 0.07);
                const barBackMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
                this.hpBack = new THREE.Mesh(barBackGeo, barBackMat);
                this.hpBack.position.y = 0.5;
                group.add(this.hpBack);

                const barFillGeo = new THREE.PlaneGeometry(0.6, 0.07);
                this.hpFillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
                this.hpFill = new THREE.Mesh(barFillGeo, this.hpFillMat);
                this.hpFill.position.set(0, 0.5, 0.01);
                group.add(this.hpFill);

                return group;
            }

            applySlow(factor, duration) {
                this.slowFactor = Math.min(this.slowFactor, factor);
                this.slowTimer = Math.max(this.slowTimer, duration);
            }

            takeDamage(dmg, isExplosionOrLaser = false) {
                if (this.isDead) return;
                this.hp -= dmg;
                this.flashTimer = 0.12;

                const percent = Math.max(0, this.hp / this.maxHp);
                this.hpFill.scale.x = percent;
                this.hpFill.position.x = - (1 - percent) * 0.3;

                if (this.hp <= 0) {
                    this.isDead = true;
                    this.die();
                }
            }

            die() {
                gameState.score += Math.round(15 * this.levelScalar);
                gameState.gold += 10;
                updateStatsUI();
                particles.spawnExplosion(this.position, 0x22c55e, 18);
                audio.playExplosion();
                this.cleanup();
            }

            cleanup() {
                scene.remove(this.mesh);
            }

            update(dt) {
                if (this.isDead) return;

                if (this.flashTimer > 0) {
                    this.flashTimer -= dt;
                    this.neonMat.color.setHex(0xef4444);
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(this.slowTimer > 0 ? 0x06b6d4 : 0x22c55e);
                    }
                }

                let currentSpeed = this.speed;
                if (this.slowTimer > 0) {
                    this.slowTimer -= dt;
                    currentSpeed *= this.slowFactor;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0x06b6d4);
                    }
                } else {
                    this.slowFactor = 1.0;
                    if (this.flashTimer <= 0) {
                        this.neonMat.color.setHex(0x22c55e);
                    }
                }

                this.hpBack.lookAt(camera.position);
                this.hpFill.lookAt(camera.position);

                // Move directly towards base with zig-zag weaving maneuver
                const distToTarget = this.position.distanceTo(this.targetPos);
                if (distToTarget < 0.25) {
                    this.isDead = true;
                    gameState.health -= 1;
                    updateStatsUI();
                    audio.playBaseDamage();
                    showToast(`NEXUS INFILTRATED BY SCOUT JET! -1 HP`, "red");
                    
                    baseCrystal.material.color.setHex(0xef4444);
                    setTimeout(() => baseCrystal.material.color.setHex(0xec4899), 300);

                    this.cleanup();
                    checkGameOver();
                    return;
                }

                const dir = new THREE.Vector3().subVectors(this.targetPos, this.position).normalize();
                const sideDir = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

                // Move forward
                this.position.addScaledVector(dir, currentSpeed * dt);
                // Wiggle sideward drift
                const waveOffset = Math.sin(Date.now() * 0.007 + this.wigglePhase) * 0.09;
                this.position.addScaledVector(sideDir, waveOffset);

                this.mesh.position.copy(this.position);
                this.mesh.lookAt(this.targetPos);
            }
        }

        /* ==========================================
           PARTICLE SYSTEMS ENGINE
           ========================================== */
        class ParticleSystem {
            constructor() {
                this.activeParticles = [];
                
                // Pooled mesh elements
                this.geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
                this.smokeGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
            }

            spawnExplosion(pos, colorHex, count) {
                const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 });
                for (let i = 0; i < count; i++) {
                    const mesh = new THREE.Mesh(this.geo, mat.clone());
                    mesh.position.copy(pos);
                    mesh.position.x += (Math.random() - 0.5) * 0.4;
                    mesh.position.y += (Math.random() - 0.5) * 0.4;
                    mesh.position.z += (Math.random() - 0.5) * 0.4;

                    const velocity = new THREE.Vector3(
                        (Math.random() - 0.5) * 6,
                        Math.random() * 5 + 1.5,
                        (Math.random() - 0.5) * 6
                    );

                    scene.add(mesh);
                    const life = 0.6 + Math.random()*0.4;
                    this.activeParticles.push({
                        mesh: mesh,
                        vel: velocity,
                        life: life,
                        maxLife: life,
                        type: 'explosion'
                    });
                }
            }

            spawnHitBurst(pos, colorHex) {
                this.spawnExplosion(pos, colorHex, 6);
            }

            spawnSmoke(pos) {
                // Realistic expanding and fading smoke particle
                const mat = new THREE.MeshBasicMaterial({ color: 0xd1d5db, transparent: true, opacity: 0.45 });
                const mesh = new THREE.Mesh(this.smokeGeo, mat);
                mesh.position.copy(pos);

                const velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.8,
                    Math.random() * 0.5 + 0.35, // slowly float upwards
                    (Math.random() - 0.5) * 0.8
                );

                scene.add(mesh);
                const life = 0.4 + Math.random() * 0.3;
                this.activeParticles.push({
                    mesh: mesh,
                    vel: velocity,
                    life: life,
                    maxLife: life,
                    type: 'smoke'
                });
            }

            update(dt) {
                for (let i = this.activeParticles.length - 1; i >= 0; i--) {
                    const p = this.activeParticles[i];
                    p.life -= dt;
                    if (p.life <= 0) {
                        scene.remove(p.mesh);
                        if (p.mesh.material) p.mesh.material.dispose();
                        this.activeParticles.splice(i, 1);
                    } else {
                        if (p.type === 'smoke') {
                            p.mesh.position.addScaledVector(p.vel, dt);
                            p.mesh.scale.multiplyScalar(1.025); // expand slightly
                            p.mesh.material.opacity = (p.life / p.maxLife) * 0.45;
                        } else {
                            // Gravity & Drag physics
                            p.vel.y -= 9.8 * dt; // gravity
                            p.mesh.position.addScaledVector(p.vel, dt);
                            p.mesh.scale.multiplyScalar(0.96); // slowly shrink
                            p.mesh.material.opacity = (p.life / p.maxLife) * 0.85;
                        }
                    }
                }
            }
        }
        const particles = new ParticleSystem();

        /* ==========================================
           INTERACTIVE HOLOGRAPHIC BUILD PREVIEW
           ========================================== */
        let buildModeActive = false;
        let holographicPreview = null;
        let selectedTowerInstance = null;
        let hoverGridCoord = { x: -1, z: -1 };

        function initHologram() {
            holographicPreview = new THREE.Group();
            
            // Neon glowing frame
            const geo = new THREE.BoxGeometry(CELL_SIZE - 0.1, 0.1, CELL_SIZE - 0.1);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x10b981,
                transparent: true,
                opacity: 0.4,
                wireframe: true
            });
            const frame = new THREE.Mesh(geo, mat);
            frame.position.y = 0.05;
            holographicPreview.add(frame);

            // Translucent Range Ring indicator Cylinder
            const rangeGeo = new THREE.CylinderGeometry(TOWER_SPECS.spore.base.range, TOWER_SPECS.spore.base.range, 0.1, 24);
            const rangeMat = new THREE.MeshBasicMaterial({
                color: 0x10b981,
                transparent: true,
                opacity: 0.08,
                side: THREE.DoubleSide
            });
            const rangeRing = new THREE.Mesh(rangeGeo, rangeMat);
            rangeRing.position.y = 0.1;
            holographicPreview.add(rangeRing);

            // Micro range border outline
            const ringOutlineGeo = new THREE.RingGeometry(TOWER_SPECS.spore.base.range - 0.05, TOWER_SPECS.spore.base.range, 24);
            const ringOutlineMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
            const ringOutline = new THREE.Mesh(ringOutlineGeo, ringOutlineMat);
            ringOutline.rotation.x = Math.PI / 2;
            ringOutline.position.y = 0.12;
            holographicPreview.add(ringOutline);

            holographicPreview.visible = false;
            scene.add(holographicPreview);
        }
        initHologram();

        function setHologramColor(valid) {
            const hex = valid ? 0x10b981 : 0xef4444; // Green vs Red
            holographicPreview.children.forEach(mesh => {
                mesh.material.color.setHex(hex);
            });
        }

        /* ==========================================
           SELECTION CYLINDER RANGE INDICATOR
           ========================================== */
        let selectionIndicator = null;
        function initSelectionIndicator() {
            selectionIndicator = new THREE.Group();
            
            // Range cylinder
            const geo = new THREE.CylinderGeometry(1, 1, 0.08, 24);
            const mat = new THREE.MeshBasicMaterial({ color: 0xeab308, transparent: true, opacity: 0.1 });
            const cylinder = new THREE.Mesh(geo, mat);
            cylinder.position.y = 0.08;
            selectionIndicator.add(cylinder);

            // Ring Outline border
            const edgeGeo = new THREE.RingGeometry(0.95, 1, 24);
            const edgeMat = new THREE.MeshBasicMaterial({ color: 0xeab308, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
            const edge = new THREE.Mesh(edgeGeo, edgeMat);
            edge.rotation.x = Math.PI / 2;
            edge.position.y = 0.1;
            selectionIndicator.add(edge);

            selectionIndicator.visible = false;
            scene.add(selectionIndicator);
        }
        initSelectionIndicator();

        function showSelectionIndicator(tower) {
            selectionIndicator.position.copy(tower.position);
            // Re-scale circle to represent correct specs
            const range = tower.specs.range;
            selectionIndicator.scale.set(range, 1, range);
            selectionIndicator.visible = true;
        }

        function hideSelectionIndicator() {
            selectionIndicator.visible = false;
        }

        /* ==========================================
           MOUSE INTERACTION & RAYCASTING (ISOLATED)
           ========================================== */
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let wasDragging = false;
        let isMouseDown = false;
        let mdX = 0, mdY = 0;

        // Mobile Touch Control State
        let isTouching = false;
        let touchStartTime = 0;

        window.addEventListener('mousedown', (e) => {
            console.log(`[Global Mousedown] target=${e.target.tagName}#${e.target.id || ''}, classList=[${e.target.className}]`);
        });

        // Isolate camera and selection triggers to only work when target is strictly the game canvas
        canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            wasDragging = false;
            mdX = e.clientX;
            mdY = e.clientY;
            console.log(`[Canvas Mousedown] triggered on canvas`);
        });

        window.addEventListener('mousemove', (e) => {
            // Track globally so screen coordinates are valid
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            if (isMouseDown) {
                if (Math.abs(e.clientX - mdX) > 5 || Math.abs(e.clientY - mdY) > 5) {
                    wasDragging = true;
                }
            }

            // Only run the holographic preview logic if hovering strictly over the 3D canvas
            if (e.target !== canvas) {
                holographicPreview.visible = false;
                return;
            }

            raycaster.setFromCamera(mouse, camera);
            
            // Check intersection with floor ground plane
            const intersects = raycaster.intersectObject(ground);
            if (intersects.length > 0) {
                const intersectPoint = intersects[0].point;
                const gridPos = worldToGrid(intersectPoint.x, intersectPoint.z);

                // Handle changes in cell coordinate hovering
                if (gridPos.x >= 0 && gridPos.x < GRID_SIZE && gridPos.z >= 0 && gridPos.z < GRID_SIZE) {
                    hoverGridCoord = gridPos;
                    const wPos = gridToWorld(gridPos.x, gridPos.z);
                    holographicPreview.position.set(wPos.x, 0, wPos.z);

                    if (buildModeActive) {
                        holographicPreview.visible = true;
                        
                        // Rule Check: Can we place a tower here?
                        // Must be empty cell AND not completely wall pathways
                        const cellEmpty = grid[gridPos.x][gridPos.z] === CELL_TYPES.EMPTY;
                        let validPath = false;
                        if (cellEmpty) {
                            validPath = validatePathways(gridPos.x, gridPos.z);
                        }

                        let nearLake = true;
                        if (activeBuildType === 'water_pump') {
                            nearLake = false;
                            const checkDirs = [{dx: 1, dz: 0}, {dx: -1, dz: 0}, {dx: 0, dz: 1}, {dx: 0, dz: -1}];
                            for (let d of checkDirs) {
                                let nx = gridPos.x + d.dx;
                                let nz = gridPos.z + d.dz;
                                if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                                    if (grid[nx][nz] === CELL_TYPES.LAKE) {
                                        nearLake = true;
                                        break;
                                    }
                                }
                            }
                        }
                        
                        setHologramColor(cellEmpty && validPath && nearLake);
                    } else {
                        holographicPreview.visible = false;
                    }
                } else {
                    holographicPreview.visible = false;
                }
            } else {
                holographicPreview.visible = false;
            }
        });

        window.addEventListener('mouseup', (e) => {
            const preWasMouseDown = isMouseDown;
            isMouseDown = false;
            console.log(`[Global Mouseup] target=${e.target.tagName}#${e.target.id || ''}, wasDragging=${wasDragging}, preWasMouseDown=${preWasMouseDown}`);
            if (wasDragging) return; 
            if (!preWasMouseDown) return;

            // CRITICAL FIX: Block action if user clicked a panel, card, or dashboard
            if (e.target !== canvas) {
                console.warn(`[Mouseup] ignored: target is not canvas (clicked ${e.target.tagName}#${e.target.id || ''})`);
                return;
            }

            // Perform Click Raycast Actions
            raycaster.setFromCamera(mouse, camera);

            // Raycast against Polyplants and Lakes first!
            const interactiveTargets = [];
            if (window.polyplants) {
                window.polyplants.forEach(p => {
                    if (p.mesh) interactiveTargets.push(p.mesh);
                });
            }
            lakeMeshes.forEach(l => {
                interactiveTargets.push(l);
            });

            const interactiveHits = raycaster.intersectObjects(interactiveTargets, true);
            if (interactiveHits.length > 0) {
                let hitObj = interactiveHits[0].object;
                let topObj = hitObj;
                while (topObj && !topObj.userData.isPolyplant && !topObj.userData.isLake) {
                    topObj = topObj.parent;
                }

                // Fallback check on hitObj itself
                if (hitObj.userData.isLake) {
                    topObj = hitObj;
                }

                if (topObj) {
                    if (topObj.userData.isPolyplant) {
                        const plant = topObj.userData.polyplantInstance;
                        if (plant && !plant.isHarvested) {
                            plant.harvest();
                            gameState.food = Math.min(100, gameState.food + 20);
                            window.updateSurvivalHUD();
                            audio.playLaserShoot(); // Sound feedback
                            showToast("Eaten wild polyplant! (+20% Food)", "green");
                            return;
                        }
                    } else if (topObj.userData.isLake) {
                        const now = Date.now();
                        if (now - (window.lastDrinkTime || 0) > 1500) {
                            window.lastDrinkTime = now;
                            gameState.water = Math.min(100, gameState.water + 15);
                            window.updateSurvivalHUD();
                            audio.playBuild(); // Sound feedback
                            showToast("Drank from lake! (+15% Water)", "sky");
                            return;
                        } else {
                            showToast("Not thirsty yet...", "yellow");
                            return;
                        }
                    }
                }
            }

            // 1. Raycast against existing placed Towers & the Base Crystal
            const targetList = [...towers.map(t => t.mesh)];
            if (baseGroup) {
                targetList.push(baseGroup);
            }
            const hits = raycaster.intersectObjects(targetList, true);

            if (hits.length > 0) {
                console.log(`[Raycast] hit existing tower or base`);
                let topObj = hits[0].object;
                while (topObj && !topObj.userData.isTower && !topObj.userData.isBase) {
                    topObj = topObj.parent;
                }

                if (topObj) {
                    if (topObj.userData.isTower && topObj.userData.towerInstance) {
                        selectTower(topObj.userData.towerInstance);
                        return;
                    } else if (topObj.userData.isBase) {
                        selectBase();
                        return;
                    }
                }
            }

            // 2. Raycast against ground to place a tower or clear selection
            const groundIntersects = raycaster.intersectObject(ground);
            console.log(`[Raycast] ground intersects count=${groundIntersects.length}`);
            if (groundIntersects.length > 0) {
                const gridPos = worldToGrid(groundIntersects[0].point.x, groundIntersects[0].point.z);
                console.log(`[Grid Click] gridPos=(${gridPos.x}, ${gridPos.z}), buildModeActive=${buildModeActive}`);

                if (gridPos.x >= 0 && gridPos.x < GRID_SIZE && gridPos.z >= 0 && gridPos.z < GRID_SIZE) {
                    if (buildModeActive) {
                        console.log(`[Build] buildModeActive is true, calling attemptBuildTower`);
                        attemptBuildTower(gridPos.x, gridPos.z);
                    } else {
                        // Clicked empty ground: deselect any currently active selection
                        console.log(`[Build] buildModeActive is false, deselecting tower`);
                        deselectTower();
                    }
                } else {
                    console.warn(`[Grid Click] out of bounds: (${gridPos.x}, ${gridPos.z})`);
                }
            }
        }

        // Add Escape key handler for intuitive control canceling, and 'O' key handler for hotkey build
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (buildModeActive) {
                    cancelBuildMode();
                    showToast("Build Mode Canceled", "yellow");
                }
                deselectTower();
            } else if (e.key.toLowerCase() === 'o') {
                console.log(`[Hotkey] 'O' pressed. hoverGridCoord=(${hoverGridCoord.x}, ${hoverGridCoord.z})`);
                if (hoverGridCoord.x >= 0 && hoverGridCoord.x < GRID_SIZE && hoverGridCoord.z >= 0 && hoverGridCoord.z < GRID_SIZE) {
                    attemptBuildTower(hoverGridCoord.x, hoverGridCoord.z);
                } else {
                    console.warn(`[Hotkey] 'O' pressed but hoverGridCoord is out of bounds or invalid`);
                }
            }
        });

        /* ==========================================
           MOBILE TOUCH CONTROLS
           ========================================== */
        canvas.addEventListener('touchstart', (e) => {
            // Prevent default browser actions like scrolling on touch
            e.preventDefault();

            isMouseDown = true; // Mirror mouse state for wasDragging logic
            isTouching = true;
            wasDragging = false;
            touchStartTime = Date.now();

            const touch = e.touches[0];
            mdX = touch.clientX;
            mdY = touch.clientY;

            // Update mouse vector for raycasting
            mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isMouseDown) {
                const touch = e.touches[0];
                if (Math.abs(touch.clientX - mdX) > 10 || Math.abs(touch.clientY - mdY) > 10) {
                    wasDragging = true;
                }
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchDuration = Date.now() - touchStartTime;

            // A "tap" is a short touch that hasn't moved much.
            if (!wasDragging && touchDuration < 250) {
                handleTap(e); // Pass the event object
            }

            isMouseDown = false;
            isTouching = false;
        }, { passive: false });

        /* ==========================================
           TOWER BUILDING, SELECTION & TRANSACTION WORKFLOW
           ========================================== */
        function attemptBuildTower(x, z) {
            const cost = TOWER_SPECS[activeBuildType].base.cost;
            console.log(`[Build] attemptBuildTower called for (${x}, ${z}). type=${activeBuildType}, cost=${cost}, gold=${gameState.gold}`);

            if (grid[x][z] !== CELL_TYPES.EMPTY) {
                console.error(`[Build] failed: cell occupied (type=${grid[x][z]})`);
                showToast("Cell already occupied!", "red");
                audio.playDenied();
                return;
            }

            if (activeBuildType === 'water_pump') {
                let nearLake = false;
                const checkDirs = [{dx: 1, dz: 0}, {dx: -1, dz: 0}, {dx: 0, dz: 1}, {dx: 0, dz: -1}];
                for (let d of checkDirs) {
                    let nx = x + d.dx;
                    let nz = z + d.dz;
                    if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                        if (grid[nx][nz] === CELL_TYPES.LAKE) {
                            nearLake = true;
                            break;
                        }
                    }
                }
                if (!nearLake) {
                    showToast("Water Pumps must be placed adjacent to a Lake!", "yellow");
                    audio.playDenied();
                    return;
                }
            }

            if (gameState.gold < cost) {
                console.error(`[Build] failed: insufficient gold (have ${gameState.gold}, need ${cost})`);
                showToast("Insufficient Biolum Credits!", "yellow");
                audio.playDenied();
                return;
            }

            // Pathfinder Check
            const valid = validatePathways(x, z);
            console.log(`[Build] validatePathways result=${valid}`);
            if (!valid) {
                console.error(`[Build] failed: path blocked`);
                showToast("SDF Engine Alert: Path block denied!", "red");
                audio.playDenied();
                return;
            }

            // Place Tower
            gameState.gold -= cost;
            grid[x][z] = CELL_TYPES.TOWER;
            
            console.log(`[Build] instantiating SporeTower...`);
            const newTower = new SporeTower(x, z, activeBuildType);
            towers.push(newTower);

            // Recompute real-time map distance field
            computeSDF();
            updateStatsUI();
            audio.playBuild();
            particles.spawnExplosion(newTower.position, TOWER_SPECS[activeBuildType].base.color, 15);
            const nameMap = { spore: 'Gatling Turret', laser: 'Railgun Cannon', frost: 'Missile Battery' };
            showToast(`${nameMap[activeBuildType]} Constructed`, "green");
            console.log(`[Build] SporeTower successfully placed and initialized.`);
        }

        let selectedBaseActive = false;

        function selectTower(tower) {
            selectedTowerInstance = tower;
            gameState.selectedTower = tower;
            selectedBaseActive = false;
            
            // Highlight selected tower range 3D visuals
            showSelectionIndicator(tower);

            // Update bottom detail context panel
            const cost = TOWER_SPECS[tower.type].base.upgradeCost;
            const nameMap = { spore: 'Gatling Turret', laser: 'Railgun Cannon', frost: 'Missile Battery' };
            document.getElementById('selected-title').innerText = `${nameMap[tower.type].toUpperCase()} LVL ${tower.level}`;
            document.getElementById('selected-stats').innerText = `Dmg: ${tower.specs.damage} | Range: ${tower.specs.range.toFixed(1)}m | Rate: ${tower.specs.fireRate}s`;
            
            const sellBtn = document.getElementById('sell-btn');
            if (sellBtn) sellBtn.style.display = 'flex';

            const upgradeBtn = document.getElementById('upgrade-btn');
            if (tower.level >= 2) {
                upgradeBtn.classList.add('opacity-50', 'pointer-events-none');
                upgradeBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> MAXED`;
            } else {
                upgradeBtn.classList.remove('opacity-50', 'pointer-events-none');
                upgradeBtn.innerHTML = `<i class="fa-solid fa-arrow-up-short-wide"></i> Upgrade (<span id="upgrade-cost">${cost}</span>¢)`;
            }

            document.getElementById('sell-value').innerText = Math.round(tower.specs.cost * 0.5);

            // Slide up selection panel UI
            const panel = document.getElementById('selection-panel');
            panel.classList.remove('scale-0', 'pointer-events-none', 'opacity-0');
            panel.classList.add('scale-100', 'pointer-events-auto', 'opacity-100');
        }

        function selectBase() {
            selectedTowerInstance = null;
            gameState.selectedTower = null;
            selectedBaseActive = true;

            // Highlight base area
            if (selectionIndicator) {
                selectionIndicator.position.set(baseGroup.position.x, 0.05, baseGroup.position.z);
                selectionIndicator.scale.set(2.5, 2.5, 1);
                selectionIndicator.visible = true;
            }

            const names = { 1: 'Outpost HQ', 2: 'Fortified Garrison', 3: 'Command Citadel' };
            document.getElementById('selected-title').innerText = `${names[gameState.baseTier].toUpperCase()}`;
            document.getElementById('selected-stats').innerText = `Integrity: ${gameState.health} HP | Defense Patrol Pods: ${gameState.baseTier >= 2 ? (gameState.baseTier === 3 ? 4 : 2) : 0}`;

            const sellBtn = document.getElementById('sell-btn');
            if (sellBtn) sellBtn.style.display = 'none'; // base cannot be sold

            const upgradeBtn = document.getElementById('upgrade-btn');
            if (gameState.baseTier >= 3) {
                upgradeBtn.classList.add('opacity-50', 'pointer-events-none');
                upgradeBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> MAXED`;
            } else {
                const cost = gameState.baseTier === 1 ? 200 : 400;
                upgradeBtn.classList.remove('opacity-50', 'pointer-events-none');
                upgradeBtn.innerHTML = `<i class="fa-solid fa-arrow-up-short-wide"></i> Upgrade (<span id="upgrade-cost">${cost}</span>¢)`;
            }

            // Slide up selection panel UI
            const panel = document.getElementById('selection-panel');
            panel.classList.remove('scale-0', 'pointer-events-none', 'opacity-0');
            panel.classList.add('scale-100', 'pointer-events-auto', 'opacity-100');
        }

        function deselectTower() {
            selectedTowerInstance = null;
            gameState.selectedTower = null;
            selectedBaseActive = false;
            hideSelectionIndicator();

            const sellBtn = document.getElementById('sell-btn');
            if (sellBtn) sellBtn.style.display = 'flex';

            // Slide away selection panel UI
            const panel = document.getElementById('selection-panel');
            panel.classList.remove('scale-100', 'pointer-events-auto', 'opacity-100');
            panel.classList.add('scale-0', 'pointer-events-none', 'opacity-0');
        }

        function upgradeSelectedTower() {
            if (selectedBaseActive) {
                upgradeBase();
                return;
            }

            if (!selectedTowerInstance) return;
            const cost = TOWER_SPECS[selectedTowerInstance.type].base.upgradeCost;

            if (gameState.gold < cost) {
                showToast("Insufficient gold for upgrade!", "yellow");
                audio.playDenied();
                return;
            }

            gameState.gold -= cost;
            selectedTowerInstance.upgrade();
            selectTower(selectedTowerInstance); // refresh UI
            updateStatsUI();
        }

        function upgradeBase() {
            const cost = gameState.baseTier === 1 ? 200 : 400;
            if (gameState.gold < cost) {
                showToast("Insufficient gold for base fortification!", "yellow");
                audio.playDenied();
                return;
            }

            gameState.gold -= cost;
            gameState.baseTier++;

            // Base Health boost and max-health increase
            const hpBonus = gameState.baseTier === 2 ? 5 : 10;
            const maxHp = gameState.baseTier === 2 ? 25 : 35;
            gameState.health = Math.min(maxHp, gameState.health + hpBonus);

            rebuildBase();

            // Spawn visual/audio alerts
            const basePos = new THREE.Vector3(baseGroup.position.x, 1.8, baseGroup.position.z);
            particles.spawnExplosion(basePos, 0xec4899, 45);
            audio.playBuild();
            showToast(`BASE FORTIFIED TO ${gameState.baseTier === 2 ? 'FORTIFIED GARRISON' : 'COMMAND CITADEL'}!`, "green");

            selectBase(); // Refresh UI
            updateStatsUI();
        }

        function sellSelectedTower() {
            if (!selectedTowerInstance) return;
            const refund = Math.round(selectedTowerInstance.specs.cost * 0.5);

            gameState.gold += refund;
            grid[selectedTowerInstance.gridX][selectedTowerInstance.gridZ] = CELL_TYPES.EMPTY;

            // Remove from JS storage list
            const idx = towers.indexOf(selectedTowerInstance);
            if (idx > -1) {
                towers[idx].destroy();
                towers.splice(idx, 1);
            }

            deselectTower();
            computeSDF(); // Recompute pathing to occupy the freed space
            updateStatsUI();
            audio.playExplosion();
        }

        /* ==========================================
           WAVE CONTROL & SPAWN MECHANICS
           ========================================== */
        function getNextWaveEnemyCount(waveIndex) {
            if (waveIndex === undefined) waveIndex = gameState.wave;

            if (window.CampaignManager && window.CampaignManager.isActive) {
                const mission = window.CampaignManager.missions[window.CampaignManager.currentMissionIndex];
                const waveSpawns = mission.waves[waveIndex - 1];
                if (waveSpawns) {
                    let count = 0;
                    waveSpawns.forEach(def => count += def.count);
                    return count;
                } else {
                    if (mission.biome === 'mars') {
                        return 10 + (waveIndex - 1) * 5;
                    }
                    const enemyCosts = { scarab: 1.0, ant: 1.5, wasp: 2.0, ufo: 3.0, golem: 4.0, stealth: 3.5, ram: 5.0, carrier: 6.0, scout: 4.5 };
                    const pool = ['scarab', 'ant', 'wasp', 'ufo', 'golem', 'stealth', 'ram', 'carrier', 'scout'];
                    let remainingBudget = 15 + waveIndex * 7;
                    let count = 0;
                    while (remainingBudget >= 1.0) {
                        const affordable = pool.filter(type => enemyCosts[type] <= remainingBudget);
                        if (affordable.length === 0) break;
                        const type = affordable[Math.floor(Math.random() * affordable.length)];
                        count++;
                        remainingBudget -= enemyCosts[type];
                    }
                    return count;
                }
            } else {
                if (gameState.currentBiome === 'mars') {
                    return 10 + (waveIndex - 1) * 5;
                }
                return 4 + waveIndex * 2;
            }
        }

        let waveSpawnQueue = [];
        let spawnIntervalTimer = 0;
        const SPAWN_SPEED = 0.6; // spawning interval seconds

        function startWave() {
            if (gameState.isWaveActive) return;

            gameState.isWaveActive = true;
            document.getElementById('wave-btn').disabled = true;
            document.getElementById('wave-btn').classList.add('opacity-50', 'pointer-events-none');

            // Set up wave spawn list
            let numEnemies = 0;
            waveSpawnQueue = [];

            if (window.CampaignManager && window.CampaignManager.isActive) {
                const mission = window.CampaignManager.missions[window.CampaignManager.currentMissionIndex];
                const waveSpawns = mission.waves[gameState.wave - 1];
                if (waveSpawns) {
                    waveSpawns.forEach(spawnDef => {
                        for (let i = 0; i < spawnDef.count; i++) {
                            const spawn = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
                            waveSpawnQueue.push({
                                x: spawn.x,
                                z: spawn.z,
                                type: spawnDef.type
                            });
                            numEnemies++;
                        }
                    });
                }
            } else {
                 numEnemies = getNextWaveEnemyCount();
                 for (let i = 0; i < numEnemies; i++) {
                     const spawn = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
                     let type = 'scarab';
                     if (gameState.wave === 2) {
                         type = Math.random() < 0.55 ? 'ant' : 'scarab';
                     } else if (gameState.wave >= 3) {
                         const r = Math.random();
                         if (r < 0.15) {
                             type = 'scarab';
                         } else if (r < 0.3) {
                             type = 'ant';
                         } else if (r < 0.42) {
                             type = 'ufo';
                         } else if (r < 0.54) {
                             type = 'wasp';
                         } else if (r < 0.66) {
                             type = 'golem';
                         } else if (r < 0.74) {
                             type = 'carrier';
                         } else if (r < 0.83) {
                             type = 'stealth';
                         } else if (r < 0.92) {
                             type = 'ram';
                         } else {
                             type = 'scout';
                         }
                     }
                     waveSpawnQueue.push({
                         x: spawn.x,
                         z: spawn.z,
                         type: type
                     });
                 }
            }

            showToast(`WAVE ${gameState.wave} DETECTED! BIOLOGICAL THREAT ON THE HORIZON.`, "green");
            document.getElementById('wave-desc').innerText = `DEFENSE ENGAGED`;
            document.getElementById('enemy-count').innerText = `${numEnemies} Swarm Hostiles inbound`;
        }
        
        document.getElementById('wave-btn').addEventListener('click', () => {
            if (typeof window.playNewMusicTrack === 'function') {
                window.playNewMusicTrack();
            }
        });

        function endWave() {
            gameState.isWaveActive = false;
            gameState.wave += 1;

            if (window.CampaignManager && window.CampaignManager.isActive) {
                if (gameState.wave > window.CampaignManager.getCurrentLevelMaxWaves()) {
                    window.CampaignManager.completeMission();
                    return;
                }
            }

            gameState.gold += 30; // End-wave survival bonus
            updateStatsUI();

            document.getElementById('wave-btn').disabled = false;
            document.getElementById('wave-btn').classList.remove('opacity-50', 'pointer-events-none');

            document.getElementById('wave-desc').innerText = `Ready to Engage`;
            document.getElementById('enemy-count').innerText = `${getNextWaveEnemyCount()} Swarm Hostiles`;

            showToast(`WAVE CLEARED! +30¢ Bonus Awarded`, "green");
            
            // Check auto wave triggers if enabled
            if (gameState.autoStartWave) {
                setTimeout(startWave, 2500);
            }
        }

        /* ==========================================
           GAME UI CONTROLLERS & EVENT LISTENERS
           ========================================== */
        function updateStatsUI() {
            document.getElementById('health-value').innerText = gameState.health;
            document.getElementById('gold-value').innerText = gameState.gold;
            document.getElementById('wave-value').innerText = gameState.wave;
            document.getElementById('score-value').innerText = String(gameState.score).padStart(5, '0');

            const sfLock = document.getElementById('stackfarm-lock');
            if (sfLock) {
                if (gameState.wave >= 5) {
                    sfLock.classList.add('hidden');
                } else {
                    sfLock.classList.remove('hidden');
                }
            }
        }

        function showToast(msg, color) {
            const toast = document.createElement('div');
            toast.className = `blur-panel px-4 py-2 rounded-lg font-bold border ${color === 'red' ? 'border-red-500/50 text-red-300' : color === 'yellow' ? 'border-yellow-500/50 text-yellow-300' : 'border-emerald-500/50 text-emerald-300'} text-xs tracking-wider uppercase flex items-center gap-2 shadow-2xl animate-bounce`;
            toast.innerHTML = `<i class="fa-solid ${color === 'red' ? 'fa-triangle-exclamation text-red-400' : 'fa-biohazard text-emerald-400'}"></i> ${msg}`;
            
            const container = document.getElementById('toast-container');
            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('transition-all', 'opacity-0', '-translate-y-4');
                setTimeout(() => toast.remove(), 400);
            }, 3000);
        }

        // Build selection card handlers
        let activeBuildType = 'spore';
        const buildCards = {
            spore: document.getElementById('build-spore'),
            laser: document.getElementById('build-laser'),
            frost: document.getElementById('build-frost'),
            tesla: document.getElementById('build-tesla'),
            artillery: document.getElementById('build-artillery'),
            thermal: document.getElementById('build-thermal'),
            harvester: document.getElementById('build-harvester'),
            water_pump: document.getElementById('build-water_pump'),
            generator: document.getElementById('build-generator'),
            stackfarm: document.getElementById('build-stackfarm'),
            drone_factory: document.getElementById('build-drone_factory')
        };

        const dropdown = document.getElementById('construct-dropdown');
        const constructBtn = document.getElementById('construct-btn');

        constructBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('scale-y-100');
            if (isOpen) {
                closeDropdown();
            } else {
                openDropdown();
            }
        });

        function openDropdown() {
            dropdown.classList.remove('scale-y-0', 'opacity-0', 'pointer-events-none');
            dropdown.classList.add('scale-y-100', 'opacity-100', 'pointer-events-auto');
            constructBtn.querySelector('.fa-chevron-up').classList.add('rotate-180');
        }

        function closeDropdown() {
            dropdown.classList.remove('scale-y-100', 'opacity-100', 'pointer-events-auto');
            dropdown.classList.add('scale-y-0', 'opacity-0', 'pointer-events-none');
            constructBtn.querySelector('.fa-chevron-up').classList.remove('rotate-180');
        }

        window.addEventListener('click', () => {
            closeDropdown();
        });

        function showCampaignSelector() {
            if (!window.CampaignManager) return;
            window.CampaignManager.init();

            const modal = document.createElement('div');
            modal.id = 'campaign-selector-modal';
            modal.className = "absolute inset-0 z-50 flex flex-col justify-center items-center bg-black/90 pointer-events-auto p-4";
            
            let missionsHTML = '';
            window.CampaignManager.missions.forEach((m, idx) => {
                const isUnlocked = idx <= window.CampaignManager.unlockedMissionIndex;
                const activeClass = isUnlocked 
                    ? "bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/40 cursor-pointer" 
                    : "bg-zinc-950/20 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50";
                
                missionsHTML += `
                    <div data-index="${idx}" class="mission-card border rounded-xl p-4 flex justify-between items-center transition-all ${activeClass} mb-3 last:mb-0">
                        <div class="flex flex-col gap-1">
                            <span class="orbitron text-[10px] tracking-widest uppercase font-black text-emerald-400">Level ${m.id} - ${m.biome.toUpperCase()} SECTOR</span>
                            <span class="text-base font-bold text-white">${m.name}</span>
                            <span class="text-[10px] text-white/60 max-w-sm">${m.description.substring(0, 85)}...</span>
                        </div>
                        <div class="flex items-center gap-3">
                            ${isUnlocked 
                                ? `<button class="start-mission-btn px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black orbitron text-xs rounded-lg transition-all active:scale-95">LAUNCH</button>` 
                                : `<i class="fa-solid fa-lock text-sm text-zinc-500 mr-2"></i>`
                            }
                        </div>
                    </div>
                `;
            });

            modal.innerHTML = `
                <div class="orbitron text-xs font-black tracking-widest text-emerald-500 uppercase mb-2">Planetary Operations</div>
                <div class="orbitron text-3xl font-black tracking-wider text-white glow-text-green mb-6 uppercase text-center">Space Colony Odyssey</div>
                
                <div class="blur-panel rounded-xl p-6 w-full max-w-lg space-y-4 max-h-[85vh] overflow-y-auto">
                    <div class="space-y-3">
                        ${missionsHTML}
                    </div>

                    <div class="h-[1px] bg-emerald-500/20 my-4"></div>
                    <button id="selector-close" class="w-full py-2.5 bg-transparent hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold orbitron text-xs rounded-xl transition-all active:scale-95">CLOSE MENU</button>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('selector-close').addEventListener('click', () => {
                modal.remove();
            });

            const cards = modal.querySelectorAll('.mission-card');
            cards.forEach(card => {
                const idx = parseInt(card.getAttribute('data-index'), 10);
                const isUnlocked = idx <= window.CampaignManager.unlockedMissionIndex;
                if (!isUnlocked) return;

                card.addEventListener('click', () => {
                    modal.remove();
                    window.CampaignManager.showBriefing(idx);
                });
            });
        }

        const campaignBtn = document.getElementById('campaign-select-btn');
        if (campaignBtn) {
            campaignBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showCampaignSelector();
            });
        }

        // Biome Selector dropdown event binding
        const biomeSelect = document.getElementById('biome-select');
        if (biomeSelect) {
            biomeSelect.addEventListener('change', (e) => {
                loadBiome(e.target.value);
            });
            biomeSelect.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        function selectBuildType(type) {
            // If clicking the currently active build type, cancel build mode
            if (buildModeActive && activeBuildType === type) {
                cancelBuildMode();
                closeDropdown();
                return;
            }

            buildModeActive = true;
            activeBuildType = type;
            deselectTower();
            closeDropdown();
            console.log(`[Build Deck] Activated build mode for type: ${type}`);

            const towerColors = {
                spore: { active: 'border-emerald-500 bg-emerald-950/60', hover: 'hover:border-emerald-500/40 hover:bg-emerald-950/40' },
                laser: { active: 'border-red-500 bg-red-950/60', hover: 'hover:border-red-500/40 hover:bg-red-950/40' },
                frost: { active: 'border-cyan-500 bg-cyan-950/60', hover: 'hover:border-cyan-500/40 hover:bg-cyan-950/40' },
                tesla: { active: 'border-indigo-500 bg-indigo-950/60', hover: 'hover:border-indigo-500/40 hover:bg-indigo-950/40' },
                artillery: { active: 'border-green-500 bg-green-950/60', hover: 'hover:border-green-500/40 hover:bg-green-950/40' },
                thermal: { active: 'border-rose-500 bg-rose-950/60', hover: 'hover:border-rose-500/40 hover:bg-rose-950/40' },
                drone_factory: { active: 'border-violet-500 bg-violet-950/60', hover: 'hover:border-violet-500/40 hover:bg-violet-950/40' }
            };

            // Update UI Card classes
            Object.keys(buildCards).forEach(k => {
                const card = buildCards[k];
                const c = towerColors[k] || towerColors.spore;
                let classStr = "";
                if (k === type) {
                    classStr = `build-card rounded-lg px-3 py-2 flex items-center justify-between border ${c.active} scale-102 cursor-pointer transition-all active:scale-98`;
                } else {
                    classStr = `build-card rounded-lg px-3 py-2 flex items-center justify-between border border-transparent ${c.hover} cursor-pointer transition-all active:scale-98`;
                }
                if (k === 'stackfarm') {
                    classStr += ' relative overflow-hidden';
                }
                card.className = classStr;
            });

            // Update hologram range dynamically
            const range = TOWER_SPECS[type].base.range;
            holographicPreview.children[1].geometry.dispose();
            holographicPreview.children[1].geometry = new THREE.CylinderGeometry(range, range, 0.1, 24);
            holographicPreview.children[2].geometry.dispose();
            holographicPreview.children[2].geometry = new THREE.RingGeometry(range - 0.05, range, 24);
            holographicPreview.visible = true;

            // Reset hologram color to default (green)
            setHologramColor(true);
        }

        function cancelBuildMode() {
            buildModeActive = false;
            console.log(`[Build Deck] Cancelled build mode`);
            const towerColors = {
                spore: { hover: 'hover:border-emerald-500/40 hover:bg-emerald-950/40' },
                laser: { hover: 'hover:border-red-500/40 hover:bg-red-950/40' },
                frost: { hover: 'hover:border-cyan-500/40 hover:bg-cyan-950/40' },
                tesla: { hover: 'hover:border-indigo-500/40 hover:bg-indigo-950/40' },
                artillery: { hover: 'hover:border-green-500/40 hover:bg-green-950/40' },
                thermal: { hover: 'hover:border-rose-500/40 hover:bg-rose-950/40' },
                drone_factory: { hover: 'hover:border-violet-500/40 hover:bg-violet-950/40' }
            };
            Object.keys(buildCards).forEach(k => {
                const card = buildCards[k];
                const c = towerColors[k] || towerColors.spore;
                let classStr = `build-card rounded-lg px-3 py-2 flex items-center justify-between border border-transparent ${c.hover} cursor-pointer transition-all active:scale-98`;
                if (k === 'stackfarm') {
                    classStr += ' relative overflow-hidden';
                }
                card.className = classStr;
            });
            holographicPreview.visible = false;
        }

        // Bind clicks to each card inside the menu
        Object.keys(buildCards).forEach(type => {
            buildCards[type].addEventListener('click', (e) => {
                e.stopPropagation();
                if (type === 'stackfarm' && gameState.wave < 5) {
                    showToast("STACKFARM UNLOCKS AT WAVE 5", "red");
                    audio.playDenied();
                    return;
                }
                selectBuildType(type);
            });
        });

        window.updateSurvivalHUD = function() {
            const foodValEl = document.getElementById('hud-food-val');
            const foodBarEl = document.getElementById('hud-food-bar');
            const foodStockEl = document.getElementById('hud-food-stock');
            const waterValEl = document.getElementById('hud-water-val');
            const waterBarEl = document.getElementById('hud-water-bar');
            const powerValEl = document.getElementById('hud-power-val');
            const powerBarEl = document.getElementById('hud-power-bar');

            if (foodValEl) foodValEl.innerText = `${Math.round(gameState.food)}%`;
            if (foodBarEl) foodBarEl.style.width = `${gameState.food}%`;
            if (foodStockEl) foodStockEl.innerText = gameState.collectedFood;
            if (waterValEl) waterValEl.innerText = `${Math.round(gameState.water)}%`;
            if (waterBarEl) waterBarEl.style.width = `${gameState.water}%`;
            if (powerValEl) powerValEl.innerText = `${Math.round(gameState.power)}%`;
            if (powerBarEl) powerBarEl.style.width = `${gameState.power}%`;
        };

        const eatBtn = document.getElementById('eat-btn');
        if (eatBtn) {
            eatBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (gameState.collectedFood > 0) {
                    gameState.collectedFood--;
                    gameState.food = Math.min(100, gameState.food + 30);
                    window.updateSurvivalHUD();
                    audio.playBuild();
                    showToast("Consumed Polyplant Food! (+30% Food)", "green");
                } else {
                    showToast("No food in stock! Build a Harvester Bunker.", "yellow");
                }
            });
        }

        document.getElementById('upgrade-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            upgradeSelectedTower();
        });
        document.getElementById('sell-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            sellSelectedTower();
        });
        document.getElementById('deselect-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deselectTower();
        });
        document.getElementById('wave-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            startWave();
        });

        // UI Collapsible Help Menu Panel
        const infoPanel = document.getElementById('info-panel');
        document.getElementById('info-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            infoPanel.classList.toggle('translate-x-[420px]');
        });
        document.getElementById('close-info').addEventListener('click', (e) => {
            e.stopPropagation();
            infoPanel.classList.add('translate-x-[420px]');
        });

        // Speed Adjustment Controls
        const speeds = [
            { id: 'speed-1x', val: 1.0 },
            { id: 'speed-2x', val: 2.0 },
            { id: 'speed-4x', val: 4.0 }
        ];
        speeds.forEach(s => {
            document.getElementById(s.id).addEventListener('click', (e) => {
                e.stopPropagation();
                gameState.gameSpeed = s.val;
                speeds.forEach(oth => {
                    const btn = document.getElementById(oth.id);
                    if (oth.id === s.id) {
                        btn.className = "px-2 py-1 text-xs font-bold rounded bg-emerald-500 text-black orbitron transition-all";
                    } else {
                        btn.className = "px-2 py-1 text-xs font-bold rounded text-emerald-400 hover:bg-emerald-500/20 orbitron transition-all";
                    }
                });
            });
        });

        // Sound Mutex control
        const soundBtn = document.getElementById('sound-toggle');
        soundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            gameState.soundEnabled = !gameState.soundEnabled;
            if (gameState.soundEnabled) {
                soundBtn.innerHTML = `<i class="fa-solid fa-volume-high text-lg"></i>`;
                soundBtn.classList.remove('text-red-400');
                soundBtn.classList.add('text-emerald-400');
            } else {
                soundBtn.innerHTML = `<i class="fa-solid fa-volume-xmark text-lg"></i>`;
                soundBtn.classList.remove('text-emerald-400');
                soundBtn.classList.add('text-red-400');
            }
        });

        function checkGameOver() {
            if (gameState.health <= 0 && !gameState.isGameOver) {
                gameState.isGameOver = true;
                
                // Show Game Over Overlay
                const endDiv = document.createElement('div');
                endDiv.className = "absolute inset-0 z-50 flex flex-col justify-center items-center bg-black/90 text-red-500 pointer-events-auto p-4";
                endDiv.innerHTML = `
                    <div class="orbitron text-5xl font-black tracking-widest text-red-500 glow-text-green mb-2 animate-pulse">BASE DEFENSES BREACHED</div>
                    <div class="text-xl text-emerald-400 mb-8 font-semibold uppercase tracking-wider">The Command HQ bunker has been breached and overrun.</div>
                    <div class="blur-panel rounded-xl p-6 text-center max-w-sm space-y-4">
                        <span class="text-xs uppercase tracking-widest text-emerald-500 font-bold block">Final Mission Stats</span>
                        <div class="flex justify-around items-center gap-8 text-white">
                            <div><span class="block text-2xl font-black orbitron text-yellow-400">${gameState.wave}</span><span class="text-[10px] text-emerald-500 font-bold uppercase">Waves Survived</span></div>
                            <div class="h-8 w-[1px] bg-emerald-500/20"></div>
                            <div><span class="block text-2xl font-black orbitron text-emerald-400">${gameState.score}</span><span class="text-[10px] text-emerald-500 font-bold uppercase">Final Score</span></div>
                        </div>
                        <button onclick="location.reload()" class="w-full py-3 bg-red-600 hover:bg-red-500 text-black font-black orbitron text-base rounded-xl transition-all shadow-lg active:scale-95">REPLAY CAMPAIGN</button>
                    </div>
                `;
                document.body.appendChild(endDiv);
            }
        }

        /* ==========================================
           MAIN GAME CYCLE
           ========================================== */
        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);

            let dt = clock.getDelta() * gameState.gameSpeed;
            if (gameState.isGameOver) dt = 0;

            if (window.inSpaceFlightMode) {
                updateSpaceFlight(dt);
                renderer.render(scene, camera);
                return;
            }

            // Update skybox shader time
            if (skyboxController) skyboxController.update(dt);

            // 1. Core Rotating animations for Base Temple Core (Organic levitating)
            if (baseCrystal) {
                baseCrystal.rotation.y += dt * 0.8;
                baseCrystal.rotation.x = Math.sin(clock.getElapsedTime()) * 0.3;
                baseCrystal.position.y = 1.8 + Math.sin(clock.getElapsedTime() * 2.0) * 0.15;
            }

            // 2. Wave Spawning controller loop
            if (gameState.isWaveActive && waveSpawnQueue.length > 0) {
                spawnIntervalTimer += dt;
                if (spawnIntervalTimer >= SPAWN_SPEED) {
                    spawnIntervalTimer = 0;
                    const nextSpawn = waveSpawnQueue.shift();
                    if (nextSpawn.type === 'ant') {
                        enemies.push(new AntEnemy(nextSpawn));
                    } else if (nextSpawn.type === 'ufo') {
                        enemies.push(new UfoEnemy(nextSpawn));
                    } else if (nextSpawn.type === 'golem') {
                        enemies.push(new GolemEnemy(nextSpawn));
                    } else if (nextSpawn.type === 'wasp') {
                        enemies.push(new WaspEnemy(nextSpawn));
                    } else if (nextSpawn.type === 'carrier') {
                        enemies.push(new CarrierEnemy(nextSpawn));
                    } else if (nextSpawn.type === 'stealth') {
                        enemies.push(new StealthEnemy(nextSpawn));
                    } else if (nextSpawn.type === 'ram') {
                        enemies.push(new RamEnemy(nextSpawn));
                    } else if (nextSpawn.type === 'scout') {
                        enemies.push(new ScoutEnemy(nextSpawn));
                    } else {
                        enemies.push(new ScarabEnemy(nextSpawn));
                    }
                }
            }

            // 3. Update active elements
            // Update enemies (going backward to allow safe splicing)
            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                enemy.update(dt);
                if (enemy.isDead) {
                    enemies.splice(i, 1);
                }
            }

            // Update towers
            towers.forEach(tower => tower.update(dt));

            // Update active bullets
            for (let i = projectiles.length - 1; i >= 0; i--) {
                const bullet = projectiles[i];
                bullet.update(dt);
                if (bullet.isDead) {
                    projectiles.splice(i, 1);
                }
            }

            // Update particle explosions
            particles.update(dt);

            // Update flora swaying & fauna ambient loops
            if (window.updateFlora) window.updateFlora(dt);
            if (window.updateFauna) window.updateFauna(dt, GRID_SIZE, CELL_SIZE);

            // Update Polyplants and Scarab Harvesters
            if (window.updatePolyplants) window.updatePolyplants(dt);

            // Polyplant procedural spawning
            if (!gameState.isGameOver) {
                window.polyplantSpawnTimer = (window.polyplantSpawnTimer || 0) + dt;
                if (window.polyplantSpawnTimer >= 15.0) {
                    window.polyplantSpawnTimer = 0;
                    const activeCount = window.polyplants.filter(p => !p.isHarvested).length;
                    if (activeCount < 8) {
                        if (window.spawnPolyplant) {
                            window.spawnPolyplant(scene, grid, GRID_SIZE, CELL_TYPES);
                        }
                    }
                }
            }

            // Survival status tick
            if (!gameState.isGameOver) {
                // Drain values over time
                gameState.food = Math.max(0, gameState.food - 0.08 * dt);
                gameState.water = Math.max(0, gameState.water - 0.12 * dt);
                gameState.power = Math.max(0, gameState.power - 0.06 * dt);

                // Automated replenish from structures
                towers.forEach(t => {
                    if (t.type === 'water_pump') {
                        gameState.water = Math.min(100, gameState.water + 0.5 * dt);
                    } else if (t.type === 'generator') {
                        gameState.power = Math.min(100, gameState.power + 0.6 * dt);
                    }
                });

                // Selection boost: base selection recharges power
                if (typeof selectedBaseActive !== 'undefined' && selectedBaseActive) {
                    gameState.power = Math.min(100, gameState.power + 1.2 * dt);
                }

                // If any bar is 0, drain health
                if (gameState.food <= 0 || gameState.water <= 0 || gameState.power <= 0) {
                    window.survivalDamageTimer = (window.survivalDamageTimer || 0) + dt;
                    if (window.survivalDamageTimer >= 2.0) {
                        window.survivalDamageTimer = 0;
                        gameState.health = Math.max(0, gameState.health - 1);
                        document.getElementById('health-value').innerText = gameState.health;
                        audio.playBaseDamage();
                        showToast("SURVIVAL HAZARD: HQ INTEGRITY DRAINING!", "red");
                        checkGameOver();
                    }
                    
                    const survivalPanel = document.querySelector('.blur-panel.border-emerald-500\\/20');
                    if (survivalPanel) {
                        survivalPanel.style.borderColor = Math.sin(Date.now() * 0.015) > 0 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 197, 94, 0.2)';
                        survivalPanel.style.boxShadow = Math.sin(Date.now() * 0.015) > 0 ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none';
                    }
                } else {
                    const survivalPanel = document.querySelector('.blur-panel.border-emerald-500\\/20');
                    if (survivalPanel) {
                        survivalPanel.style.borderColor = 'rgba(34, 197, 94, 0.2)';
                        survivalPanel.style.boxShadow = 'none';
                    }
                }

                if (window.updateSurvivalHUD) window.updateSurvivalHUD();
            }

            // Update base auto-defenses
            if (window.updateBaseDefenses) window.updateBaseDefenses(dt);

            // 4. Wave End Check
            if (gameState.isWaveActive && waveSpawnQueue.length === 0 && enemies.length === 0) {
                endWave();
            }

            // 5. Update controls & Three camera renderer
            controls.update();
            renderer.render(scene, camera);
        }

        // Window size adjustment adapter
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        function initAnimatedFavicon() {
            const favCanvas = document.createElement('canvas');
            favCanvas.width = 32;
            favCanvas.height = 32;
            const fCtx = favCanvas.getContext('2d');

            let link = document.querySelector("link[rel*='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'shortcut icon';
                document.head.appendChild(link);
            }

            let frame = 0;
            let enemyX = 28;
            let enemyY = 4;
            const turretX = 10;
            const turretY = 22;
            let laserActive = false;
            let explosionFrame = 0;

            setInterval(() => {
                fCtx.fillStyle = '#020703'; // Dark background
                fCtx.fillRect(0, 0, 32, 32);

                // Grid lines
                fCtx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
                fCtx.lineWidth = 1;
                for (let i = 8; i < 32; i += 8) {
                    fCtx.beginPath();
                    fCtx.moveTo(i, 0); fCtx.lineTo(i, 32);
                    fCtx.stroke();
                    fCtx.beginPath();
                    fCtx.moveTo(0, i); fCtx.lineTo(32, i);
                    fCtx.stroke();
                }

                // Glowing base
                const basePulse = 3 + Math.sin(frame * 0.4) * 1.5;
                fCtx.fillStyle = '#ec4899';
                fCtx.beginPath();
                fCtx.arc(6, 26, basePulse, 0, Math.PI * 2);
                fCtx.fill();

                // Enemy pathing
                if (explosionFrame === 0) {
                    const dx = 6 - enemyX;
                    const dy = 26 - enemyY;
                    const dist = Math.hypot(dx, dy);
                    if (dist < 4) {
                        enemyX = 28;
                        enemyY = 4;
                    } else {
                        enemyX += (dx / dist) * 1.2;
                        enemyY += (dy / dist) * 1.2;
                    }
                }

                // Laser logic
                laserActive = (frame % 8 < 2) && (explosionFrame === 0);
                if (laserActive) {
                    const distToEnemy = Math.hypot(enemyX - turretX, enemyY - turretY);
                    if (distToEnemy < 18) {
                        fCtx.strokeStyle = '#facc15';
                        fCtx.lineWidth = 1.5;
                        fCtx.beginPath();
                        fCtx.moveTo(turretX, turretY);
                        fCtx.lineTo(enemyX, enemyY);
                        fCtx.stroke();

                        if (Math.random() < 0.45) {
                            explosionFrame = 3;
                        }
                    }
                }

                // Enemy drawing
                if (explosionFrame > 0) {
                    fCtx.fillStyle = '#ef4444';
                    fCtx.fillRect(enemyX - 2, enemyY - 1, 1, 1);
                    fCtx.fillStyle = '#f97316';
                    fCtx.fillRect(enemyX + 1, enemyY - 2, 1, 1);
                    fCtx.fillStyle = '#facc15';
                    fCtx.fillRect(enemyX, enemyY + 1, 1, 1);
                    explosionFrame--;
                    if (explosionFrame === 0) {
                        enemyX = 28;
                        enemyY = 4;
                    }
                } else {
                    fCtx.fillStyle = '#ef4444';
                    fCtx.beginPath();
                    fCtx.arc(enemyX, enemyY, 2, 0, Math.PI * 2);
                    fCtx.fill();
                }

                // Turret drawing
                fCtx.fillStyle = '#1e293b';
                fCtx.beginPath();
                fCtx.arc(turretX, turretY, 4, 0, Math.PI * 2);
                fCtx.fill();

                const angle = Math.atan2(enemyY - turretY, enemyX - turretX);
                fCtx.strokeStyle = '#94a3b8';
                fCtx.lineWidth = 2;
                fCtx.beginPath();
                fCtx.moveTo(turretX, turretY);
                fCtx.lineTo(turretX + Math.cos(angle) * 6, turretY + Math.sin(angle) * 6);
                fCtx.stroke();

                link.href = favCanvas.toDataURL('image/png');
                frame++;
            }, 100);
        }

        /* ==========================================
           OPEN WORLD SPACE EXPLORATION MODE
           ========================================== */
        window.inSpaceFlightMode = false;
        window.spaceFlightGroup = null;
        window.spacePlayerShip = null;
        window.spaceShards = [];
        window.spacePirates = [];
        window.playerLasers = [];
        window.pirateProjectiles = [];
        window.keysPressed = {};

        window.harvestedShardsCount = 0;
        window.harvestedBountyGold = 0;
        window.playerShield = 100;
        let lastLaserFireTime = 0;
        let spaceFlightPrevCamPos = new THREE.Vector3();

        // ================================================================
        // DEEP SPACE ENVIRONMENT — Procedural Nebulae / Stars / Asteroids
        // ================================================================

        function generateSpaceTexture(size = 2048) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // Deep black base
            ctx.fillStyle = '#010108';
            ctx.fillRect(0, 0, size, size);

            // Multi-layer nebula clouds
            const nebulaConfigs = [
                { hue: 280, sat: 85, light: 30, alpha: 0.22, count: 6 },  // Violet
                { hue: 210, sat: 75, light: 25, alpha: 0.18, count: 5 },  // Deep blue
                { hue: 330, sat: 80, light: 28, alpha: 0.14, count: 4 },  // Magenta
                { hue: 190, sat: 70, light: 20, alpha: 0.12, count: 3 },  // Teal
                { hue: 25,  sat: 90, light: 35, alpha: 0.08, count: 3 },  // Warm orange wisps
            ];
            nebulaConfigs.forEach(cfg => {
                for (let i = 0; i < cfg.count; i++) {
                    const x = Math.random() * size;
                    const y = Math.random() * size;
                    const r = 180 + Math.random() * 400;
                    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
                    grad.addColorStop(0, `hsla(${cfg.hue + Math.random()*20 - 10}, ${cfg.sat}%, ${cfg.light}%, ${cfg.alpha})`);
                    grad.addColorStop(0.4, `hsla(${cfg.hue}, ${cfg.sat - 10}%, ${cfg.light - 8}%, ${cfg.alpha * 0.5})`);
                    grad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Bright core stars (big glowing ones)
            for (let i = 0; i < 30; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const starR = 2 + Math.random() * 6;
                const glow = ctx.createRadialGradient(x, y, 0, x, y, starR * 8);
                const hue = [0, 30, 60, 200, 240, 300][Math.floor(Math.random() * 6)];
                glow.addColorStop(0, `hsla(${hue}, 80%, 95%, 1.0)`);
                glow.addColorStop(0.15, `hsla(${hue}, 70%, 80%, 0.6)`);
                glow.addColorStop(0.5, `hsla(${hue}, 60%, 50%, 0.1)`);
                glow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(x, y, starR * 8, 0, Math.PI * 2);
                ctx.fill();
                // Hot white core
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.95;
                ctx.beginPath();
                ctx.arc(x, y, starR * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Dense starfield (faint)
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 1200; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const s = Math.random() * 2.0;
                ctx.globalAlpha = 0.15 + Math.random() * 0.65;
                ctx.fillRect(x, y, s, s);
            }

            // Colored tiny stars
            for (let i = 0; i < 200; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const s = 0.8 + Math.random() * 1.5;
                const hue = [200, 220, 300, 30, 60][Math.floor(Math.random()*5)];
                ctx.globalAlpha = 0.3 + Math.random() * 0.5;
                ctx.fillStyle = `hsl(${hue}, 80%, 75%)`;
                ctx.fillRect(x, y, s, s);
            }

            ctx.globalAlpha = 1.0;
            return new THREE.CanvasTexture(canvas);
        }

        // ── SDF Volumetric Nebula Shader ────────────────────────────
        const nebulaVertexShader = `
            varying vec2 vUv;
            varying vec3 vWorldPos;
            void main() {
                vUv = uv;
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vWorldPos = wp.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const nebulaFragmentShader = `
            uniform float uTime;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            uniform float uDensity;
            uniform float uSpeed;
            varying vec2 vUv;
            varying vec3 vWorldPos;

            // Simplex-like hash
            vec3 hash33(vec3 p) {
                p = fract(p * vec3(443.897, 441.423, 437.195));
                p += dot(p, p.yzx + 19.19);
                return fract((p.xxy + p.yxx) * p.zyx);
            }

            float noise3D(vec3 p) {
                vec3 i = floor(p);
                vec3 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                float n = mix(
                    mix(mix(dot(hash33(i), f), dot(hash33(i + vec3(1,0,0)), f - vec3(1,0,0)), f.x),
                        mix(dot(hash33(i + vec3(0,1,0)), f - vec3(0,1,0)), dot(hash33(i + vec3(1,1,0)), f - vec3(1,1,0)), f.x), f.y),
                    mix(mix(dot(hash33(i + vec3(0,0,1)), f - vec3(0,0,1)), dot(hash33(i + vec3(1,0,1)), f - vec3(1,0,1)), f.x),
                        mix(dot(hash33(i + vec3(0,1,1)), f - vec3(0,1,1)), dot(hash33(i + vec3(1,1,1)), f - vec3(1,1,1)), f.x), f.y),
                    f.z);
                return n * 0.5 + 0.5;
            }

            float fbm(vec3 p) {
                float val = 0.0;
                float amp = 0.5;
                float freq = 1.0;
                for (int i = 0; i < 5; i++) {
                    val += amp * noise3D(p * freq);
                    freq *= 2.1;
                    amp *= 0.48;
                }
                return val;
            }

            void main() {
                vec3 p = vWorldPos * 0.012 + vec3(uTime * uSpeed * 0.3, uTime * uSpeed * 0.15, uTime * uSpeed * 0.22);
                float n = fbm(p);
                float n2 = fbm(p * 1.5 + vec3(3.7, 1.2, 5.4));

                float density = smoothstep(0.35, 0.8, n * n2) * uDensity;

                vec3 col = mix(uColor1, uColor2, n);
                col = mix(col, uColor3, n2 * 0.5);
                col *= 1.0 + 0.3 * sin(uTime * 0.5 + n * 6.28);

                // Edge glow
                float edge = smoothstep(0.0, 0.15, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
                density *= edge;

                gl_FragColor = vec4(col, density * 0.6);
            }
        `;

        // ── Space Dust Particle Shader ──────────────────────────────
        const dustVertexShader = `
            attribute float aSize;
            attribute float aAlpha;
            uniform float uTime;
            varying float vAlpha;
            void main() {
                vAlpha = aAlpha;
                vec3 pos = position;
                pos.y += sin(uTime * 0.5 + position.x * 0.1) * 0.3;
                pos.x += cos(uTime * 0.3 + position.z * 0.08) * 0.2;
                vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = aSize * (120.0 / -mvPos.z);
                gl_Position = projectionMatrix * mvPos;
            }
        `;
        const dustFragmentShader = `
            varying float vAlpha;
            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;
                float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
                gl_FragColor = vec4(0.7, 0.8, 1.0, alpha * 0.35);
            }
        `;

        function initSpaceExploration() {
            if (window.spaceFlightGroup) return;

            window.spaceFlightGroup = new THREE.Group();
            scene.add(window.spaceFlightGroup);

            // ── Skybox Cube with nebula textures ────────────────────
            const skyTex = generateSpaceTexture(2048);
            skyTex.wrapS = skyTex.wrapT = THREE.RepeatWrapping;
            const skyMats = [];
            for (let i = 0; i < 6; i++) {
                const faceTex = generateSpaceTexture(1024);
                skyMats.push(new THREE.MeshBasicMaterial({ map: faceTex, side: THREE.BackSide }));
            }
            const skyGeo = new THREE.BoxGeometry(2400, 2400, 2400);
            const skybox = new THREE.Mesh(skyGeo, skyMats);
            skybox.name = 'spaceSkybox';
            window.spaceFlightGroup.add(skybox);

            // ── Bottom nebula plane (enhanced) ──────────────────────
            const spacePlaneGeo = new THREE.PlaneGeometry(2000, 2000);
            const spacePlaneMat = new THREE.MeshBasicMaterial({
                map: skyTex,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7
            });
            const spacePlane = new THREE.Mesh(spacePlaneGeo, spacePlaneMat);
            spacePlane.rotation.x = -Math.PI / 2;
            spacePlane.position.y = -30;
            window.spaceFlightGroup.add(spacePlane);

            // ── 3D Instanced Starfield (3000 stars) ─────────────────
            const starCount = 3000;
            const starGeo = new THREE.SphereGeometry(1, 4, 4);
            const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const starField = new THREE.InstancedMesh(starGeo, starMat, starCount);
            const starDummy = new THREE.Object3D();
            const starColors = new Float32Array(starCount * 3);

            for (let i = 0; i < starCount; i++) {
                starDummy.position.set(
                    (Math.random() - 0.5) * 2200,
                    (Math.random() - 0.5) * 800,
                    (Math.random() - 0.5) * 2200
                );
                const scale = 0.08 + Math.random() * 0.35;
                starDummy.scale.set(scale, scale, scale);
                starDummy.updateMatrix();
                starField.setMatrixAt(i, starDummy.matrix);

                // Random star colors: white, blue, orange, violet
                const colorRoll = Math.random();
                let r, g, b;
                if (colorRoll < 0.6) { r = 1.0; g = 1.0; b = 1.0; }
                else if (colorRoll < 0.75) { r = 0.6; g = 0.8; b = 1.0; }
                else if (colorRoll < 0.88) { r = 1.0; g = 0.7; b = 0.4; }
                else { r = 0.8; g = 0.5; b = 1.0; }
                starColors[i * 3] = r;
                starColors[i * 3 + 1] = g;
                starColors[i * 3 + 2] = b;
            }
            starField.instanceMatrix.needsUpdate = true;
            starGeo.setAttribute('color', new THREE.InstancedBufferAttribute(starColors, 3));
            starMat.vertexColors = false; // keep simple white for perf
            window.spaceFlightGroup.add(starField);
            window.spaceStarField = starField;

            // ── Volumetric SDF Nebula Clouds (3 layers) ─────────────
            window.nebulaUniforms = [];
            const nebulaSetups = [
                { pos: [120, 15, 180], scale: [220, 110, 220], c1: [0.3, 0.05, 0.6], c2: [0.1, 0.2, 0.8], c3: [0.9, 0.2, 0.5], density: 1.2, speed: 0.02 },
                { pos: [-200, -5, -100], scale: [280, 130, 260], c1: [0.02, 0.3, 0.5], c2: [0.0, 0.6, 0.6], c3: [0.15, 0.1, 0.4], density: 0.9, speed: 0.015 },
                { pos: [50, 30, -250], scale: [200, 90, 200], c1: [0.7, 0.15, 0.1], c2: [0.9, 0.4, 0.1], c3: [0.4, 0.05, 0.3], density: 0.7, speed: 0.025 },
            ];
            nebulaSetups.forEach(cfg => {
                const unis = {
                    uTime: { value: 0 },
                    uColor1: { value: new THREE.Vector3(...cfg.c1) },
                    uColor2: { value: new THREE.Vector3(...cfg.c2) },
                    uColor3: { value: new THREE.Vector3(...cfg.c3) },
                    uDensity: { value: cfg.density },
                    uSpeed: { value: cfg.speed }
                };
                window.nebulaUniforms.push(unis);

                const nebMat = new THREE.ShaderMaterial({
                    vertexShader: nebulaVertexShader,
                    fragmentShader: nebulaFragmentShader,
                    uniforms: unis,
                    transparent: true,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending
                });
                const nebGeo = new THREE.PlaneGeometry(cfg.scale[0], cfg.scale[1], 1, 1);
                const neb = new THREE.Mesh(nebGeo, nebMat);
                neb.position.set(...cfg.pos);
                neb.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
                neb.rotation.z = Math.random() * Math.PI;
                window.spaceFlightGroup.add(neb);

                // Vertical layer for depth
                const neb2 = new THREE.Mesh(nebGeo.clone(), nebMat.clone());
                neb2.material.uniforms = { ...unis, uDensity: { value: cfg.density * 0.5 } };
                neb2.position.set(cfg.pos[0] + 30, cfg.pos[1] + 40, cfg.pos[2] - 20);
                neb2.rotation.y = Math.random() * Math.PI;
                window.spaceFlightGroup.add(neb2);
            });

            // ── Asteroid Belt (Instanced) ───────────────────────────
            const asteroidCount = 80;
            const asteroidGeo = new THREE.DodecahedronGeometry(1, 0);
            const asteroidMat = new THREE.MeshStandardMaterial({
                color: 0x3a3633,
                roughness: 0.85,
                metalness: 0.15,
                flatShading: true
            });
            const asteroidField = new THREE.InstancedMesh(asteroidGeo, asteroidMat, asteroidCount);
            const astDummy = new THREE.Object3D();
            window.asteroidData = [];

            for (let i = 0; i < asteroidCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 60 + Math.random() * 350;
                const height = (Math.random() - 0.5) * 30;
                astDummy.position.set(Math.cos(angle) * dist, height, Math.sin(angle) * dist);
                const sc = 0.6 + Math.random() * 3.5;
                astDummy.scale.set(sc, sc * (0.5 + Math.random() * 0.8), sc);
                astDummy.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
                astDummy.updateMatrix();
                asteroidField.setMatrixAt(i, astDummy.matrix);

                window.asteroidData.push({
                    rotSpeed: new THREE.Vector3(
                        (Math.random() - 0.5) * 0.3,
                        (Math.random() - 0.5) * 0.5,
                        (Math.random() - 0.5) * 0.3
                    ),
                    basePos: astDummy.position.clone(),
                    scale: astDummy.scale.clone(),
                    rot: new THREE.Euler(astDummy.rotation.x, astDummy.rotation.y, astDummy.rotation.z)
                });
            }
            asteroidField.instanceMatrix.needsUpdate = true;
            asteroidField.castShadow = true;
            window.spaceFlightGroup.add(asteroidField);
            window.spaceAsteroidField = asteroidField;

            // ── Space Dust Particles ────────────────────────────────
            const dustCount = 2000;
            const dustPositions = new Float32Array(dustCount * 3);
            const dustSizes = new Float32Array(dustCount);
            const dustAlphas = new Float32Array(dustCount);
            for (let i = 0; i < dustCount; i++) {
                dustPositions[i * 3]     = (Math.random() - 0.5) * 600;
                dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
                dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 600;
                dustSizes[i] = 1.0 + Math.random() * 3.0;
                dustAlphas[i] = 0.15 + Math.random() * 0.6;
            }
            const dustGeo2 = new THREE.BufferGeometry();
            dustGeo2.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
            dustGeo2.setAttribute('aSize', new THREE.BufferAttribute(dustSizes, 1));
            dustGeo2.setAttribute('aAlpha', new THREE.BufferAttribute(dustAlphas, 1));

            window.spaceDustUniforms = { uTime: { value: 0 } };
            const dustMat2 = new THREE.ShaderMaterial({
                vertexShader: dustVertexShader,
                fragmentShader: dustFragmentShader,
                uniforms: window.spaceDustUniforms,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            const dustParticles = new THREE.Points(dustGeo2, dustMat2);
            window.spaceFlightGroup.add(dustParticles);
            window.spaceDustParticles = dustParticles;

            // ── Distant Planet with Atmosphere ──────────────────────
            const planetGeo = new THREE.SphereGeometry(45, 32, 32);
            const planetMat = new THREE.MeshStandardMaterial({
                color: 0x1a3a5c,
                roughness: 0.7,
                metalness: 0.3,
                emissive: 0x0a1628,
                emissiveIntensity: 0.3
            });
            const planet = new THREE.Mesh(planetGeo, planetMat);
            planet.position.set(350, 80, -300);
            window.spaceFlightGroup.add(planet);

            // Atmosphere glow ring
            const atmosGeo = new THREE.SphereGeometry(48, 32, 32);
            const atmosMat = new THREE.MeshBasicMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.12,
                side: THREE.BackSide
            });
            const atmos = new THREE.Mesh(atmosGeo, atmosMat);
            atmos.position.copy(planet.position);
            window.spaceFlightGroup.add(atmos);

            // Planet light
            const planetLight = new THREE.PointLight(0x38bdf8, 1.5, 200);
            planetLight.position.copy(planet.position);
            window.spaceFlightGroup.add(planetLight);

            // ── Second distant gas giant ────────────────────────────
            const giant2Geo = new THREE.SphereGeometry(70, 24, 24);
            const giant2Mat = new THREE.MeshStandardMaterial({
                color: 0x8b5a2b,
                roughness: 0.6,
                emissive: 0x3d2312,
                emissiveIntensity: 0.2
            });
            const giant2 = new THREE.Mesh(giant2Geo, giant2Mat);
            giant2.position.set(-400, -40, 350);
            window.spaceFlightGroup.add(giant2);

            // Rings
            const ringGeo2 = new THREE.RingGeometry(85, 110, 48);
            const ringMat2 = new THREE.MeshBasicMaterial({
                color: 0xc49a6c,
                transparent: true,
                opacity: 0.25,
                side: THREE.DoubleSide
            });
            const rings2 = new THREE.Mesh(ringGeo2, ringMat2);
            rings2.position.copy(giant2.position);
            rings2.rotation.x = Math.PI / 2.3;
            window.spaceFlightGroup.add(rings2);

            // ── Bright distant sun / star ───────────────────────────
            const sunGeo = new THREE.SphereGeometry(12, 16, 16);
            const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff4cc });
            const sun = new THREE.Mesh(sunGeo, sunMat);
            sun.position.set(800, 200, 500);
            window.spaceFlightGroup.add(sun);

            // Sun lens flare glow
            const sunGlowGeo = new THREE.SphereGeometry(28, 16, 16);
            const sunGlowMat = new THREE.MeshBasicMaterial({
                color: 0xfff8e1,
                transparent: true,
                opacity: 0.15
            });
            const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
            sunGlow.position.copy(sun.position);
            window.spaceFlightGroup.add(sunGlow);

            const sunLight = new THREE.PointLight(0xfff4cc, 2.5, 1200);
            sunLight.position.copy(sun.position);
            window.spaceFlightGroup.add(sunLight);

            // ── Engine Trail particle system ────────────────────────
            window.engineTrailParticles = [];

            // ── Lighting ────────────────────────────────────────────
            const starLight = new THREE.DirectionalLight(0x7dd3fc, 1.0);
            starLight.position.set(50, 100, 50);
            window.spaceFlightGroup.add(starLight);

            const starLight2 = new THREE.DirectionalLight(0xd946ef, 0.6);
            starLight2.position.set(-50, 100, -50);
            window.spaceFlightGroup.add(starLight2);

            const ambientSpace = new THREE.AmbientLight(0x1e1b4b, 0.4);
            window.spaceFlightGroup.add(ambientSpace);

            // ── Key bindings ────────────────────────────────────────
            window.addEventListener('keydown', (e) => {
                if (!window.inSpaceFlightMode) return;
                window.keysPressed[e.key.toLowerCase()] = true;
            });
            window.addEventListener('keyup', (e) => {
                if (!window.inSpaceFlightMode) return;
                window.keysPressed[e.key.toLowerCase()] = false;
            });
        }

        window.enterSpaceFlightMode = function() {
            if (window.inSpaceFlightMode) return;

            audio.playBuild();
            gameState.isPaused = true;
            
            window.tdVisibilityMap = new Map();
            scene.children.forEach(child => {
                if (child === window.spaceFlightGroup) return;
                window.tdVisibilityMap.set(child, child.visible);
                if (child.isLight && (child.type === 'AmbientLight' || child.type === 'DirectionalLight')) {
                    // Stay visible
                } else {
                    child.visible = false;
                }
            });

            document.getElementById('ui-container').classList.add('hidden');
            document.getElementById('space-flight-hud').classList.remove('hidden');

            spaceFlightPrevCamPos.copy(camera.position);
            controls.enabled = false;

            initSpaceExploration();
            window.spaceFlightGroup.visible = true;

            window.harvestedShardsCount = 0;
            window.harvestedBountyGold = 0;
            window.playerShield = 100;
            updateSpaceHUD();

            if (window.spacePlayerShip) {
                window.spaceFlightGroup.remove(window.spacePlayerShip.mesh);
            }

            let shipMesh;
            if (window.odyseeModelTemplate) {
                shipMesh = window.odyseeModelTemplate.clone();
            } else {
                shipMesh = new THREE.Group();
                const bodyGeo = new THREE.ConeGeometry(0.6, 2.5, 5);
                bodyGeo.rotateX(Math.PI / 2);
                const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.1 });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                shipMesh.add(body);

                const wingGeo = new THREE.BoxGeometry(2.0, 0.08, 0.6);
                const wingMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8, roughness: 0.2 });
                const wings = new THREE.Mesh(wingGeo, wingMat);
                wings.position.set(0, -0.1, -0.4);
                shipMesh.add(wings);
            }

            const thrusterLight = new THREE.PointLight(0x06b6d4, 2.0, 5.0);
            thrusterLight.position.set(0, 0, -1.5);
            shipMesh.add(thrusterLight);

            shipMesh.position.set(0, 0, 0);
            window.spaceFlightGroup.add(shipMesh);

            window.spacePlayerShip = {
                mesh: shipMesh,
                yaw: 0,
                speed: 0,
                maxSpeed: 45,
                thrustPower: 55,
                turnSpeed: 2.8,
                drag: 0.98
            };

            window.spaceShards.forEach(s => window.spaceFlightGroup.remove(s.mesh));
            window.spaceShards = [];

            window.spacePirates.forEach(p => window.spaceFlightGroup.remove(p.mesh));
            window.spacePirates = [];

            window.playerLasers.forEach(l => window.spaceFlightGroup.remove(l.mesh));
            window.playerLasers = [];

            window.pirateProjectiles.forEach(p => window.spaceFlightGroup.remove(p.mesh));
            window.pirateProjectiles = [];

            const shardGeo = new THREE.OctahedronGeometry(0.7);
            const shardMat = new THREE.MeshStandardMaterial({
                color: 0xd946ef,
                emissive: 0xa855f7,
                emissiveIntensity: 1.5,
                roughness: 0.1,
                metalness: 0.9
            });

            for (let i = 0; i < 22; i++) {
                const sMesh = new THREE.Mesh(shardGeo, shardMat);
                const sx = (Math.random() - 0.5) * 500;
                const sz = (Math.random() - 0.5) * 500;
                sMesh.position.set(sx, 0, sz);
                window.spaceFlightGroup.add(sMesh);
                
                const sLight = new THREE.PointLight(0xd946ef, 0.8, 3);
                sMesh.add(sLight);

                window.spaceShards.push({
                    mesh: sMesh,
                    position: sMesh.position
                });
            }

            for (let i = 0; i < 6; i++) {
                spawnSpacePirate();
            }

            camera.position.set(0, 5, -15);
            camera.lookAt(0, 0, 0);

            window.inSpaceFlightMode = true;
            window.keysPressed = {};
            showFlightToast("ORBIT SECTOR REACHED: ENGINE SYSTEMS ONLINE", "cyan");
        };

        function spawnSpacePirate() {
            if (!window.spaceFlightGroup) return;
            const pirateGroup = new THREE.Group();
            
            const coneGeo = new THREE.ConeGeometry(0.5, 2.0, 4);
            coneGeo.rotateX(Math.PI / 2);
            const cone = new THREE.Mesh(coneGeo, new THREE.MeshStandardMaterial({
                color: 0xe11d48,
                metalness: 0.8,
                roughness: 0.2
            }));
            pirateGroup.add(cone);

            const wings = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.5), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
            wings.position.set(0, -0.1, -0.3);
            pirateGroup.add(wings);

            const engineGlow = new THREE.PointLight(0xef4444, 1.5, 4);
            engineGlow.position.set(0, 0, -1.2);
            pirateGroup.add(engineGlow);

            const angle = Math.random() * Math.PI * 2;
            const dist = 75 + Math.random() * 150;
            const px = Math.sin(angle) * dist;
            const pz = Math.cos(angle) * dist;
            pirateGroup.position.set(px, 0, pz);

            window.spaceFlightGroup.add(pirateGroup);
            window.spacePirates.push({
                mesh: pirateGroup,
                position: pirateGroup.position,
                health: 100,
                shootCooldown: 1.5 + Math.random() * 2.0
            });
        }

        window.exitSpaceFlightMode = function() {
            if (!window.inSpaceFlightMode) return;

            window.inSpaceFlightMode = false;
            audio.playBuild();

            const recoveredGold = window.harvestedBountyGold + (window.harvestedShardsCount * 25);
            gameState.gold += recoveredGold;

            document.getElementById('space-flight-hud').classList.add('hidden');
            document.getElementById('ui-container').classList.remove('hidden');

            if (window.spaceFlightGroup) {
                window.spaceFlightGroup.visible = false;
            }

            // Clean up engine trail particles
            if (window.engineTrailParticles) {
                window.engineTrailParticles.forEach(tp => {
                    window.spaceFlightGroup.remove(tp.mesh);
                    tp.mesh.geometry.dispose();
                    tp.mesh.material.dispose();
                });
                window.engineTrailParticles = [];
            }

            window.tdVisibilityMap.forEach((v, child) => {
                child.visible = v;
            });

            camera.position.copy(spaceFlightPrevCamPos);
            controls.enabled = true;
            controls.target.set(GRID_SIZE * CELL_SIZE / 2, 0, GRID_SIZE * CELL_SIZE / 2);
            controls.update();

            gameState.isPaused = false;
            updateStatsUI();

            showToast(`WARPED HOME! +${recoveredGold}¢ Credits Transferred`, "green");
        };

        function showFlightToast(msg, color) {
            const container = document.getElementById('flight-toast-container');
            if (!container) return;

            const el = document.createElement('div');
            el.className = `blur-panel px-4 py-2 rounded-lg font-bold border ${color === 'red' ? 'border-red-500/50 text-red-300' : 'border-cyan-500/50 text-cyan-300'} text-xs uppercase shadow-2xl transition-all duration-300 mb-2`;
            el.innerText = msg;
            container.appendChild(el);

            setTimeout(() => {
                el.classList.add('opacity-0', 'scale-90');
                setTimeout(() => el.remove(), 400);
            }, 2500);
        }

        function updateSpaceHUD() {
            const shieldEl = document.getElementById('flight-shield-val');
            const goldEl = document.getElementById('flight-gold-val');
            const shardsEl = document.getElementById('flight-shards-val');

            if (shieldEl) shieldEl.innerText = `${Math.round(window.playerShield)}%`;
            if (goldEl) goldEl.innerText = `${window.harvestedBountyGold}¢`;
            if (shardsEl) shardsEl.innerText = window.harvestedShardsCount;
        }

        function updateSpaceFlight(dt) {
            if (!window.spacePlayerShip) return;

            const ship = window.spacePlayerShip;

            if (window.keysPressed['a']) {
                ship.yaw += ship.turnSpeed * dt;
            }
            if (window.keysPressed['d']) {
                ship.yaw -= ship.turnSpeed * dt;
            }

            const rollTarget = window.keysPressed['a'] ? 0.35 : (window.keysPressed['d'] ? -0.35 : 0);
            ship.mesh.rotation.z = THREE.MathUtils.lerp(ship.mesh.rotation.z, rollTarget, 10 * dt);
            ship.mesh.rotation.y = ship.yaw;

            if (window.keysPressed['w']) {
                ship.speed = Math.min(ship.maxSpeed, ship.speed + ship.thrustPower * dt);
            } else if (window.keysPressed['s']) {
                ship.speed = Math.max(-10, ship.speed - ship.thrustPower * dt);
            } else {
                ship.speed *= ship.drag;
            }

            const moveX = Math.sin(ship.yaw) * ship.speed * dt;
            const moveZ = Math.cos(ship.yaw) * ship.speed * dt;
            ship.mesh.position.x += moveX;
            ship.mesh.position.z += moveZ;

            if (Math.abs(ship.mesh.position.x) > 600) ship.mesh.position.x *= -0.98;
            if (Math.abs(ship.mesh.position.z) > 600) ship.mesh.position.z *= -0.98;

            const now = Date.now();
            if (window.keysPressed[' '] && now - lastLaserFireTime > 260) {
                lastLaserFireTime = now;
                audio.playLaserShoot();

                const offsetLeft = new THREE.Vector3(-0.5, 0, 0.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), ship.yaw);
                const offsetRight = new THREE.Vector3(0.5, 0, 0.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), ship.yaw);

                [offsetLeft, offsetRight].forEach(offset => {
                    const laserPos = ship.mesh.position.clone().add(offset);
                    const laserGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 4);
                    laserGeo.rotateX(Math.PI / 2);
                    const laserMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
                    const laserMesh = new THREE.Mesh(laserGeo, laserMat);
                    
                    laserMesh.position.copy(laserPos);
                    laserMesh.rotation.y = ship.yaw;
                    window.spaceFlightGroup.add(laserMesh);

                    window.playerLasers.push({
                        mesh: laserMesh,
                        position: laserMesh.position,
                        direction: new THREE.Vector3(Math.sin(ship.yaw), 0, Math.cos(ship.yaw)).normalize(),
                        speed: 130.0,
                        life: 2.0
                    });
                });
            }

            for (let i = window.playerLasers.length - 1; i >= 0; i--) {
                const laser = window.playerLasers[i];
                laser.position.addScaledVector(laser.direction, laser.speed * dt);
                laser.life -= dt;

                let hit = false;
                for (let k = window.spacePirates.length - 1; k >= 0; k--) {
                    const pirate = window.spacePirates[k];
                    const dist = laser.position.distanceTo(pirate.position);
                    if (dist < 3.8) {
                        hit = true;
                        pirate.health -= 34;
                        particles.spawnHitBurst(pirate.position, 0xef4444);

                        if (pirate.health <= 0) {
                            window.harvestedBountyGold += 50;
                            audio.playExplode();
                            particles.spawnExplosion(pirate.position, 0xf97316, 25);
                            window.spaceFlightGroup.remove(pirate.mesh);
                            window.spacePirates.splice(k, 1);
                            
                            showFlightToast("BOUNTY SECURED: PIRATE FIGHTER DOWN +50¢", "cyan");
                            updateSpaceHUD();
                            
                            setTimeout(spawnSpacePirate, 4000);
                        }
                        break;
                    }
                }

                if (hit || laser.life <= 0) {
                    window.spaceFlightGroup.remove(laser.mesh);
                    window.playerLasers.splice(i, 1);
                }
            }

            const playerPos = ship.mesh.position;
            window.spacePirates.forEach(pirate => {
                const distToPlayer = pirate.position.distanceTo(playerPos);
                
                const angle = Math.atan2(playerPos.x - pirate.position.x, playerPos.z - pirate.position.z);
                pirate.mesh.rotation.y = THREE.MathUtils.lerp(pirate.mesh.rotation.y, angle, 4.0 * dt);

                if (distToPlayer > 18) {
                    pirate.position.x += Math.sin(pirate.mesh.rotation.y) * 12.0 * dt;
                    pirate.position.z += Math.cos(pirate.mesh.rotation.y) * 12.0 * dt;
                }

                pirate.shootCooldown -= dt;
                if (distToPlayer < 75 && pirate.shootCooldown <= 0) {
                    pirate.shootCooldown = 2.0 + Math.random() * 1.5;

                    const ballGeo = new THREE.SphereGeometry(0.18, 6, 6);
                    const ballMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
                    const ball = new THREE.Mesh(ballGeo, ballMat);
                    ball.position.copy(pirate.position);
                    window.spaceFlightGroup.add(ball);

                    const dir = new THREE.Vector3().subVectors(playerPos, pirate.position).normalize();
                    window.pirateProjectiles.push({
                        mesh: ball,
                        position: ball.position,
                        direction: dir,
                        speed: 55.0,
                        life: 3.5
                    });
                }
            });

            for (let i = window.pirateProjectiles.length - 1; i >= 0; i--) {
                const proj = window.pirateProjectiles[i];
                proj.position.addScaledVector(proj.direction, proj.speed * dt);
                proj.life -= dt;

                const dist = proj.position.distanceTo(playerPos);
                if (dist < 2.5) {
                    window.playerShield = Math.max(0, window.playerShield - 15);
                    audio.playBaseDamage();
                    particles.spawnHitBurst(playerPos, 0xef4444);
                    updateSpaceHUD();

                    window.spaceFlightGroup.remove(proj.mesh);
                    window.pirateProjectiles.splice(i, 1);

                    if (window.playerShield <= 0) {
                        showFlightToast("SHIELD FAILURE! SHUTTING DOWN WARP...", "red");
                        window.playerShield = 100;
                        ship.mesh.position.set(0, 0, 0);
                        ship.speed = 0;
                        updateSpaceHUD();
                    }
                    continue;
                }

                if (proj.life <= 0) {
                    window.spaceFlightGroup.remove(proj.mesh);
                    window.pirateProjectiles.splice(i, 1);
                }
            }

            window.spaceShards.forEach(shard => {
                if (shard.collected) return;

                const dist = playerPos.distanceTo(shard.position);
                if (dist < 5.5) {
                    shard.collected = true;
                    window.spaceFlightGroup.remove(shard.mesh);

                    window.harvestedShardsCount++;
                    audio.playBuild();
                    
                    showFlightToast("BIOLUM SHARD HARVESTED! +25¢ Value Added", "cyan");
                    updateSpaceHUD();

                    setTimeout(() => {
                        shard.collected = false;
                        const rx = (Math.random() - 0.5) * 500;
                        const rz = (Math.random() - 0.5) * 500;
                        shard.mesh.position.set(rx, 0, rz);
                        window.spaceFlightGroup.add(shard.mesh);
                    }, 5000);
                }
            });

            window.spaceShards.forEach(s => {
                s.mesh.rotation.y += dt * 1.5;
                s.mesh.rotation.x += dt * 0.5;
            });

            // ── Animate Space Environment ───────────────────────────
            const time = performance.now() * 0.001;

            // Update nebula shader time
            if (window.nebulaUniforms) {
                window.nebulaUniforms.forEach(u => { u.uTime.value = time; });
            }

            // Update dust particle shader time
            if (window.spaceDustUniforms) {
                window.spaceDustUniforms.uTime.value = time;
            }

            // Center dust around player for infinite feel
            if (window.spaceDustParticles) {
                window.spaceDustParticles.position.x = ship.mesh.position.x;
                window.spaceDustParticles.position.z = ship.mesh.position.z;
            }

            // Rotate asteroids slowly
            if (window.spaceAsteroidField && window.asteroidData) {
                const astDummy = new THREE.Object3D();
                for (let i = 0; i < window.asteroidData.length; i++) {
                    const ad = window.asteroidData[i];
                    astDummy.position.copy(ad.basePos);
                    astDummy.scale.copy(ad.scale);
                    ad.rot.x += ad.rotSpeed.x * dt;
                    ad.rot.y += ad.rotSpeed.y * dt;
                    ad.rot.z += ad.rotSpeed.z * dt;
                    astDummy.rotation.set(ad.rot.x, ad.rot.y, ad.rot.z);
                    astDummy.updateMatrix();
                    window.spaceAsteroidField.setMatrixAt(i, astDummy.matrix);
                }
                window.spaceAsteroidField.instanceMatrix.needsUpdate = true;
            }

            // Skybox follows player for infinite space feel
            const skybox = window.spaceFlightGroup.children.find(c => c.name === 'spaceSkybox');
            if (skybox) {
                skybox.position.x = ship.mesh.position.x;
                skybox.position.z = ship.mesh.position.z;
            }

            // Engine trail particles (spawn glowing dots behind ship)
            if (ship.speed > 2) {
                const trailPos = ship.mesh.position.clone();
                const backOffset = new THREE.Vector3(0, 0, -1.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), ship.yaw);
                trailPos.add(backOffset);

                const trailGeo = new THREE.SphereGeometry(0.12, 4, 4);
                const trailMat = new THREE.MeshBasicMaterial({
                    color: 0x06b6d4,
                    transparent: true,
                    opacity: 0.8
                });
                const trail = new THREE.Mesh(trailGeo, trailMat);
                trail.position.copy(trailPos);
                trail.position.x += (Math.random() - 0.5) * 0.3;
                trail.position.y += (Math.random() - 0.5) * 0.2;
                window.spaceFlightGroup.add(trail);
                window.engineTrailParticles.push({ mesh: trail, life: 0.8 });
            }

            // Decay engine trail
            for (let i = window.engineTrailParticles.length - 1; i >= 0; i--) {
                const tp = window.engineTrailParticles[i];
                tp.life -= dt;
                tp.mesh.material.opacity = Math.max(0, tp.life);
                tp.mesh.scale.multiplyScalar(0.96);
                if (tp.life <= 0) {
                    window.spaceFlightGroup.remove(tp.mesh);
                    tp.mesh.geometry.dispose();
                    tp.mesh.material.dispose();
                    window.engineTrailParticles.splice(i, 1);
                }
            }

            // ── Camera Follow ───────────────────────────────────────
            const targetCamX = ship.mesh.position.x - Math.sin(ship.yaw) * 12.5;
            const targetCamZ = ship.mesh.position.z - Math.cos(ship.yaw) * 12.5;
            const targetCamY = ship.mesh.position.y + 4.2;

            camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 6.0 * dt);
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 6.0 * dt);
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 6.0 * dt);
            camera.lookAt(ship.mesh.position.x, ship.mesh.position.y + 0.6, ship.mesh.position.z);
        }

        // Bind clicks to buttons
        setTimeout(() => {
            const launchSpaceBtn = document.getElementById('launch-space-btn');
            if (launchSpaceBtn) {
                launchSpaceBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.enterSpaceFlightMode();
                });
            }
            const exitFlightBtn = document.getElementById('exit-flight-btn');
            if (exitFlightBtn) {
                exitFlightBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.exitSpaceFlightMode();
                });
            }
        }, 1000);

        // Easter Egg for Sav
        function triggerSavEasterEgg() {
            audio.playBuild();
            
            const modal = document.createElement('div');
            modal.id = 'sav-easter-egg-modal';
            modal.className = 'absolute inset-0 z-50 flex flex-col justify-center items-center bg-black/85 pointer-events-auto p-4 transition-all duration-500';
            modal.innerHTML = `
                <div class="blur-panel rounded-2xl p-8 max-w-sm w-full border border-pink-500/50 shadow-2xl text-center space-y-5 animate-bounce">
                    <div class="flex justify-center items-center gap-2 text-pink-400 text-3xl">
                        <i class="fa-solid fa-heart animate-pulse"></i>
                        <span class="orbitron font-black tracking-widest uppercase">SAV</span>
                        <i class="fa-solid fa-heart animate-pulse"></i>
                    </div>
                    
                    <p class="orbitron text-xl font-bold text-white leading-relaxed tracking-wide glow-text-pink">
                        you are the best always
                    </p>
                    
                    <div class="h-[1px] bg-pink-500/20 my-4"></div>
                    
                    <button id="close-sav-modal" class="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-500 text-white font-black orbitron text-xs rounded-xl hover:from-pink-500 hover:to-rose-400 transition-all active:scale-95 cursor-pointer shadow-lg">
                        CLOSE MESSAGE
                    </button>
                </div>
            `;
            
            const style = document.createElement('style');
            style.id = 'sav-egg-style';
            style.innerHTML = `
                .glow-text-pink {
                    text-shadow: 0 0 10px rgba(236, 72, 153, 0.9);
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(modal);

            document.getElementById('close-sav-modal').addEventListener('click', () => {
                modal.classList.add('opacity-0', 'scale-95');
                setTimeout(() => {
                    modal.remove();
                    style.remove();
                }, 500);
            });
        }

        let easterEggBuffer = "";
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key.length === 1 && /[a-z]/.test(key)) {
                easterEggBuffer = (easterEggBuffer + key).slice(-3);
                if (easterEggBuffer === "lol") {
                    const hasGatling = towers.some(t => t.type === 'spore');
                    if (hasGatling) {
                        triggerSavEasterEgg();
                    }
                }
            }
        });

        // Simulated loader visual timeout on start
        window.onload = function() {
            let progress = 0;
            const progressEl = document.getElementById('loader-progress');
            const interval = setInterval(() => {
                progress += 20;
                progressEl.style.width = `${progress}%`;
                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        document.getElementById('loader').classList.add('transition-all', 'opacity-0', 'pointer-events-none');
                        updateStatsUI();
                        // Run animation loops
                        animate();
                        // Initialize Animated Favicon
                        initAnimatedFavicon();
                    }, 400);
                }
            }, 100);
        };
