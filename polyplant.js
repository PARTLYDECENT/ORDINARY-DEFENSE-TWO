(function() {
    window.polyplants = [];

    window.Polyplant = class Polyplant {
        constructor(scene, x, z) {
            this.scene = scene;
            this.gridX = x;
            this.gridZ = z;
            this.isHarvested = false;
            this.scale = 0.01; // Spawning growth scale
            this.timeOffset = Math.random() * 100;

            const wPos = window.gridToWorld ? window.gridToWorld(x, z) : { x: (x - 20) * 2 + 1, z: (z - 20) * 2 + 1 };
            this.position = new THREE.Vector3(wPos.x, 0, wPos.z);

            this.mesh = this.buildMesh();
            this.mesh.position.copy(this.position);
            this.mesh.scale.set(this.scale, this.scale, this.scale);
            this.scene.add(this.mesh);

            // Bioluminescent Point Light
            this.light = new THREE.PointLight(0x22c55e, 1.2, 3.5);
            this.light.position.set(this.position.x, 0.7, this.position.z);
            this.scene.add(this.light);
        }

        buildMesh() {
            const group = new THREE.Group();
            group.userData = { isPolyplant: true, polyplantInstance: this };

            // Central Stalk (Spindly and Organic)
            const stalkGeo = new THREE.CylinderGeometry(0.03, 0.06, 0.7, 5);
            stalkGeo.translate(0, 0.35, 0);
            const greenStalkMat = new THREE.MeshStandardMaterial({ 
                color: 0x166534, 
                roughness: 0.85,
                flatShading: true 
            });
            const stalk = new THREE.Mesh(stalkGeo, greenStalkMat);
            stalk.castShadow = true;
            stalk.receiveShadow = true;
            group.add(stalk);

            // Glowing bioluminescent flower materials
            const glowMat = new THREE.MeshStandardMaterial({
                color: 0x4ade80,
                emissive: 0x22c55e,
                emissiveIntensity: 1.6,
                roughness: 0.3,
                metalness: 0.1
            });

            // 4 Spindly Branches wrapping out
            this.branches = [];
            const branchGeo = new THREE.CylinderGeometry(0.012, 0.025, 0.55, 4);
            branchGeo.translate(0, 0.275, 0);

            for (let i = 0; i < 4; i++) {
                const branch = new THREE.Mesh(branchGeo, greenStalkMat);
                branch.position.y = 0.25;
                const angle = (i / 4) * Math.PI * 2 + Math.random() * 0.15;
                branch.rotation.y = angle;
                branch.rotation.z = 0.45 + Math.random() * 0.25; // tilt out

                // Spindly leaves / pods at tips
                const podGeo = new THREE.DodecahedronGeometry(0.08);
                const pod = new THREE.Mesh(podGeo, glowMat);
                pod.position.y = 0.55;
                branch.add(pod);

                group.add(branch);
                this.branches.push(branch);
            }

            // Top crown bioluminescent bulb
            const crownGeo = new THREE.SphereGeometry(0.13, 8, 8);
            const crown = new THREE.Mesh(crownGeo, glowMat);
            crown.position.y = 0.7;
            group.add(crown);

            return group;
        }

        update(dt, time) {
            // Growth scaling
            if (this.scale < 1.0) {
                this.scale = Math.min(1.0, this.scale + dt * 1.5);
                this.mesh.scale.set(this.scale, this.scale, this.scale);
            }

            // Procedural swaying in the wind
            const swayTime = time + this.timeOffset;
            const swayX = Math.sin(swayTime * 1.4) * 0.06;
            const swayZ = Math.cos(swayTime * 1.1) * 0.05;
            this.mesh.rotation.z = swayX;
            this.mesh.rotation.x = swayZ;

            // Pulse glowing light
            if (this.light) {
                this.light.intensity = (0.9 + 0.45 * Math.sin(swayTime * 2.8)) * this.scale;
            }
        }

        harvest() {
            if (this.isHarvested) return;
            this.isHarvested = true;

            // Clean up scene objects
            this.scene.remove(this.mesh);
            if (this.light) {
                this.scene.remove(this.light);
            }

            // Dispose geometries and materials
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

    window.spawnPolyplant = function(scene, grid, grid_size, cell_types) {
        // Random placement away from center base & portals
        let attempts = 0;
        const forbiddenArea = 4;
        while (attempts < 100) {
            const x = Math.floor(Math.random() * grid_size);
            const z = Math.floor(Math.random() * grid_size);

            if (grid[x][z] === cell_types.EMPTY) {
                // Check distance to base
                const isNearBase = Math.abs(x - 20) < forbiddenArea && Math.abs(z - 20) < forbiddenArea;
                if (isNearBase) {
                    attempts++;
                    continue;
                }

                // Check distance to active polyplants
                const alreadyExists = window.polyplants.some(p => p.gridX === x && p.gridZ === z);
                if (!alreadyExists) {
                    const plant = new window.Polyplant(scene, x, z);
                    window.polyplants.push(plant);
                    return plant;
                }
            }
            attempts++;
        }
        return null;
    };

    window.updatePolyplants = function(dt) {
        const time = Date.now() * 0.001;
        window.polyplants = window.polyplants.filter(p => {
            if (p.isHarvested) {
                return false;
            }
            p.update(dt, time);
            return true;
        });
    };

    window.clearPolyplants = function() {
        window.polyplants.forEach(p => {
            p.harvest();
        });
        window.polyplants.length = 0;
    };
})();
