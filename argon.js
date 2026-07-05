// Argon Harvester & Bubbling Water System from A.E.G.I.S. Harvester

window.bubbleCells = [];

// Initializes bubble emitters on random water tiles (CELL_TYPES.LAKE)
window.initArgonBubbles = function(scene, grid, gridSize, cellSize) {
    // Clear any existing bubble meshes
    window.bubbleCells.forEach(cell => {
        scene.remove(cell.meshGroup);
        cell.particles.forEach(p => {
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        });
    });
    window.bubbleCells = [];

    // Find all lake coordinates
    const lakeCoords = [];
    for (let x = 0; x < gridSize; x++) {
        for (let z = 0; z < gridSize; z++) {
            if (grid[x][z] === 5) { // 5 is CELL_TYPES.LAKE
                lakeCoords.push({ x, z });
            }
        }
    }

    if (lakeCoords.length === 0) return;

    // Place bubbles on ALL lake coordinates
    const selectedCoords = lakeCoords;

    const bubbleMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4, // Cyan/Argon glow
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });

    selectedCoords.forEach(coord => {
        const meshGroup = new THREE.Group();
        const worldPos = gridToWorld(coord.x, coord.z);
        meshGroup.position.set(worldPos.x, 0.1, worldPos.z);
        scene.add(meshGroup);

        const particles = [];
        // Spawn 6 small bubble spheres for this vent
        for (let i = 0; i < 6; i++) {
            const size = 0.03 + Math.random() * 0.05;
            const geo = new THREE.SphereGeometry(size, 6, 6);
            const mesh = new THREE.Mesh(geo, bubbleMat);
            
            mesh.position.set(
                (Math.random() - 0.5) * (cellSize * 0.7),
                Math.random() * 0.5,
                (Math.random() - 0.5) * (cellSize * 0.7)
            );
            meshGroup.add(mesh);

            particles.push({
                mesh: mesh,
                speedY: 0.15 + Math.random() * 0.25,
                wobbleSpeed: 2.0 + Math.random() * 3.0,
                wobbleScale: 0.05 + Math.random() * 0.05,
                seed: Math.random() * 100
            });
        }

        window.bubbleCells.push({
            x: coord.x,
            z: coord.z,
            meshGroup: meshGroup,
            particles: particles
        });
    });

    console.log(`[Argon System] Placed ${window.bubbleCells.length} bubbling Argon vents on the water.`);
};

// Update loop for the bubbles rising in the water
window.updateArgonBubbles = function(dt) {
    const time = Date.now() * 0.001;
    window.bubbleCells.forEach(cell => {
        const hasHarvester = towers.some(t => t.type === 'argon_harvester' && t.gridX === cell.x && t.gridZ === cell.z);
        
        cell.particles.forEach(p => {
            p.mesh.position.y += p.speedY * dt;
            p.mesh.position.x += Math.sin(time * p.wobbleSpeed + p.seed) * p.wobbleScale * dt;
            p.mesh.position.z += Math.cos(time * p.wobbleSpeed + p.seed) * p.wobbleScale * dt;

            const maxHeight = hasHarvester ? 0.8 : 0.45;
            if (p.mesh.position.y > maxHeight) {
                p.mesh.position.y = 0.02;
                p.mesh.position.x = (Math.random() - 0.5) * 1.4;
                p.mesh.position.z = (Math.random() - 0.5) * 1.4;
            }
        });
    });
};

