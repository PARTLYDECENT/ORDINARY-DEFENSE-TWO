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

        const worldPos = gridToWorld(x, z);
        this.position = new THREE.Vector3(worldPos.x, 0, worldPos.z);

        this.mesh = this.buildMesh();
        this.mesh.position.copy(this.position);
        scene.add(this.mesh);
    }

    buildMesh() {
        const group = new THREE.Group();
        group.userData = { isTower: true, towerInstance: this };

        if (this.type === 'laser') {
            // ==========================================
            // BIO-LASER TURRET MESH (Pyramid & Octahedron)
            // ==========================================
            // 1. Pyramid Base
            const baseGeo = new THREE.ConeGeometry(0.7, 0.5, 4);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.1 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.rotation.y = Math.PI / 4;
            base.position.y = 0.25;
            base.castShadow = true;
            group.add(base);
            if (window.Translator) window.Translator.optimizeMesh(base);

            // 2. Sleek Metallic Stem
            const stemGeo = new THREE.CylinderGeometry(0.12, 0.18, 1.2, 5);
            const stemMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.3 });
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 1.0;
            stem.castShadow = true;
            group.add(stem);
            if (window.Translator) window.Translator.optimizeMesh(stem);

            // 3. Glowing Core Chest Light (Red)
            const coreGeo = new THREE.OctahedronGeometry(0.2, 0);
            const coreMat = new THREE.MeshBasicMaterial({ color: this.specs.color, transparent: true, opacity: 0.9 });
            this.pulseCore = new THREE.Mesh(coreGeo, coreMat);
            this.pulseCore.position.y = 1.0;
            group.add(this.pulseCore);

            this.chestLight = new THREE.PointLight(this.specs.color, 1.0, 4);
            this.chestLight.position.set(0, 1.0, 0);
            group.add(this.chestLight);

            // 4. Rotating Octahedron Head
            this.turretHead = new THREE.Group();
            this.turretHead.position.y = 1.6;

            const headGeo = new THREE.OctahedronGeometry(0.35, 0);
            const headMat = new THREE.MeshStandardMaterial({ color: this.specs.color, metalness: 0.8, flatShading: true });
            const head = new THREE.Mesh(headGeo, headMat);
            this.turretHead.add(head);

            // 5. Single Heavy Focal Barrel
            const barrelGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.8, 5);
            const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.95 });
            this.laserBarrel = new THREE.Mesh(barrelGeo, barrelMat);
            this.laserBarrel.rotation.x = Math.PI / 2;
            this.laserBarrel.position.set(0, 0, 0.35);
            this.turretHead.add(this.laserBarrel);

            // 6. Spinning Focusing Ring
            this.orbitalGroup = new THREE.Group();
            const ringGeo = new THREE.TorusGeometry(0.5, 0.04, 4, 12);
            const ringMat = new THREE.MeshBasicMaterial({ color: this.specs.bulletColor, transparent: true, opacity: 0.6 });
            this.focusRing = new THREE.Mesh(ringGeo, ringMat);
            this.focusRing.position.set(0, 0, 0.2);
            this.orbitalGroup.add(this.focusRing);
            this.turretHead.add(this.orbitalGroup);

            // 7. Muzzle Flash Light
            this.muzzleFlash = new THREE.PointLight(this.specs.bulletColor, 0, 3);
            this.muzzleFlash.position.set(0, 0, 0.8);
            this.turretHead.add(this.muzzleFlash);

            const flashGeo = new THREE.SphereGeometry(0.14, 5, 5);
            const flashMat = new THREE.MeshBasicMaterial({ color: this.specs.bulletColor, transparent: true, opacity: 0 });
            this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
            this.muzzleFlashMesh.position.set(0, 0, 0.8);
            this.turretHead.add(this.muzzleFlashMesh);

            group.add(this.turretHead);
        } else if (this.type === 'frost') {
            // ==========================================
            // FROST ORCHID TURRET MESH (Hexagonal & Flowers)
            // ==========================================
            // 1. Hexagonal Base
            const baseGeo = new THREE.CylinderGeometry(0.5, 0.7, 0.4, 6);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = 0.2;
            base.castShadow = true;
            group.add(base);
            if (window.Translator) window.Translator.optimizeMesh(base);

            // 2. Cyan Glowing Stem
            const stemGeo = new THREE.CylinderGeometry(0.15, 0.22, 1.2, 6);
            const stemMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.4 });
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 1.0;
            stem.castShadow = true;
            group.add(stem);
            if (window.Translator) window.Translator.optimizeMesh(stem);

            // 3. Glowing Core Chest Light (Cyan)
            const coreGeo = new THREE.SphereGeometry(0.24, 8, 8);
            const coreMat = new THREE.MeshBasicMaterial({ color: this.specs.color, transparent: true, opacity: 0.85 });
            this.pulseCore = new THREE.Mesh(coreGeo, coreMat);
            this.pulseCore.position.y = 1.0;
            group.add(this.pulseCore);

            this.chestLight = new THREE.PointLight(this.specs.color, 1.0, 4);
            this.chestLight.position.set(0, 1.0, 0);
            group.add(this.chestLight);

            // 4. Rotating Orchid Pod Head
            this.turretHead = new THREE.Group();
            this.turretHead.position.y = 1.6;

            const headGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 8);
            const headMat = new THREE.MeshStandardMaterial({ color: this.specs.color, metalness: 0.2, roughness: 0.8 });
            const head = new THREE.Mesh(headGeo, headMat);
            head.rotation.x = Math.PI / 2;
            this.turretHead.add(head);

            // 5. Frost Orchid Petals (4 cones)
            const petalGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
            const petalMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, flatShading: true });
            
            for (let i = 0; i < 4; i++) {
                const petal = new THREE.Mesh(petalGeo, petalMat);
                const angle = (i / 4) * Math.PI * 2;
                petal.position.set(Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0.05);
                petal.rotation.z = angle + Math.PI / 2;
                petal.rotation.x = 0.2;
                this.turretHead.add(petal);
            }

            // 6. Central Freeze Core Emitter
            const emitterGeo = new THREE.SphereGeometry(0.16, 6, 6);
            const emitterMat = new THREE.MeshBasicMaterial({ color: this.specs.bulletColor });
            const emitter = new THREE.Mesh(emitterGeo, emitterMat);
            emitter.position.set(0, 0, 0.15);
            this.turretHead.add(emitter);

            // 7. Spinning Frost Shards
            this.orbitalGroup = new THREE.Group();
            const shardGeo = new THREE.OctahedronGeometry(0.08, 0);
            const shardMat = new THREE.MeshBasicMaterial({ color: this.specs.color });
            this.shards = [];
            for (let i = 0; i < 3; i++) {
                const shard = new THREE.Mesh(shardGeo, shardMat);
                const angle = (i / 3) * Math.PI * 2;
                shard.position.set(Math.cos(angle) * 0.65, Math.sin(angle) * 0.65, 0);
                this.orbitalGroup.add(shard);
                this.shards.push(shard);
            }
            this.turretHead.add(this.orbitalGroup);

            // 8. Muzzle Flash Light
            this.muzzleFlash = new THREE.PointLight(this.specs.bulletColor, 0, 3);
            this.muzzleFlash.position.set(0, 0, 0.3);
            this.turretHead.add(this.muzzleFlash);

            const flashGeo = new THREE.SphereGeometry(0.18, 6, 6);
            const flashMat = new THREE.MeshBasicMaterial({ color: this.specs.bulletColor, transparent: true, opacity: 0 });
            this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
            this.muzzleFlashMesh.position.set(0, 0, 0.3);
            this.turretHead.add(this.muzzleFlashMesh);

            group.add(this.turretHead);
        } else {
            // ==========================================
            // CLASSIC SPORE TURRET MESH
            // ==========================================
            // 1. Pedestal Base
            const baseGeo = new THREE.CylinderGeometry(0.5, 0.7, 0.5, 8);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.2 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = 0.25;
            base.castShadow = true;
            group.add(base);
            if (window.Translator) window.Translator.optimizeMesh(base);

            // 2. Bioluminescent Stem
            const stemGeo = new THREE.CylinderGeometry(0.18, 0.25, 1.2, 8);
            const stemMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.5 });
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 1.0;
            stem.castShadow = true;
            group.add(stem);
            if (window.Translator) window.Translator.optimizeMesh(stem);

            // 3. Glowing Core Chest Light
            const coreGeo = new THREE.SphereGeometry(0.25, 8, 8);
            const coreMat = new THREE.MeshBasicMaterial({ color: this.specs.color, transparent: true, opacity: 0.8 });
            this.pulseCore = new THREE.Mesh(coreGeo, coreMat);
            this.pulseCore.position.y = 1.0;
            group.add(this.pulseCore);

            this.chestLight = new THREE.PointLight(this.specs.color, 1.0, 4);
            this.chestLight.position.set(0, 1.0, 0);
            group.add(this.chestLight);

            // 4. Rotating Turret Head
            this.turretHead = new THREE.Group();
            this.turretHead.position.y = 1.6;

            const headGeo = new THREE.DodecahedronGeometry(0.4, 1);
            const headMat = new THREE.MeshStandardMaterial({ color: this.specs.color, roughness: 0.1, flatShading: true });
            const head = new THREE.Mesh(headGeo, headMat);
            this.turretHead.add(head);

            // 5. Double Barrels
            const barrelGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.7, 6);
            const barrelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.1 });

            this.barrelL = new THREE.Mesh(barrelGeo, barrelMat);
            this.barrelL.rotation.x = Math.PI / 2;
            this.barrelL.position.set(-0.16, 0, 0.3);
            this.turretHead.add(this.barrelL);

            this.barrelR = new THREE.Mesh(barrelGeo, barrelMat);
            this.barrelR.rotation.x = Math.PI / 2;
            this.barrelR.position.set(0.16, 0, 0.3);
            this.turretHead.add(this.barrelR);

            // 6. Spinning Orbital Shards
            this.orbitalGroup = new THREE.Group();
            const shardGeo = new THREE.ConeGeometry(0.08, 0.25, 4);
            const shardMat = new THREE.MeshBasicMaterial({ color: this.specs.color });
            this.shards = [];
            for (let i = 0; i < 3; i++) {
                const shard = new THREE.Mesh(shardGeo, shardMat);
                const angle = (i / 3) * Math.PI * 2;
                shard.position.set(Math.cos(angle) * 0.7, 0, Math.sin(angle) * 0.7);
                shard.rotation.x = 0.5;
                shard.rotation.z = angle;
                this.orbitalGroup.add(shard);
                this.shards.push(shard);
            }
            this.turretHead.add(this.orbitalGroup);

            // 7. Muzzle Flash Light and Spark Visuals
            this.muzzleFlash = new THREE.PointLight(this.specs.bulletColor, 0, 3);
            this.muzzleFlash.position.set(0, 0, 0.7);
            this.turretHead.add(this.muzzleFlash);

            const flashGeo = new THREE.SphereGeometry(0.15, 6, 6);
            const flashMat = new THREE.MeshBasicMaterial({ color: this.specs.bulletColor, transparent: true, opacity: 0 });
            this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
            this.muzzleFlashMesh.position.set(0, 0, 0.7);
            this.turretHead.add(this.muzzleFlashMesh);

            group.add(this.turretHead);
        }

        return group;
    }

    upgrade() {
        if (this.level >= 2) return;
        this.level = 2;
        this.specs = { ...TOWER_SPECS[this.type].upgraded };

        // Color updates
        this.turretHead.children[0].material.color.setHex(this.specs.color);
        this.pulseCore.material.color.setHex(this.specs.color);
        this.chestLight.color.setHex(this.specs.color);
        
        if (this.shards) {
            this.shards.forEach(shard => shard.material.color.setHex(this.specs.color));
        }

        if (this.focusRing) {
            this.focusRing.material.color.setHex(this.specs.bulletColor);
        }

        this.muzzleFlash.color.setHex(this.specs.bulletColor);
        this.muzzleFlashMesh.material.color.setHex(this.specs.bulletColor);

        // Visual feedback explosion
        particles.spawnExplosion(this.position, 0xa855f7, 20);
        audio.playBuild();
    }

    update(dt) {
        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        // Animate orbital/focusing components
        if (this.orbitalGroup) {
            this.orbitalGroup.rotation.z += dt * 3;
            if (this.type === 'laser') {
                this.orbitalGroup.rotation.y += dt * 1.5;
            }
        }

        // Animate Chest Light Glow/Pulse
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.005);
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
                this.muzzleFlash.intensity = ratio * 2.5;
                this.muzzleFlashMesh.material.opacity = ratio * 0.9;
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
            // Draw continuous laser beam!
            const startPos = new THREE.Vector3(0, 0, 0.6).applyMatrix4(this.turretHead.matrixWorld);
            const endPos = this.target.position.clone();
            const distance = startPos.distanceTo(endPos);

            const laserGeo = new THREE.CylinderGeometry(0.03, 0.03, distance, 4);
            const laserMat = new THREE.MeshBasicMaterial({
                color: this.specs.bulletColor,
                transparent: true,
                opacity: 0.95
            });
            const laserMesh = new THREE.Mesh(laserGeo, laserMat);
            laserMesh.position.copy(startPos).add(endPos).multiplyScalar(0.5);
            laserMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endPos.clone().sub(startPos).normalize());
            scene.add(laserMesh);

            // Fast flash decay
            setTimeout(() => scene.remove(laserMesh), 40);

            // Inflict instant damage
            this.target.takeDamage(this.specs.damage);
            particles.spawnHitBurst(this.target.position, this.specs.bulletColor);

            // Laser recoil scaling
            this.turretHead.scale.set(0.9, 0.9, 1.2);

            // Muzzle flash
            this.muzzleFlash.intensity = 2.0;
            this.muzzleFlashMesh.material.opacity = 0.8;
            this.muzzleFlashTimer = 0.08;

            audio.playShoot();
        } else if (this.type === 'frost') {
            // Launch frost projectile
            const startPos = new THREE.Vector3(0, 0, 0.2).applyMatrix4(this.turretHead.matrixWorld);
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

            // Petal pop recoil scale
            this.turretHead.scale.set(1.25, 1.25, 0.8);

            // Muzzle flash
            this.muzzleFlash.intensity = 2.2;
            this.muzzleFlashMesh.material.opacity = 0.85;
            this.muzzleFlashTimer = 0.12;

            audio.playShoot();
        } else {
            // Spore: Fire dual bullets
            const startPosLeft = new THREE.Vector3(-0.16, 0, 0.6).applyMatrix4(this.turretHead.matrixWorld);
            const startPosRight = new THREE.Vector3(0.16, 0, 0.6).applyMatrix4(this.turretHead.matrixWorld);

            projectiles.push(new BioSporeProjectile(startPosLeft, this.target, this.specs.damage, this.specs.projectileSpeed, this.specs.bulletColor, false));
            projectiles.push(new BioSporeProjectile(startPosRight, this.target, this.specs.damage, this.specs.projectileSpeed, this.specs.bulletColor, false));

            // Recoil scale animation
            this.turretHead.scale.set(1.2, 1.2, 0.75);

            // Activate muzzle flash
            this.muzzleFlash.intensity = 2.5;
            this.muzzleFlashMesh.material.opacity = 0.9;
            this.muzzleFlashTimer = 0.15;

            audio.playShoot();
        }
    }

    destroy() {
        scene.remove(this.mesh);
        particles.spawnExplosion(this.position, 0xef4444, 15);
    }
}
