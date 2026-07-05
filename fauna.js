(function() {
    window.faunaObjects = [];

    // Helper to create a micro recon drone model (Jungle)
    function createReconDrone() {
        const group = new THREE.Group();
        group.name = 'reconDrone';

        // Core spherical body
        const coreGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.85, roughness: 0.25 }); // dark steel
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.castShadow = true;
        group.add(core);

        // Glowing visor lens in front
        const lensGeo = new THREE.BoxGeometry(0.1, 0.03, 0.03);
        const lensMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 }); // cyan visor
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.position.set(0, 0.02, 0.075);
        group.add(lens);

        // Rotor mount
        const stemGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.06);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.09;
        group.add(stem);

        // Spinning rotor blades
        const bladeGeo = new THREE.BoxGeometry(0.24, 0.005, 0.025);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9 });
        const blades = new THREE.Mesh(bladeGeo, bladeMat);
        blades.name = 'blades';
        blades.position.y = 0.12;
        group.add(blades);

        return group;
    }
    window.createReconDrone = createReconDrone;

    // Helper to create an automated tracked rover model (Desert)
    function createTrackedRover() {
        const group = new THREE.Group();
        group.name = 'trackedRover';
        
        // Chassis center body
        const bodyGeo = new THREE.BoxGeometry(0.18, 0.08, 0.22);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x92400e, metalness: 0.7, roughness: 0.35 }); // amber/rust yellow
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.06;
        body.castShadow = true;
        group.add(body);

        // Left caterpillar tread plate
        const treadLGeo = new THREE.BoxGeometry(0.03, 0.09, 0.24);
        const treadMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85 }); // black tread
        const treadL = new THREE.Mesh(treadLGeo, treadMat);
        treadL.position.set(-0.1, 0.045, 0);
        treadL.castShadow = true;
        group.add(treadL);

        // Right caterpillar tread plate
        const treadR = new THREE.Mesh(treadLGeo, treadMat);
        treadR.position.set(0.1, 0.045, 0);
        treadR.castShadow = true;
        group.add(treadR);

        // Rotating sensor scanner dome on top
        const domeGroup = new THREE.Group();
        domeGroup.name = 'scannerDome';
        domeGroup.position.set(0, 0.1, 0);

        const domeGeo = new THREE.SphereGeometry(0.06, 6, 6, 0, Math.PI*2, 0, Math.PI/2);
        const domeMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.85 });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        domeGroup.add(dome);

        // Scanner lens
        const eyeGeo = new THREE.BoxGeometry(0.04, 0.025, 0.02);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xeab308 }); // glowing amber lens scanner
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0, 0.03, 0.055);
        domeGroup.add(eye);
        group.add(domeGroup);

        return group;
    }

    // Helper to create floating beacon capsules (Glacial)
    function createGlacialBeacon() {
        const group = new THREE.Group();
        group.name = 'glacialBeacon';

        // Core capsule body
        const capGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.16, 5);
        const capMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.2 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.castShadow = true;
        group.add(cap);

        // Blue glow rings
        const ringGeo = new THREE.TorusGeometry(0.045, 0.008, 4, 6);
        ringGeo.rotateX(Math.PI/2);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 }); // bright glacial blue glow
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 0.04;
        group.add(ring);

        const ring2 = ring.clone();
        ring2.position.y = -0.04;
        group.add(ring2);

        return group;
    }

    // Helper to create Cargo hover barge transport
    function createCargoTransport() {
        const group = new THREE.Group();
        group.name = 'cargoTransport';

        // Heavy cargo cargo pod box
        const cargoGeo = new THREE.BoxGeometry(0.24, 0.12, 0.32);
        const cargoMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.9, roughness: 0.25 });
        const cargo = new THREE.Mesh(cargoGeo, cargoMat);
        cargo.castShadow = true;
        group.add(cargo);

        // Hover thruster pods on sides
        const trustMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });
        const trustGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.08, 6);
        for (let i = 0; i < 4; i++) {
            const th = new THREE.Mesh(trustGeo, trustMat);
            const ox = (i % 2 === 0 ? -1 : 1) * 0.15;
            const oz = (i < 2 ? -1 : 1) * 0.12;
            th.position.set(ox, -0.04, oz);
            group.add(th);
        }

        // Bicolor glowing navigation lights
        const redLightGeo = new THREE.SphereGeometry(0.02, 6, 6);
        const redLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const redL = new THREE.Mesh(redLightGeo, redLightMat);
        redL.position.set(-0.1, 0.06, 0.15);
        group.add(redL);

        const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        const greenL = new THREE.Mesh(redLightGeo, greenLightMat);
        greenL.position.set(0.1, 0.06, 0.15);
        group.add(greenL);

        return group;
    }

    // Helper to create cyber hound ground walker
    function createCyberHound() {
        const group = new THREE.Group();
        group.name = 'cyberHound';

        // Hound main body
        const bodyGeo = new THREE.BoxGeometry(0.1, 0.08, 0.22);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.9, roughness: 0.3 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.06;
        body.castShadow = true;
        group.add(body);

        // Glow head
        const headGeo = new THREE.BoxGeometry(0.08, 0.06, 0.08);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 0.1, 0.12);
        group.add(head);

        const eyeGeo = new THREE.BoxGeometry(0.06, 0.015, 0.015);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xc084fc }); // glowing purple visor
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0, 0.01, 0.045);
        head.add(eye);

        // 4 legs
        const legGeo = new THREE.BoxGeometry(0.03, 0.14, 0.03);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x27272a });
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.name = `leg_${i}`;
            const side = (i % 2 === 0 ? -1 : 1);
            const isFront = i < 2;
            leg.position.set(0.06 * side, 0.0, (isFront ? 0.08 : -0.08));
            group.add(leg);
        }

        return group;
    }

    // Helper to create Auto Miner robotic drilling rover
    function createAutoMiner() {
        const group = new THREE.Group();
        group.name = 'autoMiner';

        // Tapered hexagonal rover body
        const bodyGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.12, 6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.6, roughness: 0.4 }); // heavy orange steel
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.08;
        body.castShadow = true;
        group.add(body);

        // Spinning front drill cone
        const drillGroup = new THREE.Group();
        drillGroup.name = 'drillGroup';
        drillGroup.position.set(0, 0.08, 0.15);

        const drillGeo = new THREE.ConeGeometry(0.08, 0.16, 8);
        drillGeo.rotateX(Math.PI/2);
        const drillMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.98, roughness: 0.1 });
        const drill = new THREE.Mesh(drillGeo, drillMat);
        drill.name = 'drillCone';
        drillGroup.add(drill);
        group.add(drillGroup);

        // 4 wheels
        const wheelGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8);
        wheelGeo.rotateZ(Math.PI/2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
        for (let i = 0; i < 4; i++) {
            const wh = new THREE.Mesh(wheelGeo, wheelMat);
            const side = (i % 2 === 0 ? -1 : 1);
            const isFront = i < 2;
            wh.position.set(0.14 * side, 0.04, (isFront ? 0.08 : -0.08));
            group.add(wh);
        }

        return group;
    }

    window.spawnBiomeFauna = function(scene, biomeName, grid_size, cell_size) {
        window.clearFauna(scene);
        console.log(`[Fauna System] Spawning ambient fauna for biome: ${biomeName}`);

        const count = 25;
        for (let i = 0; i < count; i++) {
            const rx = (Math.random() - 0.5) * (grid_size * cell_size - 4.0);
            const rz = (Math.random() - 0.5) * (grid_size * cell_size - 4.0);

            let mesh;
            let type = '';
            
            if (biomeName === 'volcanic') {
                if (Math.random() < 0.5) {
                    type = 'ember';
                    // Glowing orange ember box (industrial sparks)
                    const geo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
                    const mat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
                    mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(rx, Math.random() * 5.0 + 0.1, rz);
                } else {
                    type = 'hound';
                    mesh = createCyberHound();
                    mesh.position.set(rx, 0.01, rz);
                    mesh.userData = {
                        velX: (Math.random() - 0.5) * 1.6,
                        velZ: (Math.random() - 0.5) * 1.6,
                        changeTimer: Math.random() * 2.0
                    };
                }
            } else if (biomeName === 'glacial') {
                type = 'snow'; // Keep name 'snow' to reuse loop block safely
                mesh = createGlacialBeacon();
                mesh.position.set(rx, Math.random() * 2.5 + 0.5, rz);
            } else if (biomeName === 'desert') {
                if (Math.random() < 0.5) {
                    type = 'bug';
                    mesh = createTrackedRover();
                    mesh.position.set(rx, 0.01, rz);
                } else {
                    type = 'miner';
                    mesh = createAutoMiner();
                    mesh.position.set(rx, 0.01, rz);
                }
                mesh.userData = {
                    velX: (Math.random() - 0.5) * 1.5,
                    velZ: (Math.random() - 0.5) * 1.5,
                    changeTimer: Math.random() * 2.0
                };
            } else { // jungle
                if (Math.random() < 0.5) {
                    type = 'firefly';
                    mesh = createReconDrone();
                    mesh.position.set(rx, Math.random() * 2.2 + 0.8, rz);
                } else {
                    type = 'cargo';
                    mesh = createCargoTransport();
                    mesh.position.set(rx, Math.random() * 1.8 + 1.2, rz);
                }
            }

            mesh.userData = mesh.userData || {};
            mesh.userData.type = type;
            mesh.userData.uniqueId = Math.random() * 1000;
            mesh.userData.startX = rx;
            mesh.userData.startZ = rz;
            mesh.userData.startY = mesh.position.y;

            scene.add(mesh);
            window.faunaObjects.push(mesh);
        }
    };

    window.clearFauna = function(scene) {
        window.faunaObjects.forEach(obj => {
            scene.remove(obj);
            obj.traverse(child => {
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
        });
        window.faunaObjects.length = 0;
    };

    window.updateFauna = function(dt, grid_size, cell_size) {
        const time = Date.now() * 0.001;
        const bound = (grid_size * cell_size) / 2;

        window.faunaObjects.forEach(obj => {
            const data = obj.userData;
            if (data.type === 'firefly') {
                // Drone rotor spin
                const blades = obj.getObjectByName('blades');
                if (blades) {
                    blades.rotation.y += dt * 30.0;
                }

                // Smooth hover drone patrol drift
                obj.position.x += Math.sin(time * 1.2 + data.uniqueId) * 0.02;
                obj.position.z += Math.cos(time * 0.9 + data.uniqueId) * 0.02;
                obj.position.y = data.startY + Math.sin(time * 0.7 + data.uniqueId) * 0.25;

                if (obj.position.x < -bound) obj.position.x = bound;
                if (obj.position.x > bound) obj.position.x = -bound;
                if (obj.position.z < -bound) obj.position.z = bound;
                if (obj.position.z > bound) obj.position.z = -bound;
            } else if (data.type === 'cargo') {
                // Hover drift cargo transport barge bobbing
                obj.position.x += Math.sin(time * 0.8 + data.uniqueId) * 0.015;
                obj.position.z += Math.cos(time * 0.6 + data.uniqueId) * 0.015;
                obj.position.y = data.startY + Math.sin(time * 0.5 + data.uniqueId) * 0.2;

                if (obj.position.x < -bound) obj.position.x = bound;
                if (obj.position.x > bound) obj.position.x = -bound;
                if (obj.position.z < -bound) obj.position.z = bound;
                if (obj.position.z > bound) obj.position.z = -bound;
            } else if (data.type === 'ember') {
                // Spark node floating up
                obj.position.y += dt * 1.2;
                obj.position.x += Math.sin(time * 2.0 + data.uniqueId) * 0.015;
                if (obj.position.y > 6.0) {
                    obj.position.y = 0.1;
                    obj.position.x = data.startX;
                    obj.position.z = data.startZ;
                }
            } else if (data.type === 'hound') {
                // Cyber hound walking and turning
                data.changeTimer -= dt;
                if (data.changeTimer <= 0) {
                    data.velX = (Math.random() - 0.5) * 1.6;
                    data.velZ = (Math.random() - 0.5) * 1.6;
                    data.changeTimer = 1.2 + Math.random() * 1.8;
                }

                obj.position.x += data.velX * dt;
                obj.position.z += data.velZ * dt;

                const angle = Math.atan2(data.velX, data.velZ);
                obj.rotation.y = angle;

                // Cyber hound leg swings
                const speedMag = Math.sqrt(data.velX * data.velX + data.velZ * data.velZ);
                const legSwing = Math.sin(time * 12.0) * 0.35 * speedMag;
                for (let j = 0; j < 4; j++) {
                    const leg = obj.getObjectByName(`leg_${j}`);
                    if (leg) {
                        const phase = (j % 2 === 0 ? 1 : -1);
                        leg.rotation.x = legSwing * phase;
                    }
                }

                if (Math.abs(obj.position.x) > bound - 1) data.velX *= -1;
                if (Math.abs(obj.position.z) > bound - 1) data.velZ *= -1;
            } else if (data.type === 'snow') {
                // Glacial thermal beacon slow bobbing and drift
                obj.position.y = data.startY + Math.sin(time * 1.5 + data.uniqueId) * 0.35;
                obj.position.x += Math.sin(time * 0.8 + data.uniqueId) * 0.012;
                obj.position.z += Math.cos(time * 0.6 + data.uniqueId) * 0.012;

                if (obj.position.x < -bound) obj.position.x = bound;
                if (obj.position.x > bound) obj.position.x = -bound;
                if (obj.position.z < -bound) obj.position.z = bound;
                if (obj.position.z > bound) obj.position.z = -bound;
            } else if (data.type === 'bug') {
                // Rover scanner dome sweeping
                const dome = obj.getObjectByName('scannerDome');
                if (dome) {
                    dome.rotation.y = Math.sin(time * 3.5 + data.uniqueId) * 0.7;
                }

                // Crawl and turn rover
                data.changeTimer -= dt;
                if (data.changeTimer <= 0) {
                    data.velX = (Math.random() - 0.5) * 1.5;
                    data.velZ = (Math.random() - 0.5) * 1.5;
                    data.changeTimer = 1.5 + Math.random() * 2.0;
                }

                obj.position.x += data.velX * dt;
                obj.position.z += data.velZ * dt;

                // Orientation angle matching movement direction
                const angle = Math.atan2(data.velX, data.velZ);
                obj.rotation.y = angle;

                if (Math.abs(obj.position.x) > bound - 1) data.velX *= -1;
                if (Math.abs(obj.position.z) > bound - 1) data.velZ *= -1;
            } else if (data.type === 'miner') {
                // Auto miner drill cone spin
                const drill = obj.getObjectByName('drillCone');
                if (drill) {
                    drill.rotation.y += dt * 45.0;
                }

                // Crawl and turn miner rover
                data.changeTimer -= dt;
                if (data.changeTimer <= 0) {
                    data.velX = (Math.random() - 0.5) * 1.2;
                    data.velZ = (Math.random() - 0.5) * 1.2;
                    data.changeTimer = 2.0 + Math.random() * 2.5;
                }

                obj.position.x += data.velX * dt;
                obj.position.z += data.velZ * dt;

                const angle = Math.atan2(data.velX, data.velZ);
                obj.rotation.y = angle;

                if (Math.abs(obj.position.x) > bound - 1) data.velX *= -1;
                if (Math.abs(obj.position.z) > bound - 1) data.velZ *= -1;
            }
        });
    };
})();
