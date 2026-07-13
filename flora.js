(function() {
    window.floraInstancedMeshes = [];
    window.floraObjects = []; // Keep for backward compatibility

    window.spawnBiomeFlora = function(scene, biomeName, grid_size, cell_size) {
        window.clearFlora(scene);
        console.log(`[Flora System] Spawning instanced scenery for biome: ${biomeName}`);

        const count = biomeName === 'mars' ? 12 : 35;
        const dummy = new THREE.Object3D();

        // Precompute random transforms
        const transforms = [];
        for (let i = 0; i < count; i++) {
            let gx, gz;
            if (Math.random() < 0.5) {
                gx = Math.random() < 0.5 ? Math.floor(Math.random() * 3) : Math.floor(grid_size - 1 - Math.random() * 3);
                gz = Math.floor(Math.random() * grid_size);
            } else {
                gx = Math.floor(Math.random() * grid_size);
                gz = Math.random() < 0.5 ? Math.floor(Math.random() * 3) : Math.floor(grid_size - 1 - Math.random() * 3);
            }

            const wx = (gx - grid_size / 2) * cell_size + cell_size / 2;
            const wz = (gz - grid_size / 2) * cell_size + cell_size / 2;
            const scale = 0.85 + Math.random() * 0.45;
            const rotY = Math.random() * Math.PI * 2;

            transforms.push({ x: wx, y: 0, z: wz, scale, rotY });
        }

        if (biomeName === 'volcanic') {
            // 3 sub-meshes: pipe, brackets (2 per pipe), valve
            const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6);
            pipeGeo.rotateZ(Math.PI / 2);
            const pipeMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, metalness: 0.8, roughness: 0.4 });
            const pipeMesh = new THREE.InstancedMesh(pipeGeo, pipeMat, count);
            pipeMesh.castShadow = true;
            pipeMesh.receiveShadow = true;

            const bracketGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 4);
            const bracketMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.95 });
            const bracketMesh = new THREE.InstancedMesh(bracketGeo, bracketMat, count * 2);
            bracketMesh.castShadow = true;

            const valveGeo = new THREE.TorusGeometry(0.04, 0.01, 4, 8);
            valveGeo.rotateX(Math.PI / 2);
            const valveMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
            const valveMesh = new THREE.InstancedMesh(valveGeo, valveMat, count);

            for (let i = 0; i < count; i++) {
                const t = transforms[i];

                // 1. Pipe
                dummy.position.set(t.x, 0.12, t.z);
                dummy.rotation.set(0, t.rotY, 0);
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                pipeMesh.setMatrixAt(i, dummy.matrix);

                // 2. Bracket Left
                dummy.position.set(-0.16 * t.scale, 0.075 * t.scale, 0);
                dummy.position.applyEuler(new THREE.Euler(0, t.rotY, 0));
                dummy.position.add(new THREE.Vector3(t.x, 0, t.z));
                dummy.rotation.set(0, t.rotY, 0);
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                bracketMesh.setMatrixAt(i * 2, dummy.matrix);

                // 3. Bracket Right
                dummy.position.set(0.16 * t.scale, 0.075 * t.scale, 0);
                dummy.position.applyEuler(new THREE.Euler(0, t.rotY, 0));
                dummy.position.add(new THREE.Vector3(t.x, 0, t.z));
                dummy.rotation.set(0, t.rotY, 0);
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                bracketMesh.setMatrixAt(i * 2 + 1, dummy.matrix);

                // 4. Valve
                dummy.position.set(0, 0.19 * t.scale, 0);
                dummy.position.applyEuler(new THREE.Euler(0, t.rotY, 0));
                dummy.position.add(new THREE.Vector3(t.x, 0, t.z));
                dummy.rotation.set(0, t.rotY, 0);
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                valveMesh.setMatrixAt(i, dummy.matrix);
            }

            scene.add(pipeMesh);
            scene.add(bracketMesh);
            scene.add(valveMesh);
            window.floraInstancedMeshes.push(pipeMesh, bracketMesh, valveMesh);

        } else if (biomeName === 'glacial') {
            // 2 sub-meshes: concrete block, snow top
            const blockGeo = new THREE.BoxGeometry(0.35, 0.22, 0.18);
            const blockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
            const blockMesh = new THREE.InstancedMesh(blockGeo, blockMat, count);
            blockMesh.castShadow = true;
            blockMesh.receiveShadow = true;

            const snowGeo = new THREE.BoxGeometry(0.365, 0.04, 0.19);
            const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
            const snowMesh = new THREE.InstancedMesh(snowGeo, snowMat, count);

            for (let i = 0; i < count; i++) {
                const t = transforms[i];

                // 1. Block
                dummy.position.set(t.x, 0.11 * t.scale, t.z);
                dummy.rotation.set(0, t.rotY, 0);
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                blockMesh.setMatrixAt(i, dummy.matrix);

                // 2. Snow
                dummy.position.set(0, 0.22 * t.scale, 0);
                dummy.position.applyEuler(new THREE.Euler(0, t.rotY, 0));
                dummy.position.add(new THREE.Vector3(t.x, 0, t.z));
                dummy.rotation.set(0, t.rotY, 0);
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                snowMesh.setMatrixAt(i, dummy.matrix);
            }

            scene.add(blockMesh);
            scene.add(snowMesh);
            window.floraInstancedMeshes.push(blockMesh, snowMesh);

        } else if (biomeName === 'mars') {
            // 4 sub-meshes for a highly detailed basalt cluster
            const colGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.0, 6);
            colGeo.translate(0, 0.5, 0); // Shift origin to base of column
            const basaltMat = new THREE.MeshStandardMaterial({ 
                color: 0x3d201b, // dusty Martian basalt color
                roughness: 0.9, 
                metalness: 0.15,
                flatShading: true 
            });

            const col1Mesh = new THREE.InstancedMesh(colGeo, basaltMat, count);
            col1Mesh.castShadow = true;
            col1Mesh.receiveShadow = true;

            const col2Mesh = new THREE.InstancedMesh(colGeo, basaltMat, count);
            col2Mesh.castShadow = true;
            col2Mesh.receiveShadow = true;

            const col3Mesh = new THREE.InstancedMesh(colGeo, basaltMat, count);
            col3Mesh.castShadow = true;
            col3Mesh.receiveShadow = true;

            const crystalGeo = new THREE.OctahedronGeometry(0.075, 0);
            const crystalMat = new THREE.MeshStandardMaterial({ 
                color: 0xffcca3, // matches light tint
                emissive: 0xf97316, // glowing orange
                emissiveIntensity: 1.0,
                roughness: 0.1,
                metalness: 0.8
            });
            const crystalMesh = new THREE.InstancedMesh(crystalGeo, crystalMat, count);
            crystalMesh.castShadow = true;

            for (let i = 0; i < count; i++) {
                const t = transforms[i];
                const terrainHeight = window.getTerrainHeight ? window.getTerrainHeight(t.x, t.z) : 0;

                // Column 1: Central vertical column
                dummy.position.set(t.x, terrainHeight, t.z);
                dummy.rotation.set(0.06 * Math.sin(t.x), t.rotY, 0.06 * Math.cos(t.z));
                dummy.scale.set(t.scale, t.scale * 1.5, t.scale);
                dummy.updateMatrix();
                col1Mesh.setMatrixAt(i, dummy.matrix);

                // Column 2: Leaning side column
                dummy.position.set(0, 0, 0);
                dummy.rotation.set(0.24, 0.0, 0.14);
                dummy.scale.set(0.72, 0.85, 0.72);
                dummy.updateMatrix();
                
                const m2 = new THREE.Matrix4().copy(dummy.matrix);
                dummy.position.set(t.x, terrainHeight, t.z);
                dummy.rotation.set(0.06 * Math.sin(t.x), t.rotY, 0.06 * Math.cos(t.z));
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                dummy.matrix.multiply(m2);
                col2Mesh.setMatrixAt(i, dummy.matrix);

                // Column 3: Secondary offset column
                dummy.position.set(0, 0, 0);
                dummy.rotation.set(-0.16, 0.0, -0.22);
                dummy.scale.set(0.68, 0.68, 0.68);
                dummy.updateMatrix();
                
                const m3 = new THREE.Matrix4().copy(dummy.matrix);
                dummy.position.set(t.x, terrainHeight, t.z);
                dummy.rotation.set(0.06 * Math.sin(t.x), t.rotY, 0.06 * Math.cos(t.z));
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                dummy.matrix.multiply(m3);
                col3Mesh.setMatrixAt(i, dummy.matrix);

                // Crystal: Glowing core floating in the center fork
                dummy.position.set(0, 0.72 * t.scale, 0);
                dummy.position.applyEuler(new THREE.Euler(0.06 * Math.sin(t.x), t.rotY, 0.06 * Math.cos(t.z)));
                dummy.position.add(new THREE.Vector3(t.x, terrainHeight, t.z));
                dummy.rotation.set(t.rotY, t.rotY * 0.5, 0);
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                crystalMesh.setMatrixAt(i, dummy.matrix);
            }

            scene.add(col1Mesh);
            scene.add(col2Mesh);
            scene.add(col3Mesh);
            scene.add(crystalMesh);
            window.floraInstancedMeshes.push(col1Mesh, col2Mesh, col3Mesh, crystalMesh);

        } else if (biomeName === 'desert') {
            // 1 sub-mesh: trap beams (3 instances per trap)
            const beamGeo = new THREE.BoxGeometry(0.04, 0.04, 0.45);
            const beamMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.95, roughness: 0.2 });
            const trapMesh = new THREE.InstancedMesh(beamGeo, beamMat, count * 3);
            trapMesh.castShadow = true;

            for (let i = 0; i < count; i++) {
                const t = transforms[i];

                // Beam 1
                dummy.position.set(0, 0.15 * t.scale, 0);
                dummy.position.add(new THREE.Vector3(t.x, 0, t.z));
                dummy.rotation.set(0.6, t.rotY + 0.6, 0);
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                trapMesh.setMatrixAt(i * 3, dummy.matrix);

                // Beam 2
                dummy.position.set(0, 0.15 * t.scale, 0);
                dummy.position.add(new THREE.Vector3(t.x, 0, t.z));
                dummy.rotation.set(-0.6, t.rotY + 0.6, 0);
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                trapMesh.setMatrixAt(i * 3 + 1, dummy.matrix);

                // Beam 3
                dummy.position.set(0, 0.15 * t.scale, 0);
                dummy.position.add(new THREE.Vector3(t.x, 0, t.z));
                dummy.rotation.set(0, t.rotY, Math.PI / 4);
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                trapMesh.setMatrixAt(i * 3 + 2, dummy.matrix);
            }

            scene.add(trapMesh);
            window.floraInstancedMeshes.push(trapMesh);

        } else { // jungle
            // 4 sub-meshes: camo crate, metal band, oil barrel, yellow stripe
            const crateGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
            const crateMat = new THREE.MeshStandardMaterial({ color: 0x2d3a22, roughness: 0.75, metalness: 0.25 });
            const crateMesh = new THREE.InstancedMesh(crateGeo, crateMat, count);
            crateMesh.castShadow = true;
            crateMesh.receiveShadow = true;

            const bandGeo = new THREE.BoxGeometry(0.255, 0.03, 0.255);
            const bandMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.25 });
            const bandMesh = new THREE.InstancedMesh(bandGeo, bandMat, count);

            const barrelGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.32, 8);
            const barrelMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.8, roughness: 0.3 });
            const barrelMesh = new THREE.InstancedMesh(barrelGeo, barrelMat, count);
            barrelMesh.castShadow = true;
            barrelMesh.receiveShadow = true;

            const stripeGeo = new THREE.CylinderGeometry(0.092, 0.092, 0.04, 8);
            const stripeMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
            const stripeMesh = new THREE.InstancedMesh(stripeGeo, stripeMat, count);

            for (let i = 0; i < count; i++) {
                const t = transforms[i];

                // 1. Crate
                dummy.position.set(-0.06 * t.scale, 0.12 * t.scale, 0.06 * t.scale);
                dummy.position.applyEuler(new THREE.Euler(0, t.rotY, 0));
                dummy.position.add(new THREE.Vector3(t.x, 0, t.z));
                dummy.rotation.set(0, t.rotY, 0);
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                crateMesh.setMatrixAt(i, dummy.matrix);

                // 2. Band
                dummy.position.set(-0.06 * t.scale, 0.12 * t.scale, 0.06 * t.scale);
                dummy.position.applyEuler(new THREE.Euler(0, t.rotY, 0));
                dummy.position.add(new THREE.Vector3(t.x, 0, t.z));
                dummy.rotation.set(0, t.rotY, 0);
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                bandMesh.setMatrixAt(i, dummy.matrix);

                // 3. Barrel
                dummy.position.set(0.1 * t.scale, 0.16 * t.scale, -0.06 * t.scale);
                dummy.position.applyEuler(new THREE.Euler(0, t.rotY, 0));
                dummy.position.add(new THREE.Vector3(t.x, 0, t.z));
                dummy.rotation.set(0, t.rotY, 0);
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                barrelMesh.setMatrixAt(i, dummy.matrix);

                // 4. Stripe
                dummy.position.set(0.1 * t.scale, 0.16 * t.scale, -0.06 * t.scale);
                dummy.position.applyEuler(new THREE.Euler(0, t.rotY, 0));
                dummy.position.add(new THREE.Vector3(t.x, 0, t.z));
                dummy.rotation.set(0, t.rotY, 0);
                dummy.scale.set(t.scale, t.scale, t.scale);
                dummy.updateMatrix();
                stripeMesh.setMatrixAt(i, dummy.matrix);
            }

            scene.add(crateMesh);
            scene.add(bandMesh);
            scene.add(barrelMesh);
            scene.add(stripeMesh);
            window.floraInstancedMeshes.push(crateMesh, bandMesh, barrelMesh, stripeMesh);
        }
    };

    window.clearFlora = function(scene) {
        window.floraInstancedMeshes.forEach(obj => {
            scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        window.floraInstancedMeshes.length = 0;
    };

    window.updateFlora = function(dt) {
        // Instanced meshes are highly optimized and statically drawn on the GPU, requiring zero CPU update overhead.
    };
})();
