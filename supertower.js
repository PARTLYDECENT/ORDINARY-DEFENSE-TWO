window.SuperTower = class SuperTower extends window.SporeTower {
    constructor(x, z) {
        super(x, z, 'supertower');
    }

    buildMesh() {
        const group = new THREE.Group();
        group.userData = { isTower: true, towerInstance: this };

        // 1. Materials
        const whiteConcreteMat = new THREE.MeshStandardMaterial({
            color: 0xfafafa,
            roughness: 0.45,
            metalness: 0.1
        });
        const metallicDetailMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.2,
            metalness: 0.8
        });
        const glowingGlassMat = new THREE.MeshStandardMaterial({
            color: 0x0c1e30,
            roughness: 0.1,
            metalness: 0.9,
            emissive: 0xfacc15,
            emissiveIntensity: 1.4
        });
        const darkGlassMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.05,
            metalness: 0.95
        });
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        // 2. Foundation Plate
        const towerWidth = 1.0;
        const foundationGeo = new THREE.BoxGeometry(towerWidth + 0.4, 0.15, towerWidth + 0.4);
        const foundation = new THREE.Mesh(foundationGeo, whiteConcreteMat);
        foundation.position.y = 0.075;
        foundation.castShadow = true;
        foundation.receiveShadow = true;
        group.add(foundation);

        // 3. Entrance Base Floor
        const baseFloorHeight = 0.55;
        const entranceBaseGeo = new THREE.BoxGeometry(towerWidth + 0.1, baseFloorHeight, towerWidth + 0.1);
        const entranceBase = new THREE.Mesh(entranceBaseGeo, whiteConcreteMat);
        entranceBase.position.y = 0.15 + (baseFloorHeight / 2);
        entranceBase.castShadow = true;
        entranceBase.receiveShadow = true;
        group.add(entranceBase);

        // Large entrance doors
        const entranceDoorGeo = new THREE.BoxGeometry(towerWidth - 0.2, baseFloorHeight - 0.1, 0.08);
        const mainDoor = new THREE.Mesh(entranceDoorGeo, darkGlassMat);
        mainDoor.position.set(0, 0.15 + baseFloorHeight / 2, (towerWidth + 0.1) / 2 + 0.01);
        group.add(mainDoor);

        let currentHeight = 0.15 + baseFloorHeight;
        const numFloors = 5;

        // 4. Procedural Floors (Tapering futuristic skyscraper design)
        for (let f = 0; f < numFloors; f++) {
            const floorHeight = 0.5;
            const taperRatio = 1.0 - (f / numFloors) * 0.4;
            const floorWidth = towerWidth * taperRatio;

            const floorGroup = new THREE.Group();
            floorGroup.position.y = currentHeight + (floorHeight / 2);

            // Core glass box
            const coreWidth = floorWidth - 0.08;
            const coreGeo = new THREE.BoxGeometry(coreWidth, floorHeight - 0.01, coreWidth);
            const coreMesh = new THREE.Mesh(coreGeo, darkGlassMat);
            coreMesh.castShadow = true;
            floorGroup.add(coreMesh);

            // Windows & vertical pillars on four sides
            const halfWidth = floorWidth / 2;
            for (let side = 0; side < 4; side++) {
                const sideRotation = (Math.PI / 2) * side;
                const winGeo = new THREE.PlaneGeometry(floorWidth - 0.15, floorHeight - 0.08);
                const winMesh = new THREE.Mesh(winGeo, glowingGlassMat);
                winMesh.position.set(0, 0, halfWidth + 0.005);

                const windowSideGroup = new THREE.Group();
                windowSideGroup.rotation.y = sideRotation;
                windowSideGroup.add(winMesh);
                floorGroup.add(windowSideGroup);
            }

            // Concrete Corner Columns
            const colSize = 0.08;
            const cornerPositions = [
                [-halfWidth + colSize/2, -halfWidth + colSize/2],
                [halfWidth - colSize/2, -halfWidth + colSize/2],
                [halfWidth - colSize/2, halfWidth - colSize/2],
                [-halfWidth + colSize/2, halfWidth - colSize/2]
            ];
            cornerPositions.forEach(pos => {
                const colGeo = new THREE.BoxGeometry(colSize, floorHeight, colSize);
                const colMesh = new THREE.Mesh(colGeo, whiteConcreteMat);
                colMesh.position.set(pos[0], 0, pos[1]);
                colMesh.castShadow = true;
                colMesh.receiveShadow = true;
                floorGroup.add(colMesh);
            });

            group.add(floorGroup);
            currentHeight += floorHeight;
        }

        // 5. Crown Penthouse Block
        const pentSize = towerWidth * 0.55;
        const pentGeo = new THREE.BoxGeometry(pentSize, 0.45, pentSize);
        const pentMesh = new THREE.Mesh(pentGeo, whiteConcreteMat);
        pentMesh.position.y = currentHeight + 0.225;
        pentMesh.castShadow = true;
        group.add(pentMesh);

        // Helipad top deck
        const padGeo = new THREE.CylinderGeometry(pentSize * 0.55, pentSize * 0.55, 0.03, 16);
        const padMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });
        const padMesh = new THREE.Mesh(padGeo, padMat);
        padMesh.position.y = currentHeight + 0.45;
        padMesh.receiveShadow = true;
        group.add(padMesh);

        currentHeight += 0.45;

        // 6. Communication Sat Dish (Animated)
        const mastGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
        const mastMesh = new THREE.Mesh(mastGeo, metallicDetailMat);
        mastMesh.position.set(-pentSize / 3, currentHeight + 0.4, -pentSize / 3);
        mastMesh.castShadow = true;
        group.add(mastMesh);

        const dishGeo = new THREE.CylinderGeometry(0.24, 0.04, 0.12, 16, 1, true);
        this.satDish = new THREE.Mesh(dishGeo, metallicDetailMat);
        this.satDish.position.set(-pentSize / 3, currentHeight + 0.8, -pentSize / 3);
        this.satDish.rotation.x = Math.PI / 4;
        group.add(this.satDish);

        // 7. Telemetry Antenna Spire
        const spireGeo = new THREE.CylinderGeometry(0.01, 0.03, 1.2, 8);
        const spireMesh = new THREE.Mesh(spireGeo, metallicDetailMat);
        spireMesh.position.set(pentSize / 3, currentHeight + 0.6, pentSize / 3);
        spireMesh.castShadow = true;
        group.add(spireMesh);

        // 8. Blinking Beacons
        this.beacons = [];
        const beaconGeo = new THREE.SphereGeometry(0.04, 8, 8);
        
        const beacon1 = new THREE.Mesh(beaconGeo, beaconMat.clone());
        beacon1.position.set(pentSize / 3, currentHeight + 1.2, pentSize / 3);
        group.add(beacon1);
        this.beacons.push(beacon1);

        const beacon2 = new THREE.Mesh(beaconGeo, beaconMat.clone());
        beacon2.position.set(-pentSize / 3, currentHeight + 0.85, -pentSize / 3);
        group.add(beacon2);
        this.beacons.push(beacon2);

        // 9. Point Light representing skyscraper power beacon
        this.beaconLight = new THREE.PointLight(0xfacc15, 1.5, 5.0);
        this.beaconLight.position.set(0, currentHeight + 0.2, 0);
        group.add(this.beaconLight);

        // Store peak height for shoot particle positions
        this.peakHeight = currentHeight;

        return group;
    }

    update(dt) {
        if (this.disabledTimer > 0) {
            this.disabledTimer -= dt;
            if (this.beaconLight) {
                this.beaconLight.intensity = Math.random() * 0.4;
            }
            return;
        }

        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        const timeNow = Date.now() * 0.001;

        // 1. Blinking Warning Beacons
        if (this.beacons) {
            this.beacons.forEach((beacon, idx) => {
                const cycle = Math.sin(timeNow * (4.0 - idx * 0.5));
                if (cycle > 0) {
                    beacon.material.color.setRGB(1, 0, 0);
                } else {
                    beacon.material.color.setRGB(0.15, 0, 0);
                }
            });
        }

        // 2. Rotate Communication Sat Dish
        if (this.satDish) {
            this.satDish.rotation.y += dt * 0.8;
        }

        // 3. Pulse central beacon light intensity
        if (this.beaconLight) {
            this.beaconLight.intensity = 1.0 + 0.5 * Math.sin(timeNow * 6);
        }

        // 4. Scan and engage closest enemy in range
        this.target = this.findTarget();

        if (this.target) {
            if (this.cooldown <= 0) {
                this.shoot();
            }
        }
    }

    shoot() {
        const fireRate = this.specs.fireRate || 5.0;
        this.cooldown = fireRate;

        if (!this.target) return;

        // Visual beam effect starting from peak of skyscraper pent deck
        const startPos = new THREE.Vector3(0, this.peakHeight, 0).applyMatrix4(this.mesh.matrixWorld);
        const endPos = this.target.position.clone().add(new THREE.Vector3(0, 0.25, 0));
        const distance = startPos.distanceTo(endPos);

        // Thick plasma beam
        const beamGeo = new THREE.CylinderGeometry(0.12, 0.12, distance, 8);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xfacc15,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending
        });
        const beamMesh = new THREE.Mesh(beamGeo, beamMat);
        beamMesh.position.copy(startPos).add(endPos).multiplyScalar(0.5);
        beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endPos.clone().sub(startPos).normalize());
        scene.add(beamMesh);

        // Secondary white inner laser
        const coreBeamGeo = new THREE.CylinderGeometry(0.04, 0.04, distance, 4);
        const coreBeamMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        const coreBeamMesh = new THREE.Mesh(coreBeamGeo, coreBeamMat);
        coreBeamMesh.position.copy(beamMesh.position);
        coreBeamMesh.quaternion.copy(beamMesh.quaternion);
        scene.add(coreBeamMesh);

        // Decay flash animation
        setTimeout(() => {
            scene.remove(beamMesh);
            scene.remove(coreBeamMesh);
            beamGeo.dispose();
            beamMat.dispose();
            coreBeamGeo.dispose();
            coreBeamMat.dispose();
        }, 120);

        // Inflict instant heavy damage
        this.target.takeDamage(this.specs.damage);

        // Massive explosion at target pos
        if (window.particles && typeof window.particles.spawnExplosion === 'function') {
            window.particles.spawnExplosion(this.target.position, 0xfacc15, 20);
        }

        // Sound effect
        if (window.audio) {
            if (typeof window.audio.playLaserShoot === 'function') {
                window.audio.playLaserShoot();
            } else if (typeof window.audio.playShoot === 'function') {
                window.audio.playShoot();
            }
        }
    }
}
