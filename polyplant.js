(function() {
    'use strict';

    const plants = [];
    window.polyplants = plants;

    const CONFIG = {
        color: {
            stalk: 0x166534,
            glow: 0x4ade80,
            emissive: 0x22c55e
        },
        growthRate: 1.8,
        maxScale: 1,
        light: { intensity: 1.2, distance: 3.5, height: 0.7 },
        sway: { xAmp: 0.06, zAmp: 0.05, xFreq: 1.4, zFreq: 1.1, pulseFreq: 2.8 },
        spawn: { attempts: 100, baseX: 20, baseZ: 20, exclusion: 4 }
    };

    const Shared = {
        mats: null,
        geoms: null,
        init() {
            if (this.mats) return;
            this.mats = {
                stalk: new THREE.MeshStandardMaterial({
                    color: CONFIG.color.stalk,
                    roughness: 0.85,
                    flatShading: true
                }),
                glow: new THREE.MeshStandardMaterial({
                    color: CONFIG.color.glow,
                    emissive: CONFIG.color.emissive,
                    emissiveIntensity: 1.6,
                    roughness: 0.3,
                    metalness: 0.1
                })
            };
            this.geoms = {
                stalk: new THREE.CylinderGeometry(0.03, 0.06, 0.7, 5).translate(0, 0.35, 0),
                branch: new THREE.CylinderGeometry(0.012, 0.025, 0.55, 4).translate(0, 0.275, 0),
                pod: new THREE.DodecahedronGeometry(0.08),
                crown: new THREE.SphereGeometry(0.13, 8, 8)
            };
        },
        dispose() {
            if (!this.mats) return;
            Object.values(this.mats).forEach(m => m.dispose());
            Object.values(this.geoms).forEach(g => g.dispose());
            this.mats = null;
            this.geoms = null;
        }
    };

    class Polyplant {
        #harvested = false;

        constructor(scene, x, z) {
            Shared.init();

            this.scene = scene;
            this.gridX = x;
            this.gridZ = z;
            this.scale = 0.01;
            this.timeOffset = Math.random() * 100;

            const wPos = typeof window.gridToWorld === 'function'
               ? window.gridToWorld(x, z)
                : { x: (x - CONFIG.spawn.baseX) * 2 + 1, z: (z - CONFIG.spawn.baseZ) * 2 + 1 };

            const terrainY = window.getTerrainHeight ? window.getTerrainHeight(wPos.x, wPos.z) : 0;
            this.position = new THREE.Vector3(wPos.x, terrainY, wPos.z);

            this.mesh = this.#buildMesh();
            this.mesh.position.copy(this.position);
            this.mesh.scale.setScalar(this.scale);
            this.scene.add(this.mesh);

            this.light = new THREE.PointLight(CONFIG.color.emissive, CONFIG.light.intensity, CONFIG.light.distance);
            this.light.position.set(this.position.x, terrainY + CONFIG.light.height, this.position.z);
            this.scene.add(this.light);
        }

        get isHarvested() { return this.#harvested; }

        #buildMesh() {
            const group = new THREE.Group();
            group.userData.isPolyplant = true;
            group.userData.polyplantInstance = this;

            const stalk = new THREE.Mesh(Shared.geoms.stalk, Shared.mats.stalk);
            stalk.castShadow = true;
            stalk.receiveShadow = true;
            group.add(stalk);

            this.branches = [];
            for (let i = 0; i < 4; i++) {
                const branch = new THREE.Mesh(Shared.geoms.branch, Shared.mats.stalk);
                branch.position.y = 0.25;

                const angle = (i / 4) * Math.PI * 2 + Math.random() * 0.15;
                branch.rotation.y = angle;
                branch.rotation.z = 0.45 + Math.random() * 0.25;

                const pod = new THREE.Mesh(Shared.geoms.pod, Shared.mats.glow);
                pod.position.y = 0.55;
                branch.add(pod);

                group.add(branch);
                this.branches.push(branch);
            }

            const crown = new THREE.Mesh(Shared.geoms.crown, Shared.mats.glow);
            crown.position.y = 0.7;
            group.add(crown);

            return group;
        }

        update(dt, time) {
            if (this.#harvested) return;

            if (this.scale < CONFIG.maxScale) {
                this.scale = Math.min(CONFIG.maxScale, this.scale + dt * CONFIG.growthRate);
                this.mesh.scale.setScalar(this.scale);
            }

            const t = time + this.timeOffset;
            this.mesh.rotation.z = Math.sin(t * CONFIG.sway.xFreq) * CONFIG.sway.xAmp;
            this.mesh.rotation.x = Math.cos(t * CONFIG.sway.zFreq) * CONFIG.sway.zAmp;

            if (this.light) {
                const pulse = 0.9 + 0.45 * Math.sin(t * CONFIG.sway.pulseFreq);
                this.light.intensity = pulse * this.scale;
            }
        }

        harvest() {
            if (this.#harvested) return;
            this.#harvested = true;

            this.scene.remove(this.mesh);
            if (this.light) this.scene.remove(this.light);

            this.mesh.traverse(child => {
                if (child.isMesh) {
                    // Geometries and materials are shared, do not dispose here
                    child.geometry = null;
                    child.material = null;
                }
            });
            this.light = null;
        }
    }

    window.Polyplant = Polyplant;

    window.spawnPolyplant = function(scene, grid, gridSize, cellTypes) {
        const { attempts, baseX, baseZ, exclusion } = CONFIG.spawn;

        for (let i = 0; i < attempts; i++) {
            const x = Math.floor(Math.random() * gridSize);
            const z = Math.floor(Math.random() * gridSize);

            if (grid[x]?.[z]!== cellTypes.EMPTY) continue;
            if (Math.abs(x - baseX) < exclusion && Math.abs(z - baseZ) < exclusion) continue;
            if (plants.some(p => p.gridX === x && p.gridZ === z)) continue;

            const plant = new Polyplant(scene, x, z);
            plants.push(plant);
            return plant;
        }
        return null;
    };

    window.updatePolyplants = function(dt) {
        const time = performance.now() * 0.001;
        for (let i = plants.length - 1; i >= 0; i--) {
            const p = plants[i];
            if (p.isHarvested) {
                plants.splice(i, 1);
                continue;
            }
            p.update(dt, time);
        }
    };

    window.clearPolyplants = function() {
        plants.forEach(p => p.harvest());
        plants.length = 0;
        Shared.dispose();
    };
})();