// The Argon Harvester Class (A.E.G.I.S. Harvester model)
window.ArgonHarvester = class ArgonHarvester extends window.SporeTower {
    constructor(x, z) {
        super(x, z, 'argon_harvester');
    }

    buildMesh() {
        const group = new THREE.Group();
        group.userData = { isTower: true, towerInstance: this };

        const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.8 });
        const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.95 });
        const hazardYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.2 });
        
        const coreCyan = 0x06b6d4;
        const emissiveGlowMat = new THREE.MeshStandardMaterial({
            color: coreCyan,
            emissive: coreCyan,
            emissiveIntensity: 2.5,
            roughness: 0.1
        });

        // 1. Main Deck Platform
        const platformWidth = 1.3;
        const mainDeckGeo = new THREE.BoxGeometry(platformWidth, 0.12, platformWidth);
        const mainDeck = new THREE.Mesh(mainDeckGeo, darkSteelMat);
        mainDeck.position.y = 0.45;
        mainDeck.castShadow = true;
        mainDeck.receiveShadow = true;
        group.add(mainDeck);

        // Hazard stripe rim around deck floor
        const rimGeo = new THREE.BoxGeometry(platformWidth + 0.02, 0.02, platformWidth + 0.02);
        const rim = new THREE.Mesh(rimGeo, hazardYellowMat);
        rim.position.y = 0.51;
        group.add(rim);

        // 2. Support Columns (Solid legs starting from y=0 up to y=0.45)
        const legOffset = platformWidth / 2 - 0.12;
        const legPositions = [
            [-legOffset, -legOffset],
            [legOffset, -legOffset],
            [-legOffset, legOffset],
            [legOffset, legOffset]
        ];
        legPositions.forEach(pos => {
            const legGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.45, 8);
            const leg = new THREE.Mesh(legGeo, steelMat);
            leg.position.set(pos[0], 0.225, pos[1]);
            leg.castShadow = true;
            leg.receiveShadow = true;
            group.add(leg);
        });

        // 3. Central Drilling Assembly (Jacket going sub-water)
        const colGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8);
        const centralCol = new THREE.Mesh(colGeo, darkSteelMat);
        centralCol.position.set(0, 0.25, 0);
        group.add(centralCol);

        // Rotating Core drill bit assembly (underneath the water)
        this.drillBitGroup = new THREE.Group();
        this.drillBitGroup.position.set(0, 0.05, 0);
        
        const bitTip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 8), darkSteelMat);
        bitTip.position.y = -0.11;
        this.drillBitGroup.add(bitTip);

        // Spiral extraction blades
        for (let i = 0; i < 3; i++) {
            const sRing = new THREE.Mesh(new THREE.TorusGeometry(0.09 - i * 0.02, 0.015, 6, 12), steelMat);
            sRing.rotation.x = Math.PI / 2;
            sRing.rotation.y = i * (Math.PI / 3);
            sRing.position.y = -0.02 - i * 0.05;
            this.drillBitGroup.add(sRing);
        }
        
        // Glowing core collector at bottom of drill bit
        const glowBit = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), emissiveGlowMat);
        glowBit.position.y = -0.22;
        this.drillBitGroup.add(glowBit);
        group.add(this.drillBitGroup);

        // 4. Central Drilling Derrick (Tower framing on top of deck)
        const derrickH = 0.85;
        const derrickGeo = new THREE.CylinderGeometry(0.08, 0.22, derrickH, 4);
        const derrick = new THREE.Mesh(derrickGeo, steelMat);
        derrick.position.set(0, 0.51 + derrickH / 2, 0);
        group.add(derrick);

        // 5. Central Laser Core Beam shooting upwards from derrick
        const beamGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8, 1, true);
        const beamMat = new THREE.MeshBasicMaterial({
            color: coreCyan,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        this.skyBeam = new THREE.Mesh(beamGeo, beamMat);
        this.skyBeam.position.set(0, 0.51 + derrickH + 1.25, 0);
        group.add(this.skyBeam);

        // 6. Processing & Storage Silos
        const siloHeight = 0.45;
        const siloGeo = new THREE.CylinderGeometry(0.14, 0.14, siloHeight, 12);
        
        // Left Silo
        const silo1 = new THREE.Mesh(siloGeo, steelMat);
        silo1.position.set(-platformWidth / 3.2, 0.51 + siloHeight / 2, -platformWidth / 3.2);
        silo1.castShadow = true;
        silo1.receiveShadow = true;
        group.add(silo1);

        // Silo indicator gauge strip
        const indicatorGeo = new THREE.BoxGeometry(0.02, siloHeight - 0.1, 0.04);
        const indicator = new THREE.Mesh(indicatorGeo, emissiveGlowMat);
        indicator.position.set(-platformWidth / 3.2 + 0.15, 0.51 + siloHeight / 2, -platformWidth / 3.2);
        group.add(indicator);

        // Right Silo
        const silo2 = silo1.clone();
        silo2.position.set(-platformWidth / 3.2, 0.51 + siloHeight / 2, platformWidth / 3.2);
        group.add(silo2);

        // 7. Cantilevered Helipad on the side
        const heliArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.15), darkSteelMat);
        heliArm.position.set(platformWidth / 2 + 0.125, 0.48, 0);
        group.add(heliArm);

        const helipad = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 16), steelMat);
        helipad.position.set(platformWidth / 2 + 0.3, 0.5, 0);
        group.add(helipad);

        // Yellow H marking on helipad using primitives
        const hLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.12), hazardYellowMat);
        hLeft.position.set(platformWidth / 2 + 0.3 - 0.04, 0.52, 0);
        group.add(hLeft);
        
        const hRight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.12), hazardYellowMat);
        hRight.position.set(platformWidth / 2 + 0.3 + 0.04, 0.52, 0);
        group.add(hRight);

        const hMid = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.02), hazardYellowMat);
        hMid.position.set(platformWidth / 2 + 0.3, 0.52, 0);
        group.add(hMid);

        // 8. Rotating Industrial Crane
        this.craneGroup = new THREE.Group();
        this.craneGroup.position.set(platformWidth / 3.2, 0.51, -platformWidth / 3.2);

        const craneBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 8), darkSteelMat);
        craneBase.position.y = 0.04;
        this.craneGroup.add(craneBase);

        const craneCabin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.1), steelMat);
        craneCabin.position.set(0, 0.12, 0);
        this.craneGroup.add(craneCabin);

        const craneArm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.4), darkSteelMat);
        craneArm.position.set(0, 0.16, 0.15);
        craneArm.rotation.x = -Math.PI / 6; // angle upwards
        this.craneGroup.add(craneArm);

        group.add(this.craneGroup);

        // 9. Operations Control Cabin
        const controlCabin = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.24, 0.55), darkSteelMat);
        controlCabin.position.set(platformWidth / 3.5, 0.51 + 0.12, platformWidth / 3.5);
        controlCabin.castShadow = true;
        group.add(controlCabin);

        // Control cabin glowing windows
        const windowGeo = new THREE.BoxGeometry(0.36, 0.08, 0.4);
        const windowMesh = new THREE.Mesh(windowGeo, emissiveGlowMat);
        windowMesh.position.copy(controlCabin.position);
        group.add(windowMesh);

        // 10. Scan Radar System on top of Cabin
        this.radarSystem = new THREE.Group();
        this.radarSystem.position.set(platformWidth / 3.5, 0.51 + 0.24, platformWidth / 3.5);
        const radarPost = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8), steelMat);
        radarPost.position.y = 0.075;
        this.radarSystem.add(radarPost);

        const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.02, 0.06, 12, 1, true), steelMat);
        dish.name = 'radarDish';
        dish.rotation.x = Math.PI / 2.5; // angle upwards
        dish.position.y = 0.16;
        this.radarSystem.add(dish);
        group.add(this.radarSystem);

        // 11. Mechanical Pumping Pistons (Rods that move up and down)
        this.pistons = [];
        const pCount = 3;
        for (let i = 0; i < pCount; i++) {
            const angle = (i / pCount) * Math.PI * 2;
            const dist = platformWidth / 3.5;
            const px = Math.cos(angle) * dist * 0.7;
            const pz = Math.sin(angle) * dist * 0.7;

            // Cylinder jacket
            const jacket = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 6), darkSteelMat);
            jacket.position.set(px, 0.51 + 0.11, pz);
            group.add(jacket);

            // Moving internal shaft
            const pistonInner = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 6), steelMat);
            pistonInner.position.set(px, 0.51 + 0.18, pz);
            group.add(pistonInner);

            this.pistons.push(pistonInner);
        }

        // 12. Edge Strobe Safety Warning Lights
        this.warningStrobes = [];
        const strobeGeo = new THREE.SphereGeometry(0.025, 6, 6);
        const strobeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        const strobePositions = [
            { x: -platformWidth/2 + 0.08, y: 0.53, z: -platformWidth/2 + 0.08 },
            { x: platformWidth/2 - 0.08, y: 0.53, z: -platformWidth/2 + 0.08 },
            { x: -platformWidth/2 + 0.08, y: 0.53, z: platformWidth/2 - 0.08 },
            { x: platformWidth/2 - 0.08, y: 0.53, z: platformWidth/2 - 0.08 }
        ];

        strobePositions.forEach(pos => {
            const strobe = new THREE.Mesh(strobeGeo, strobeMat.clone());
            strobe.position.set(pos.x, pos.y, pos.z);
            group.add(strobe);
            
            const pl = new THREE.PointLight(0xff0000, 0.8, 1.5);
            pl.position.copy(strobe.position);
            group.add(pl);

            this.warningStrobes.push({
                mesh: strobe,
                light: pl,
                phase: Math.random() * Math.PI * 2
            });
        });

        // 13. Ambient point light under the rig
        this.underGlowLight = new THREE.PointLight(coreCyan, 1.2, 3.0);
        this.underGlowLight.position.set(0, 0.15, 0);
        group.add(this.underGlowLight);

        return group;
    }

    update(dt) {
        if (this.disabledTimer > 0) {
            this.disabledTimer -= dt;
            if (this.underGlowLight) {
                this.underGlowLight.intensity = Math.random() * 0.3;
            }
            if (this.skyBeam) {
                this.skyBeam.visible = false;
            }
            return;
        }

        const time = Date.now() * 0.001;

        // 1. Animate Radar System rotation
        if (this.radarSystem) {
            const dish = this.radarSystem.getObjectByName('radarDish');
            if (dish) dish.rotation.y += dt * 1.5;
        }

        // 2. Pulse central laser beam scale/opacity
        if (this.skyBeam) {
            this.skyBeam.visible = true;
            const pulse = 0.75 + 0.25 * Math.sin(time * 6.0);
            this.skyBeam.scale.set(pulse, 1.0, pulse);
            this.skyBeam.material.opacity = 0.5 + 0.25 * Math.sin(time * 6.0);
        }

        // 3. Strobe Safety Lights Flashing
        if (this.warningStrobes) {
            this.warningStrobes.forEach(strobe => {
                const brightness = Math.sin(time * 5.0 + strobe.phase);
                if (brightness > 0) {
                    strobe.mesh.material.color.setRGB(1, 0, 0);
                    strobe.light.intensity = 1.0;
                } else {
                    strobe.mesh.material.color.setRGB(0.15, 0, 0);
                    strobe.light.intensity = 0;
                }
            });
        }

        // 4. Pulse underglow light
        if (this.underGlowLight) {
            this.underGlowLight.intensity = 1.2 + 0.4 * Math.sin(time * 3.0);
        }

        // 5. Rotate Sub-water Drill Bit and animate plunge depth
        if (this.drillBitGroup) {
            this.drillBitGroup.rotation.y += dt * 3.5;
            this.drillBitGroup.position.y = 0.05 + Math.sin(time * 1.8) * 0.08;
        }

        // 6. Rotate industrial crane slowly back and forth
        if (this.craneGroup) {
            this.craneGroup.rotation.y = Math.sin(time * 0.5) * (Math.PI / 3);
        }

        // 7. Animate pistons sliding up and down out-of-phase
        if (this.pistons) {
            this.pistons.forEach((piston, i) => {
                piston.position.y = 0.51 + 0.18 + Math.sin(time * 4.0 + i * (Math.PI / 1.5)) * 0.06;
            });
        }
    }
};
