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
        this.disabledTimer = 0; // EMP stun status timer

        const worldPos = gridToWorld(x, z);
        const terrainY = window.getTerrainHeight ? window.getTerrainHeight(worldPos.x, worldPos.z) : 0;
        this.position = new THREE.Vector3(worldPos.x, terrainY, worldPos.z);

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

        // Predefine materials for military realism
        const metalDark = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.9, roughness: 0.15 });
        const metalSlate = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.8, roughness: 0.25 });
        const camoOlive = new THREE.MeshStandardMaterial({ color: this.specs.color, metalness: 0.5, roughness: 0.45 });
        const metalChrome = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.05 });
        const lensGlass = new THREE.MeshBasicMaterial({ color: this.specs.color, transparent: true, opacity: 0.9 });

        if (this.type === 'laser') {
            // ==========================================
            // RAILGUN / KINETIC TURRET MESH (Realism)
            // ==========================================
            // 1. Solid Hexagonal Concrete/Steel Base
            const baseGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.4, 6);
            const base = new THREE.Mesh(baseGeo, metalSlate);
            base.position.y = 0.2;
            base.castShadow = true;
            group.add(base);
            if (window.Translator) window.Translator.optimizeMesh(base);

            // 2. Hydraulic Lift Column Stem
            const stemGeo = new THREE.CylinderGeometry(0.14, 0.18, 1.1, 8);
            const stem = new THREE.Mesh(stemGeo, metalChrome);
            stem.position.y = 0.85;
            stem.castShadow = true;
            group.add(stem);
            if (window.Translator) window.Translator.optimizeMesh(stem);

            // 3. Tactical Targeting Laser Sight / Camera Core
            const coreGeo = new THREE.SphereGeometry(0.12, 8, 8);
            this.pulseCore = new THREE.Mesh(coreGeo, lensGlass);
            this.pulseCore.position.set(0, 0.85, 0.2); // Positioned like a camera lens
            group.add(this.pulseCore);

            this.chestLight = new THREE.PointLight(this.specs.color, 1.2, 4);
            this.chestLight.position.set(0, 0.85, 0.25);
            group.add(this.chestLight);

            // 4. Rotating Armored Turret Head
            this.turretHead = new THREE.Group();
            this.turretHead.position.y = 1.4;

            // Main armored housing box with sloped geometry
            const headBoxGeo = new THREE.BoxGeometry(0.65, 0.45, 0.85);
            const head = new THREE.Mesh(headBoxGeo, camoOlive);
            head.castShadow = true;
            this.turretHead.add(head);

            // 5. Heavy Dual-Railgun Barrels
            this.laserBarrel = new THREE.Group();
            this.laserBarrel.position.set(0, 0, 0.4);

            const railGeo = new THREE.BoxGeometry(0.04, 0.08, 1.2);
            const railL = new THREE.Mesh(railGeo, metalDark);
            railL.position.x = -0.07;
            const railR = new THREE.Mesh(railGeo, metalDark);
            railR.position.x = 0.07;
            this.laserBarrel.add(railL);
            this.laserBarrel.add(railR);

            // 6. Glowing Accelerator Coils wrapped around rails
            this.shards = []; // Backwards compatibility variable for specs coloring updates
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
            this.focusRing = this.shards[0]; // backward compatibility
            this.laserBarrel.add(this.orbitalGroup);
            this.turretHead.add(this.laserBarrel);

            // 7. Rotating Generator Turbine on the rear
            this.generatorFan = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 8), metalDark);
            this.generatorFan.position.set(0, 0, -0.48);
            this.generatorFan.rotation.x = Math.PI / 2;
            this.turretHead.add(this.generatorFan);

            // 8. Muzzle Flash Light & Spark Visual
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
            // ==========================================
            // TACTICAL MISSILE BATTERY MESH (Realism)
            // ==========================================
            // 1. Reinforced Square Steel Base
            const baseGeo = new THREE.BoxGeometry(1.0, 0.3, 1.0);
            const base = new THREE.Mesh(baseGeo, metalSlate);
            base.position.y = 0.15;
            base.castShadow = true;
            group.add(base);
            if (window.Translator) window.Translator.optimizeMesh(base);

            // 2. Heavy Dual Support Brackets
            const bracketGeo = new THREE.BoxGeometry(0.12, 1.1, 0.35);
            const bracketL = new THREE.Mesh(bracketGeo, metalSlate);
            bracketL.position.set(-0.35, 0.8, 0);
            bracketL.castShadow = true;
            group.add(bracketL);
            const bracketR = new THREE.Mesh(bracketGeo, metalSlate);
            bracketR.position.set(0.35, 0.8, 0);
            bracketR.castShadow = true;
            group.add(bracketR);
            if (window.Translator) {
                window.Translator.optimizeMesh(bracketL);
                window.Translator.optimizeMesh(bracketR);
            }

            // 3. Central Radar Targeting sensor Lens
            const coreGeo = new THREE.SphereGeometry(0.14, 8, 8);
            this.pulseCore = new THREE.Mesh(coreGeo, lensGlass);
            this.pulseCore.position.set(0, 0.8, 0);
            group.add(this.pulseCore);

            this.chestLight = new THREE.PointLight(this.specs.color, 1.0, 4);
            this.chestLight.position.set(0, 0.8, 0.1);
            group.add(this.chestLight);

            // 4. Rotating Missile Launcher Pod Head
            this.turretHead = new THREE.Group();
            this.turretHead.position.y = 1.35;

            // Main Launch Pod Housing
            const podGeo = new THREE.BoxGeometry(0.6, 0.45, 0.85);
            const pod = new THREE.Mesh(podGeo, camoOlive);
            pod.castShadow = true;
            this.turretHead.add(pod);

            // 5. 4 Front Missile Launch Tubes (Cylinders recessed inside)
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

            // 6. Spinning Radar Scanner Dish on top
            this.radarDish = new THREE.Group();
            this.radarDish.position.set(0, 0.35, -0.1);
            const dishGeo = new THREE.ConeGeometry(0.18, 0.08, 8);
            dishGeo.rotateX(Math.PI / 4); // tilt it slightly upwards
            const dish = new THREE.Mesh(dishGeo, metalDark);
            this.radarDish.add(dish);
            const stemMini = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15), metalSlate);
            stemMini.position.y = -0.08;
            this.radarDish.add(stemMini);
            this.turretHead.add(this.radarDish);

            // 7. Muzzle Flash Light and Spark Visuals
            this.muzzleFlash = new THREE.PointLight(this.specs.bulletColor, 0, 3);
            this.muzzleFlash.position.set(0, 0, 0.5);
            this.turretHead.add(this.muzzleFlash);

            const flashGeo = new THREE.SphereGeometry(0.18, 6, 6);
            const flashMat = new THREE.MeshBasicMaterial({ color: this.specs.bulletColor, transparent: true, opacity: 0 });
            this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
            this.muzzleFlashMesh.position.set(0, 0, 0.5);
            this.turretHead.add(this.muzzleFlashMesh);

            group.add(this.turretHead);
        } else if (this.type === 'tesla') {
            // ==========================================
            // TESLA DISRUPTOR / SHOCK PYLON MESH
            // ==========================================
            // 1. Heavy circular steel base plate
            const baseGeo = new THREE.CylinderGeometry(0.65, 0.75, 0.35, 12);
            const base = new THREE.Mesh(baseGeo, metalSlate);
            base.position.y = 0.17;
            base.castShadow = true;
            group.add(base);
            if (window.Translator) window.Translator.optimizeMesh(base);

            // 2. High voltage tower pylon stem (tapered cylinder)
            const stemGeo = new THREE.CylinderGeometry(0.1, 0.2, 1.2, 12);
            const stem = new THREE.Mesh(stemGeo, metalDark);
            stem.position.y = 0.85;
            stem.castShadow = true;
            group.add(stem);

            // 3. Glowing core lens
            const coreGeo = new THREE.SphereGeometry(0.12, 12, 12);
            this.pulseCore = new THREE.Mesh(coreGeo, lensGlass);
            this.pulseCore.position.set(0, 0.85, 0);
            group.add(this.pulseCore);

            this.chestLight = new THREE.PointLight(this.specs.color, 1.0, 4);
            this.chestLight.position.set(0, 0.85, 0);
            group.add(this.chestLight);

            // 4. Rotating discharge assembly on top
            this.turretHead = new THREE.Group();
            this.turretHead.position.y = 1.45;

            // Copper orb receiver
            const headBoxGeo = new THREE.SphereGeometry(0.24, 16, 16);
            const head = new THREE.Mesh(headBoxGeo, metalChrome);
            head.castShadow = true;
            this.turretHead.add(head);

            // 5. Surrounding ring emitter coils
            this.coilsGroup = new THREE.Group();
            const ringGeo = new THREE.TorusGeometry(0.32, 0.04, 8, 24);
            const ringMat = new THREE.MeshBasicMaterial({ color: this.specs.bulletColor });
            const ringCoil = new THREE.Mesh(ringGeo, ringMat);
            ringCoil.rotation.x = Math.PI / 2;
            this.coilsGroup.add(ringCoil);
            this.turretHead.add(this.coilsGroup);

            // Backward compatibility
            this.muzzleFlash = new THREE.PointLight(this.specs.bulletColor, 0, 3);
            this.muzzleFlash.position.set(0, 0, 0);
            this.turretHead.add(this.muzzleFlash);

            const flashGeo = new THREE.SphereGeometry(0.15, 6, 6);
            const flashMat = new THREE.MeshBasicMaterial({ color: this.specs.bulletColor, transparent: true, opacity: 0 });
            this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
            this.muzzleFlashMesh.position.set(0, 0, 0);
            this.turretHead.add(this.muzzleFlashMesh);

            group.add(this.turretHead);
        } else if (this.type === 'artillery') {
            // ==========================================
            // PLASMA ARTILLERY / HEAVY MORTAR MESH
            // ==========================================
            // 1. Double reinforced circular foundation
            const baseGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.4, 16);
            const base = new THREE.Mesh(baseGeo, metalSlate);
            base.position.y = 0.2;
            base.castShadow = true;
            group.add(base);
            if (window.Translator) window.Translator.optimizeMesh(base);

            // 2. Thick rotational stem support
            const stemGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.8, 12);
            const stem = new THREE.Mesh(stemGeo, metalDark);
            stem.position.y = 0.7;
            stem.castShadow = true;
            group.add(stem);

            // 3. Central targeting lens
            const coreGeo = new THREE.SphereGeometry(0.14, 12, 12);
            this.pulseCore = new THREE.Mesh(coreGeo, lensGlass);
            this.pulseCore.position.set(0, 0.7, 0);
            group.add(this.pulseCore);

            this.chestLight = new THREE.PointLight(this.specs.color, 1.0, 4);
            this.chestLight.position.set(0, 0.7, 0.1);
            group.add(this.chestLight);

            // 4. Rotating large gun turret head
            this.turretHead = new THREE.Group();
            this.turretHead.position.y = 1.15;

            const receiverGeo = new THREE.BoxGeometry(0.8, 0.55, 0.9);
            const receiver = new THREE.Mesh(receiverGeo, camoOlive);
            receiver.castShadow = true;
            this.turretHead.add(receiver);

            // 5. Heavy long mortar shell barrel (recoils)
            this.artilleryBarrel = new THREE.Group();
            this.artilleryBarrel.position.set(0, 0.1, 0.4);
            
            const barrelGeo = new THREE.CylinderGeometry(0.1, 0.12, 1.0, 12);
            barrelGeo.rotateX(Math.PI / 2);
            const barrel = new THREE.Mesh(barrelGeo, metalDark);
            barrel.castShadow = true;
            this.artilleryBarrel.add(barrel);

            // Barrel tip nozzle ring
            const nozzleGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.15, 12);
            nozzleGeo.rotateX(Math.PI / 2);
            const nozzle = new THREE.Mesh(nozzleGeo, metalChrome);
            nozzle.position.z = 0.45;
            this.artilleryBarrel.add(nozzle);

            this.turretHead.add(this.artilleryBarrel);

            // 6. Muzzle Flash Light and Spark Visuals
            this.muzzleFlash = new THREE.PointLight(this.specs.bulletColor, 0, 4);
            this.muzzleFlash.position.set(0, 0.1, 1.1);
            this.turretHead.add(this.muzzleFlash);

            const flashGeo = new THREE.SphereGeometry(0.25, 8, 8);
            const flashMat = new THREE.MeshBasicMaterial({ color: this.specs.bulletColor, transparent: true, opacity: 0 });
            this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
            this.muzzleFlashMesh.position.set(0, 0.1, 1.1);
            this.turretHead.add(this.muzzleFlashMesh);

            group.add(this.turretHead);
        } else if (this.type === 'thermal') {
            // ==========================================
            // THERMAL BEAM MELTER MESH
            // ==========================================
            // 1. Tapered circular gear base
            const baseGeo = new THREE.CylinderGeometry(0.6, 0.72, 0.35, 12);
            const base = new THREE.Mesh(baseGeo, metalSlate);
            base.position.y = 0.17;
            base.castShadow = true;
            group.add(base);
            if (window.Translator) window.Translator.optimizeMesh(base);

            // 2. High tech stabilizer pillar stem
            const stemGeo = new THREE.CylinderGeometry(0.16, 0.2, 1.1, 12);
            const stem = new THREE.Mesh(stemGeo, metalDark);
            stem.position.y = 0.8;
            stem.castShadow = true;
            group.add(stem);

            // 3. Central glowing capacitor core
            const coreGeo = new THREE.SphereGeometry(0.12, 12, 12);
            this.pulseCore = new THREE.Mesh(coreGeo, lensGlass);
            this.pulseCore.position.set(0, 0.8, 0);
            group.add(this.pulseCore);

            this.chestLight = new THREE.PointLight(this.specs.color, 1.0, 4);
            this.chestLight.position.set(0, 0.8, 0);
            group.add(this.chestLight);

            // 4. Rotating swiveling projector head mount
            this.turretHead = new THREE.Group();
            this.turretHead.position.y = 1.35;

            const receiverGeo = new THREE.BoxGeometry(0.48, 0.48, 0.5);
            const receiver = new THREE.Mesh(receiverGeo, camoOlive);
            receiver.castShadow = true;
            this.turretHead.add(receiver);

            // 5. Thermal projector emitter nozzle
            this.thermalEmitter = new THREE.Group();
            this.thermalEmitter.position.set(0, 0, 0.25);

            const nozzleGeo = new THREE.CylinderGeometry(0.06, 0.1, 0.5, 12);
            nozzleGeo.rotateX(Math.PI / 2);
            const nozzle = new THREE.Mesh(nozzleGeo, metalChrome);
            nozzle.castShadow = true;
            this.thermalEmitter.add(nozzle);

            // Glowing lens crystal inside nozzle
            const lensMiniGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const lensMiniMat = new THREE.MeshBasicMaterial({ color: this.specs.bulletColor });
            const lensMini = new THREE.Mesh(lensMiniGeo, lensMiniMat);
            lensMini.position.z = 0.25;
            this.thermalEmitter.add(lensMini);

            this.turretHead.add(this.thermalEmitter);

            // 6. Muzzle Flash Light and Spark Visuals
            this.muzzleFlash = new THREE.PointLight(this.specs.bulletColor, 0, 3);
            this.muzzleFlash.position.set(0, 0, 0.5);
            this.turretHead.add(this.muzzleFlash);

            const flashGeo = new THREE.SphereGeometry(0.12, 6, 6);
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
            if (window.Translator) window.Translator.optimizeMesh(base);

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
            if (window.Translator) window.Translator.optimizeMesh(base);

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
            if (window.Translator) {
                window.Translator.optimizeMesh(frameL);
                window.Translator.optimizeMesh(frameR);
            }

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
            if (window.Translator) window.Translator.optimizeMesh(well);

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
            if (window.Translator) window.Translator.optimizeMesh(base);

            // Tall Pole
            const poleGeo = new THREE.CylinderGeometry(0.06, 0.1, 1.5, 6);
            const pole = new THREE.Mesh(poleGeo, metalDark);
            pole.position.y = 0.9;
            pole.castShadow = true;
            group.add(pole);
            if (window.Translator) window.Translator.optimizeMesh(pole);

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

        } else if (this.type === 'stackfarm') {
            const bioGreen = new THREE.MeshStandardMaterial({
                color: 0x10b981,
                emissive: 0x059669,
                emissiveIntensity: 1.2,
                roughness: 0.1
            });
            const soilBrown = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
            const glassMat = new THREE.MeshStandardMaterial({
                color: 0x34d399,
                roughness: 0.05,
                metalness: 0.9,
                transparent: true,
                opacity: 0.2
            });

            // Base foundation
            const baseGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.25, 8);
            const base = new THREE.Mesh(baseGeo, metalSlate);
            base.position.y = 0.125;
            base.castShadow = true;
            group.add(base);

            // Central bio-conduit column
            const coreGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8);
            const core = new THREE.Mesh(coreGeo, bioGreen);
            core.position.y = 0.8;
            group.add(core);

            // Glass enclosure
            const glassGeo = new THREE.CylinderGeometry(0.62, 0.62, 1.3, 10, 1, true);
            const glass = new THREE.Mesh(glassGeo, glassMat);
            glass.position.y = 0.85;
            group.add(glass);

            // 3 cultivation trays stacked
            const trayGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.08, 10);
            const soilGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.04, 10);
            const cropGeo = new THREE.SphereGeometry(0.05, 4, 4);

            const heights = [0.4, 0.8, 1.2];
            heights.forEach(h => {
                const tray = new THREE.Mesh(trayGeo, metalDark);
                tray.position.y = h;
                group.add(tray);

                const soil = new THREE.Mesh(soilGeo, soilBrown);
                soil.position.y = h + 0.04;
                group.add(soil);

                for (let k = 0; k < 5; k++) {
                    const angle = (k / 5) * Math.PI * 2;
                    const radius = 0.32;
                    const plant = new THREE.Mesh(cropGeo, new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 }));
                    plant.position.set(Math.cos(angle) * radius, h + 0.08, Math.sin(angle) * radius);
                    plant.scale.set(1, 1 + Math.random() * 0.8, 1);
                    group.add(plant);
                }
            });

            this.growLight = new THREE.PointLight(0x10b981, 1.0, 3.0);
            this.growLight.position.set(0, 0.8, 0);
            group.add(this.growLight);

        } else if (this.type === 'drone_factory') {
            // ==========================================
            // DRONE FACTORY: SLEEK SCI-FI LAUNCH PAD
            // ==========================================
            const factoryMat  = new THREE.MeshStandardMaterial({ color: 0x312e81, metalness: 0.95, roughness: 0.1 });
            const accentMat   = new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.8, roughness: 0.2, emissive: 0x4f46e5, emissiveIntensity: 0.6 });
            const glassPaneMat = new THREE.MeshStandardMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.18, roughness: 0.05 });

            // Octagonal base platform
            const baseGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.22, 8);
            const base = new THREE.Mesh(baseGeo, metalSlate);
            base.position.y = 0.11;
            base.castShadow = true;
            group.add(base);

            // Raised central hub
            const hubGeo = new THREE.CylinderGeometry(0.45, 0.5, 0.35, 8);
            const hub = new THREE.Mesh(hubGeo, factoryMat);
            hub.position.y = 0.39;
            group.add(hub);

            // Glowing antenna spire
            const spireGeo = new THREE.CylinderGeometry(0.025, 0.05, 1.1, 6);
            const spire = new THREE.Mesh(spireGeo, metalDark);
            spire.position.y = 1.0;
            group.add(spire);

            // Pulsing tip beacon
            this.beaconTip = new THREE.Mesh(
                new THREE.SphereGeometry(0.07, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0xa78bfa })
            );
            this.beaconTip.position.y = 1.6;
            group.add(this.beaconTip);

            // 4 launch arm rails
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const armGeo = new THREE.BoxGeometry(0.06, 0.06, 0.5);
                const arm = new THREE.Mesh(armGeo, accentMat);
                arm.position.set(Math.cos(angle) * 0.62, 0.56, Math.sin(angle) * 0.62);
                arm.rotation.y = -angle;
                group.add(arm);
            }

            // Glass dome shell
            const domeGeo = new THREE.SphereGeometry(0.48, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
            const dome = new THREE.Mesh(domeGeo, glassPaneMat);
            dome.position.y = 0.56;
            group.add(dome);

            // Accent ring
            const ringGeo = new THREE.TorusGeometry(0.82, 0.035, 6, 24);
            const ring = new THREE.Mesh(ringGeo, accentMat);
            ring.position.y = 0.28;
            ring.rotation.x = Math.PI / 2;
            group.add(ring);

            // Factory glow light
            this.factoryLight = new THREE.PointLight(0x6366f1, 1.6, 4.5);
            this.factoryLight.position.set(0, 0.8, 0);
            group.add(this.factoryLight);

            // Spawn drones
            this.drones = [];
            const droneCount = this.specs.droneCount || 2;
            for (let i = 0; i < droneCount; i++) {
                const drone = new CombatDrone(this, i, droneCount);
                this.drones.push(drone);
            }

        } else {
            // ==========================================
            // GATLING GUN / HEAVY MACHINE GUN (Realism)
            // ==========================================
            // 1. Dual-Ring Gear Pedestal Base
            const baseGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.35, 8);
            const base = new THREE.Mesh(baseGeo, metalSlate);
            base.position.y = 0.17;
            base.castShadow = true;
            group.add(base);
            if (window.Translator) window.Translator.optimizeMesh(base);

            // 2. Heavy Swivel Column Stem
            const stemGeo = new THREE.CylinderGeometry(0.15, 0.22, 1.1, 8);
            const stem = new THREE.Mesh(stemGeo, metalDark);
            stem.position.y = 0.8;
            stem.castShadow = true;
            group.add(stem);

            // 3. Side Mounted Gun Shield (Deflection Plate)
            const shieldGeo = new THREE.BoxGeometry(0.65, 0.65, 0.06);
            const shield = new THREE.Mesh(shieldGeo, camoOlive);
            shield.position.set(0, 1.0, 0.25);
            shield.castShadow = true;
            group.add(shield);
            if (window.Translator) window.Translator.optimizeMesh(shield);

            // 4. Tactical targeting lens
            const coreGeo = new THREE.SphereGeometry(0.1, 8, 8);
            this.pulseCore = new THREE.Mesh(coreGeo, lensGlass);
            this.pulseCore.position.set(0.2, 1.0, 0.26); // offset on shield plate
            group.add(this.pulseCore);

            this.chestLight = new THREE.PointLight(this.specs.color, 1.0, 4);
            this.chestLight.position.set(0.2, 1.0, 0.3);
            group.add(this.chestLight);

            // 5. Rotating Armored Gun Head
            this.turretHead = new THREE.Group();
            this.turretHead.position.y = 1.35;

            const receiverGeo = new THREE.BoxGeometry(0.45, 0.4, 0.7);
            const receiver = new THREE.Mesh(receiverGeo, metalDark);
            receiver.castShadow = true;
            this.turretHead.add(receiver);

            // 6. Spinning 6-Barrel Gatling Cluster assembly
            this.barrelCluster = new THREE.Group();
            this.barrelCluster.position.set(0, 0, 0.35);

            // 6 individual barrels in a circle
            const barrelLen = 0.75;
            const singleBarrelGeo = new THREE.CylinderGeometry(0.015, 0.015, barrelLen, 4);
            singleBarrelGeo.rotateX(Math.PI / 2);
            
            for (let i = 0; i < 6; i++) {
                const barrelMesh = new THREE.Mesh(singleBarrelGeo, metalChrome);
                const angle = (i / 6) * Math.PI * 2;
                barrelMesh.position.set(Math.cos(angle) * 0.07, Math.sin(angle) * 0.07, barrelLen / 2);
                this.barrelCluster.add(barrelMesh);
            }

            // Aligning discs
            const discGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.03, 8);
            discGeo.rotateX(Math.PI / 2);
            const disc1 = new THREE.Mesh(discGeo, metalDark);
            disc1.position.z = 0.05;
            this.barrelCluster.add(disc1);

            const disc2 = new THREE.Mesh(discGeo, metalDark);
            disc2.position.z = barrelLen - 0.05;
            this.barrelCluster.add(disc2);

            this.turretHead.add(this.barrelCluster);

            // 7. Ammunition Feed Box (Side)
            const ammoBoxGeo = new THREE.BoxGeometry(0.24, 0.32, 0.28);
            const ammoBox = new THREE.Mesh(ammoBoxGeo, camoOlive);
            ammoBox.position.set(-0.3, -0.05, -0.05);
            this.turretHead.add(ammoBox);

            // 8. Muzzle Flash Light and Spark Visuals
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

        // Color updates (upgrade armor to dark steel / advanced camo)
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

        // Visual feedback explosion (tactical green/orange)
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
        if (this.type === 'drone_factory') {
            // Pulse beacon and glow
            if (this.beaconTip) {
                const p = 0.6 + 0.4 * Math.sin(Date.now() * 0.007);
                this.beaconTip.material.color.setHSL(0.73, 1.0, p * 0.7);
            }
            if (this.factoryLight) {
                this.factoryLight.intensity = 1.2 + 0.6 * Math.sin(Date.now() * 0.005);
            }
            // Update each drone
            if (this.drones) {
                this.drones.forEach(d => d.update(dt));
            }
            return;
        }
        if (this.type === 'stackfarm') {
            if (!this.healTimer) {
                this.healTimer = 30.0;
            }
            this.healTimer -= dt;

            if (this.growLight) {
                this.growLight.intensity = 0.8 + 0.4 * Math.sin(Date.now() * 0.005);
            }

            if (this.healTimer <= 0) {
                this.healTimer = 30.0;
                if (window.gameState) {
                    let maxHp = 20;
                    if (window.gameState.baseTier === 2) maxHp = 25;
                    else if (window.gameState.baseTier === 3) maxHp = 35;

                    const oldHealth = window.gameState.health;
                    window.gameState.health = Math.min(maxHp, window.gameState.health + 10);
                    const healedAmt = window.gameState.health - oldHealth;

                    if (healedAmt > 0) {
                        if (window.updateSurvivalHUD) window.updateSurvivalHUD();
                        const healthValEl = document.getElementById('health-value');
                        if (healthValEl) healthValEl.innerText = window.gameState.health;

                        if (window.showToast) {
                            window.showToast(`+${healedAmt} HQ Health Replenished by Stackfarm!`, "green");
                        }
                        this.spawnFloatingHealText(healedAmt);
                    }
                }
            }
            return;
        }
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

        // Animate mechanical parts based on turret type
        if (this.type === 'spore' && this.barrelCluster) {
            if (this.cooldown > 0) {
                this.barrelCluster.rotation.z += dt * 28; // high speed spin when firing
            } else {
                this.barrelCluster.rotation.z += dt * 1.5; // low idle rotation
            }
        } else if (this.type === 'laser') {
            if (this.generatorFan) {
                this.generatorFan.rotation.y += dt * 7; // turbine constantly spins
            }
            if (this.orbitalGroup) {
                this.orbitalGroup.rotation.z += dt * 2.5; // charge coils rotate slowly
            }
        } else if (this.type === 'frost') {
            if (this.radarDish) {
                this.radarDish.rotation.y += dt * 2.2; // radar scans sky
            }
        } else if (this.type === 'tesla') {
            if (this.coilsGroup) {
                this.coilsGroup.rotation.y += dt * 3.5;
            }
        } else if (this.type === 'thermal') {
            if (this.thermalEmitter) {
                this.thermalEmitter.rotation.z += dt * 1.2;
            }
        }

        // Animate targeting sensor pulse
        const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.005);
        this.pulseCore.scale.set(pulse, pulse, pulse);
        this.chestLight.intensity = pulse * 1.5;

        // Muzzle Flash Decay
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

        // Interpolate recoil scaling back to normal
        this.turretHead.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 10);

        // Scan and engage closest enemy in range
        this.target = this.findTarget();

        if (this.target) {
            // Turn turret head to target
            const lookTarget = new THREE.Vector3(this.target.position.x, this.turretHead.position.y + this.position.y, this.target.position.z);
            this.turretHead.lookAt(lookTarget);

            // Shoot Projectile on cooled down
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

            if (enemy.isStealth) {
                // Cloaked unless within close range of HQ (4.5) OR close range of a radar scanning Gatling or Missile tower (range 3.5)
                const distToHQ = enemy.position.distanceTo(new THREE.Vector3(0, 0.25, 0));
                let detected = distToHQ < 4.5;
                
                if (!detected) {
                    // Check if close to a tower that can spot it (Gatling 'spore' or Missile 'frost')
                    for (let t of towers) {
                        if (t.type === 'spore' || t.type === 'frost') {
                            if (t.position.distanceTo(enemy.position) < 3.5) {
                                detected = true;
                                break;
                            }
                        }
                    }
                }
                if (!detected) continue; // Bypass targeting!
            }

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
            // ==========================================
            // RAILGUN: ELECTRIC KINETIC ENERGY DISCHARGE
            // ==========================================
            const startPos = new THREE.Vector3(0, 0, 1.0).applyMatrix4(this.turretHead.matrixWorld);
            const endPos = this.target.position.clone();
            const distance = startPos.distanceTo(endPos);

            // Draw a high velocity lightning electric tracer cylinder
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

            // Instant discharge flash decay
            setTimeout(() => {
                scene.remove(laserMesh);
                laserGeo.dispose();
                laserMat.dispose();
            }, 50);

            // Inflict instant damage
            this.target.takeDamage(this.specs.damage);
            particles.spawnHitBurst(this.target.position, this.specs.bulletColor);

            // Heavy gun barrel recoil punchback scale animation
            this.turretHead.scale.set(1.0, 1.0, 0.72);

            // Muzzle flash
            this.muzzleFlash.intensity = 3.5;
            this.muzzleFlashMesh.material.opacity = 0.95;
            this.muzzleFlashTimer = 0.08;

            audio.playShoot();
        } else if (this.type === 'frost') {
            // ==========================================
            // MISSILE BATTERY: LAUNCH GUIDED HE ROCKET
            // ==========================================
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

            // Rocket firing back-blast recoil scale
            this.turretHead.scale.set(1.15, 1.15, 0.85);

            // Muzzle flash
            this.muzzleFlash.intensity = 2.8;
            this.muzzleFlashMesh.material.opacity = 0.9;
            this.muzzleFlashTimer = 0.12;

            audio.playShoot();
        } else if (this.type === 'tesla') {
            // ==========================================
            // TESLA PYLON: CHAIN ELECTRIC DISCHARGE
            // ==========================================
            const startPos = new THREE.Vector3(0, 0, 0.25).applyMatrix4(this.turretHead.matrixWorld);
            
            // Find chain targets within range
            const chainTargets = [];
            for (let enemy of enemies) {
                if (enemy.isDead) continue;
                let dist = this.position.distanceTo(enemy.position);
                if (dist < this.specs.range) {
                    chainTargets.push({ enemy: enemy, dist: dist });
                }
            }
            chainTargets.sort((a, b) => a.dist - b.dist);
            const targetsToHit = chainTargets.slice(0, 3);

            let currentStart = startPos.clone();
            targetsToHit.forEach((t, index) => {
                const endPos = t.enemy.position.clone().add(new THREE.Vector3(0, 0.2, 0));
                const dist = currentStart.distanceTo(endPos);

                const segmentGeo = new THREE.CylinderGeometry(0.03, 0.03, dist, 4);
                const segmentMat = new THREE.MeshBasicMaterial({
                    color: this.specs.bulletColor,
                    transparent: true,
                    opacity: 0.9,
                    blending: THREE.AdditiveBlending
                });
                const segmentMesh = new THREE.Mesh(segmentGeo, segmentMat);
                segmentMesh.position.copy(currentStart).add(endPos).multiplyScalar(0.5);
                segmentMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endPos.clone().sub(currentStart).normalize());
                scene.add(segmentMesh);

                setTimeout(() => {
                    scene.remove(segmentMesh);
                    segmentGeo.dispose();
                    segmentMat.dispose();
                }, 80);

                t.enemy.takeDamage(this.specs.damage);
                particles.spawnHitBurst(t.enemy.position, this.specs.bulletColor);

                // Chain continues from this target
                currentStart.copy(endPos);
            });

            this.turretHead.scale.set(0.85, 1.25, 0.85);

            this.muzzleFlash.intensity = 3.0;
            this.muzzleFlashMesh.material.opacity = 0.95;
            this.muzzleFlashTimer = 0.12;

            audio.playShoot();
        } else if (this.type === 'artillery') {
            // ==========================================
            // PLASMA ARTILLERY: LAUNCH PARABOLIC SHELL
            // ==========================================
            const startPos = new THREE.Vector3(0, 0.1, 0.5).applyMatrix4(this.turretHead.matrixWorld);

            projectiles.push(new BioSporeProjectile(
                startPos, 
                this.target, 
                this.specs.damage, 
                this.specs.projectileSpeed, 
                this.specs.bulletColor, 
                false, 
                1.0, 
                0, 
                true // isArtillery = true
            ));

            // Heavy recoil barrel kickback animation
            if (this.artilleryBarrel) {
                this.artilleryBarrel.scale.set(1.0, 1.0, 0.65);
                setTimeout(() => {
                    this.artilleryBarrel.scale.set(1.0, 1.0, 1.0);
                }, 150);
            }
            this.turretHead.scale.set(1.0, 1.0, 0.68);

            this.muzzleFlash.intensity = 4.0;
            this.muzzleFlashMesh.material.opacity = 0.98;
            this.muzzleFlashTimer = 0.18;

            audio.playShoot();
        } else if (this.type === 'thermal') {
            // ==========================================
            // THERMAL MELTER: CONTINUOUS TARGETING BEAM
            // ==========================================
            const dt = 0.08; // fire rate interval
            if (this.lastLockedTarget === this.target) {
                this.thermalLockTimer = (this.thermalLockTimer || 0) + dt;
            } else {
                this.lastLockedTarget = this.target;
                this.thermalLockTimer = 0;
            }

            const scaledDamage = this.specs.damage * (1.0 + Math.min(this.thermalLockTimer, 4.0) * 1.5);
            this.target.takeDamage(scaledDamage);

            const startPos = new THREE.Vector3(0, 0, 0.35).applyMatrix4(this.turretHead.matrixWorld);
            const endPos = this.target.position.clone().add(new THREE.Vector3(0, 0.2, 0));
            const distance = startPos.distanceTo(endPos);

            const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, distance, 6);
            const beamMat = new THREE.MeshBasicMaterial({
                color: this.specs.bulletColor,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            const beamMesh = new THREE.Mesh(beamGeo, beamMat);
            beamMesh.position.copy(startPos).add(endPos).multiplyScalar(0.5);
            beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endPos.clone().sub(startPos).normalize());
            scene.add(beamMesh);

            setTimeout(() => {
                scene.remove(beamMesh);
                beamGeo.dispose();
                beamMat.dispose();
            }, 60);

            this.turretHead.scale.set(0.97, 0.97, 1.03);
            particles.spawnHitBurst(this.target.position, this.specs.bulletColor);

            this.muzzleFlash.intensity = 2.2;
            this.muzzleFlashMesh.material.opacity = 0.85;
            this.muzzleFlashTimer = 0.06;

            audio.playShoot();
        } else {
            // ==========================================
            // GATLING TURRET: DUAL RAPID FIRE TRACERS
            // ==========================================
            const startPosLeft = new THREE.Vector3(-0.07, 0.07, 1.1).applyMatrix4(this.turretHead.matrixWorld);
            const startPosRight = new THREE.Vector3(0.07, -0.07, 1.1).applyMatrix4(this.turretHead.matrixWorld);

            projectiles.push(new BioSporeProjectile(startPosLeft, this.target, this.specs.damage, this.specs.projectileSpeed, this.specs.bulletColor, false));
            projectiles.push(new BioSporeProjectile(startPosRight, this.target, this.specs.damage, this.specs.projectileSpeed, this.specs.bulletColor, false));

            // Machine gun jittery recoil scaling
            this.turretHead.scale.set(1.08, 1.08, 0.82);

            // Activate muzzle flash
            this.muzzleFlash.intensity = 2.6;
            this.muzzleFlashMesh.material.opacity = 0.9;
            this.muzzleFlashTimer = 0.15;

            audio.playShoot();
        }
    }

    spawnFloatingHealText(amount) {
        const healText = document.createElement('div');
        healText.className = 'orbitron font-black text-emerald-400 absolute text-sm glow-text-green';
        healText.style.left = '50%';
        healText.style.top = '40%';
        healText.style.transform = 'translate(-50%, -50%)';
        healText.style.zIndex = '15';
        healText.style.pointerEvents = 'none';
        healText.innerText = `+${amount} HQ HEALTH`;
        document.body.appendChild(healText);

        let top = 40;
        let opacity = 1.0;
        const floatInterval = setInterval(() => {
            top -= 1.2;
            opacity -= 0.04;
            healText.style.top = `${top}%`;
            healText.style.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(floatInterval);
                healText.remove();
            }
        }, 30);
    }

    destroy() {
        if (this.scarab) {
            this.scarab.destroy();
            this.scarab = null;
        }
        if (this.drones) {
            this.drones.forEach(d => d.destroy());
            this.drones = [];
        }
        scene.remove(this.mesh);
        particles.spawnExplosion(this.position, 0xef4444, 15);
    }
}

