(function() {
    let grid_size = 40;
    let cell_size = 2.0;
    let half_grid = (grid_size * cell_size) / 2;

    // Pre-allocated object pools to eliminate Garbage Collection (GC) thread thrashing
    const vectorPool = [];
    const quatPool = [];
    const eulerPool = [];
    
    // Cached grid lookups to eliminate runtime calculations
    const coordCache = [];
    const neighbors8Cache = Array(grid_size).fill(null).map(() => Array(grid_size).fill(null));
    const neighbors4Cache = Array(grid_size).fill(null).map(() => Array(grid_size).fill(null));

    window.Translator = {
        init(size, cellSize) {
            grid_size = size;
            cell_size = cellSize;
            half_grid = (size * cellSize) / 2;

            // 1. Warm up coordinate cache
            coordCache.length = 0;
            for (let x = 0; x < size; x++) {
                coordCache[x] = [];
                for (let z = 0; z < size; z++) {
                    coordCache[x][z] = {
                        x: (x - size / 2) * cellSize + cellSize / 2,
                        z: (z - size / 2) * cellSize + cellSize / 2
                    };
                }
            }

            // 2. Pre-calculate neighbor grids to eliminate array allocations in loops
            const dx8 = [1, -1, 0, 0, 1, -1, 1, -1];
            const dz8 = [0, 0, 1, -1, 1, -1, -1, 1];
            const cost8 = [1.0, 1.0, 1.0, 1.0, 1.414, 1.414, 1.414, 1.414];

            const dx4 = [1, -1, 0, 0];
            const dz4 = [0, 0, 1, -1];

            for (let x = 0; x < size; x++) {
                for (let z = 0; z < size; z++) {
                    // 8-directional neighbors (with pre-calculated weights)
                    const n8 = [];
                    for (let i = 0; i < 8; i++) {
                        const nx = x + dx8[i];
                        const nz = z + dz8[i];
                        if (nx >= 0 && nx < size && nz >= 0 && nz < size) {
                            n8.push({ x: nx, z: nz, dx: dx8[i], dz: dz8[i], cost: cost8[i] });
                        }
                    }
                    neighbors8Cache[x][z] = n8;

                    // 4-directional neighbors
                    const n4 = [];
                    for (let i = 0; i < 4; i++) {
                        const nx = x + dx4[i];
                        const nz = z + dz4[i];
                        if (nx >= 0 && nx < size && nz >= 0 && nz < size) {
                            n4.push({ x: nx, z: nz, dx: dx4[i], dz: dz4[i] });
                        }
                    }
                    neighbors4Cache[x][z] = n4;
                }
            }

            // 3. Warm up object pools
            vectorPool.length = 0;
            for (let i = 0; i < 600; i++) {
                vectorPool.push(new THREE.Vector3());
            }

            quatPool.length = 0;
            for (let i = 0; i < 150; i++) {
                quatPool.push(new THREE.Quaternion());
            }

            eulerPool.length = 0;
            for (let i = 0; i < 150; i++) {
                eulerPool.push(new THREE.Euler());
            }

            console.log(`[Translator] Warm-up complete. Grid: ${size}x${size}. VectorPool: ${vectorPool.length}, QuatPool: ${quatPool.length}, EulerPool: ${eulerPool.length}`);
        },

        gridToWorld(x, z) {
            if (x >= 0 && x < grid_size && z >= 0 && z < grid_size) {
                return coordCache[x][z];
            }
            // Math fallback for out of bounds coords
            return {
                x: (x - grid_size / 2) * cell_size + cell_size / 2,
                z: (z - grid_size / 2) * cell_size + cell_size / 2
            };
        },

        worldToGrid(wx, wz, target = { x: 0, z: 0 }) {
            target.x = Math.floor((wx + half_grid) / cell_size);
            target.z = Math.floor((wz + half_grid) / cell_size);
            return target;
        },

        // --- NEIGHBOR GETTERS (Zero Allocation) ---
        getNeighbors8(x, z) {
            return neighbors8Cache[x][z] || [];
        },

        getNeighbors4(x, z) {
            return neighbors4Cache[x][z] || [];
        },

        // --- POOLED OBJECT LIFECYCLE ---
        acquireVector(x = 0, y = 0, z = 0) {
            let v = vectorPool.pop();
            if (!v) {
                v = new THREE.Vector3();
            }
            v.set(x, y, z);
            return v;
        },

        releaseVector(v) {
            if (v && vectorPool.length < 1000) {
                vectorPool.push(v);
            }
        },

        acquireQuaternion() {
            let q = quatPool.pop();
            if (!q) {
                q = new THREE.Quaternion();
            }
            q.identity();
            return q;
        },

        releaseQuaternion(q) {
            if (q && quatPool.length < 300) {
                quatPool.push(q);
            }
        },

        acquireEuler(x = 0, y = 0, z = 0) {
            let e = eulerPool.pop();
            if (!e) {
                e = new THREE.Euler();
            }
            e.set(x, y, z);
            return e;
        },

        releaseEuler(e) {
            if (e && eulerPool.length < 300) {
                eulerPool.push(e);
            }
        },

        // --- MESH MATRIX OPTIMIZATIONS (Saves CPU Thread Render Calculations) ---
        optimizeMesh(mesh) {
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            mesh.traverse(child => {
                child.matrixAutoUpdate = false;
                child.updateMatrix();
            });
        },

        // Sets up a moving mesh to bypass Three.js auto-matrix updating
        optimizeMovingMesh(mesh) {
            mesh.matrixAutoUpdate = false;
            mesh.traverse(child => {
                child.matrixAutoUpdate = false;
            });
        },

        updateMeshTransform(mesh, px, py, pz, rx, ry, rz) {
            if (px !== undefined) mesh.position.set(px, py, pz);
            if (rx !== undefined) mesh.rotation.set(rx, ry, rz);
            mesh.updateMatrix();
        }
    };
})();
