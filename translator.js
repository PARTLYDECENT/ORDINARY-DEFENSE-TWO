(function() {
    let grid_size = 40;
    let cell_size = 2.0;
    let half_grid = (grid_size * cell_size) / 2;

    const cache = [];
    const pool = [];

    window.Translator = {
        init(size, cellSize) {
            grid_size = size;
            cell_size = cellSize;
            half_grid = (size * cellSize) / 2;

            // Warm up coordinate cache
            cache.length = 0;
            for (let x = 0; x < size; x++) {
                cache[x] = [];
                for (let z = 0; z < size; z++) {
                    cache[x][z] = {
                        x: (x - size / 2) * cellSize + cellSize / 2,
                        z: (z - size / 2) * cellSize + cellSize / 2
                    };
                }
            }

            // Warm up vector pool to eliminate GC allocations
            pool.length = 0;
            for (let i = 0; i < 200; i++) {
                pool.push(new THREE.Vector3());
            }
            console.log(`[Translator] Warm-up complete. Grid size: ${size}x${size}. Vector pool capacity: ${pool.length}`);
        },

        gridToWorld(x, z) {
            if (x >= 0 && x < grid_size && z >= 0 && z < grid_size) {
                return cache[x][z];
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

        acquireVector(x = 0, y = 0, z = 0) {
            let v = pool.pop();
            if (!v) {
                v = new THREE.Vector3();
            }
            v.set(x, y, z);
            return v;
        },

        releaseVector(v) {
            if (v && pool.length < 500) {
                pool.push(v);
            }
        },

        // Manual matrix update helpers (reduces CPU matrix calculations in animate loops)
        optimizeMesh(mesh) {
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            mesh.traverse(child => {
                child.matrixAutoUpdate = false;
                child.updateMatrix();
            });
        },

        updateMeshTransform(mesh, px, py, pz, rx, ry, rz) {
            if (px !== undefined) mesh.position.set(px, py, pz);
            if (rx !== undefined) mesh.rotation.set(rx, ry, rz);
            mesh.updateMatrix();
        }
    };
})();