// =============================================================
// COMBAT DRONE - autonomous AI unit spawned by the Drone Factory
// =============================================================
class CombatDrone {
    constructor(factory, index, total) {
        this.factory = factory;
        this.index   = index;
        this.total   = total;
        this.orbitAngle = (index / total) * Math.PI * 2;
        this.orbitRadius = 1.1;
        this.orbitHeight = 1.2 + index * 0.25;
        this.state  = 'orbit';  // 'orbit' | 'attack' | 'return'
        this.target = null;
        this.cooldown = 0;
        this.position = new THREE.Vector3();

        // ── Drone mesh ──────────────────────────────────────────
        this.mesh = window.createReconDrone();

        // Eye sensor
        this.eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({ color: 0xa78bfa, visible: false }));
        this.eyeMesh.position.set(0, 0, 0.15);
        this.mesh.add(this.eyeMesh);

        // Drone point light
        this.droneLight = new THREE.PointLight(0x7c3aed, 0.9, 2.5);
        this.mesh.add(this.droneLight);

        scene.add(this.mesh);

        // Initial position
        const fp = factory.position;
        this.position.set(fp.x + Math.cos(this.orbitAngle) * this.orbitRadius, fp.y + this.orbitHeight, fp.z + Math.sin(this.orbitAngle) * this.orbitRadius);
        this.mesh.position.copy(this.position);
    }

    update(dt) {
        // Drone rotor spin
        const blades = this.mesh.getObjectByName('blades');
        if (blades) {
            blades.rotation.y += dt * 30.0;
        }

        const fp = this.factory.position;
        const specs = this.factory.specs;
        const range   = specs.droneRange  || 9.0;
        const firerate = specs.droneFireRate || 1.4;
        const damage   = specs.droneDamage  || 12;
        const speed    = specs.droneSpeed   || 6.0;

        if (this.cooldown > 0) this.cooldown -= dt;

        // Pulse eye color
        const p = 0.5 + 0.5 * Math.sin(Date.now() * 0.01 + this.index);
        this.eyeMesh.material.color.setHSL(0.73, 1.0, 0.45 + p * 0.3);
        this.droneLight.intensity = 0.6 + p * 0.6;

        // ── State machine ──────────────────────────────────────
        if (this.state === 'orbit') {
            // Rotate around factory
            this.orbitAngle += dt * (0.8 + this.index * 0.2);
            const tx = fp.x + Math.cos(this.orbitAngle) * this.orbitRadius;
            const ty = fp.y + this.orbitHeight + Math.sin(Date.now() * 0.002 + this.index) * 0.12;
            const tz = fp.z + Math.sin(this.orbitAngle) * this.orbitRadius;
            this.position.lerp(new THREE.Vector3(tx, ty, tz), dt * 6);

            // Scan for target
            let closest = null;
            let minDist = range;
            for (const enemy of window.enemies || []) {
                if (enemy.isDead) continue;
                const d = fp.distanceTo(enemy.position);
                if (d < minDist) { minDist = d; closest = enemy; }
            }
            if (closest) { this.target = closest; this.state = 'attack'; }

        } else if (this.state === 'attack') {
            if (!this.target || this.target.isDead) {
                this.target = null;
                this.state = 'return';
                return;
            }
            // Check still in range
            if (fp.distanceTo(this.target.position) > range + 2) {
                this.state = 'return';
                return;
            }
            // Fly toward target
            const dir = this.target.position.clone().sub(this.position).normalize();
            const desired = this.target.position.clone().add(dir.clone().multiplyScalar(-1.8)).setY(this.target.position.y + 1.0);
            this.position.lerp(desired, dt * speed * 0.18);

            // Shoot
            if (this.cooldown <= 0) {
                this.cooldown = firerate;
                // Spawn plasma bolt projectile
                const boltStart = this.position.clone();
                projectiles.push(new BioSporeProjectile(boltStart, this.target, damage, 14, 0xa78bfa, false));
                particles.spawnHitBurst(this.position, 0xa78bfa);
                if (window.audio) audio.playShoot();
            }

        } else if (this.state === 'return') {
            // Fly back to orbit
            const tx = fp.x + Math.cos(this.orbitAngle) * this.orbitRadius;
            const ty = fp.y + this.orbitHeight;
            const tz = fp.z + Math.sin(this.orbitAngle) * this.orbitRadius;
            const home = new THREE.Vector3(tx, ty, tz);
            this.position.lerp(home, dt * speed * 0.15);
            if (this.position.distanceTo(home) < 0.4) this.state = 'orbit';
        }

        // Apply position + face direction of travel
        this.mesh.position.copy(this.position);
        const vel = this.position.clone().sub(this.mesh.position).normalize();
        if (vel.lengthSq() > 0.001) {
            this.mesh.lookAt(this.position.clone().add(vel));
        }
        // Tilt for motion feel
        this.mesh.rotation.z = Math.sin(Date.now() * 0.003 + this.index) * 0.15;
    }

    destroy() {
        if (this.mesh) {
            scene.remove(this.mesh);
            if (window.particles) particles.spawnExplosion(this.position, 0x7c3aed, 8);
        }
    }
}
