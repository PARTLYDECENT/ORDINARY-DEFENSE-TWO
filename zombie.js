(function() {
    if (typeof window.ScarabEnemy === 'undefined') {
        console.error("ZombieEnemy requires base enemy classes to be loaded first.");
        return;
    }

    // --- SHADER DEFINITIONS ---

    const sdfVertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const sdfFragmentShader = `
        uniform float u_time;
        uniform vec3 u_cameraPos;
        uniform float u_decay;
        uniform vec3 u_albedo;
        
        varying vec2 vUv;

        #define MAX_STEPS 60
        #define MAX_DIST 20.0
        #define SURF_DIST 0.005

        // --- SDF Primitive Functions ---
        float sdSphere(vec3 p, float s) {
            return length(p) - s;
        }

        float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
            vec3 pa = p - a, ba = b - a;
            float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            return length(pa - ba * h) - r;
        }

        float sdBox(vec3 p, vec3 b) {
            vec3 q = abs(p) - b;
            return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
        }

        // --- CSG Boolean Operations ---
        float opSmoothUnion(float d1, float d2, float k) {
            float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
            return mix(d2, d1, h) - k * h * (1.0 - h);
        }

        float opSmoothSubtraction(float d1, float d2, float k) {
            float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
            return mix(d2, -d1, h) + k * h * (1.0 - h);
        }

        // 3D Noise for rot/decay
        float hash(vec3 p) {
            p = fract(p * 0.3183099 + .1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        
        float noise(vec3 x) {
            vec3 i = floor(x);
            vec3 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                           mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                       mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                           mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }

        // --- Scene Map ---
        vec2 map(vec3 p) {
            vec2 res = vec2(MAX_DIST, 0.0); 

            // Animation variables
            float walkCycle = u_time * 5.0;
            float legRot = sin(walkCycle) * 0.5;
            float armRot = cos(walkCycle) * 0.15;
            float headBob = abs(sin(walkCycle * 2.0)) * 0.04;

            // Base offset (adjusted center of gravity to keep feet on floor at p.y = 0.0)
            vec3 zp = p - vec3(0.0, 1.0 + headBob, 0.0);
            
            // 1. Head (Realistic scale, elongated)
            vec3 headPos = zp - vec3(0.0, 0.85, 0.0);
            headPos.x += sin(u_time)*0.03; 
            float head = sdCapsule(headPos, vec3(0.0, 0.0, 0.0), vec3(0.0, 0.15, 0.0), 0.22);

            // Decay/Noise subtraction on head
            float rotNoise = noise(headPos * 12.0) * u_decay;
            head += rotNoise;

            // Eyes (Subtracted, scaled down for real cranium size)
            vec3 eyeRPos = headPos - vec3(0.08, 0.08, 0.18);
            vec3 eyeLPos = headPos - vec3(-0.08, 0.08, 0.18);
            float eyes = min(sdSphere(eyeRPos, 0.035), sdSphere(eyeLPos, 0.035));
            head = opSmoothSubtraction(eyes, head, 0.05);

            // Jaw/Mouth (Subtracted)
            vec3 mouthPos = headPos - vec3(0.0, -0.08, 0.2);
            float mouth = sdBox(mouthPos, vec3(0.08, 0.03, 0.08));
            head = max(head, -mouth); // Hard subtraction for gaping maw

            // 2. Torso (Leaner, longer)
            float torso = sdCapsule(zp, vec3(0.0, -0.1, 0.0), vec3(0.0, 0.7, 0.0), 0.24);

            // 3. Legs (Longer, realistic thickness)
            vec3 legR_start = vec3(0.12, -0.1, 0.0);
            vec3 legR_end = vec3(0.12, -0.9, legRot * 0.7);
            float legR = sdCapsule(zp, legR_start, legR_end, 0.1);

            vec3 legL_start = vec3(-0.12, -0.1, 0.0);
            vec3 legL_end = vec3(-0.12, -0.9, -legRot * 0.7);
            float legL = sdCapsule(zp, legL_start, legL_end, 0.1);

            // 4. Arms (Thinner, outstretched)
            vec3 armR_start = vec3(0.32, 0.6, 0.0);
            vec3 armR_end = vec3(0.35, 0.55 + armRot, 0.65);
            float armR = sdCapsule(zp, armR_start, armR_end, 0.08);

            vec3 armL_start = vec3(-0.32, 0.6, 0.0);
            vec3 armL_end = vec3(-0.35, 0.55 - armRot, 0.65);
            float armL = sdCapsule(zp, armL_start, armL_end, 0.08);

            // Blend Body Parts
            float body = opSmoothUnion(torso, legR, 0.15);
            body = opSmoothUnion(body, legL, 0.15);
            body = opSmoothUnion(body, armR, 0.1);
            body = opSmoothUnion(body, armL, 0.1);
            
            float zombie = opSmoothUnion(body, head, 0.15);

            res = vec2(zombie, 1.0); // Zombie ID

            return res;
        }

        // --- Raymarching ---
        vec2 rayMarch(vec3 ro, vec3 rd) {
            float dO = 0.0;
            float matID = 0.0;
            for(int i = 0; i < MAX_STEPS; i++) {
                vec3 p = ro + rd * dO;
                vec2 dS = map(p);
                dO += dS.x;
                matID = dS.y;
                if(dO > MAX_DIST || abs(dS.x) < SURF_DIST) break;
            }
            return vec2(dO, matID);
        }

        // --- Normal Calculation via Finite Differences ---
        vec3 getNormal(vec3 p) {
            float d = map(p).x;
            vec2 e = vec2(0.01, 0.0);
            vec3 n = d - vec3(
                map(p - e.xyy).x,
                map(p - e.yxy).x,
                map(p - e.yyx).x
            );
            return normalize(n);
        }

        void main() {
            vec3 ro = u_cameraPos;
            vec3 rd = normalize(vec3(vUv.x, vUv.y, 1.0)); // Simplified ray direction

            vec2 rm = rayMarch(ro, rd);
            float d = rm.x;

            if(d > MAX_DIST) {
                discard;
            }

            vec3 p = ro + rd * d;
            vec3 n = getNormal(p);

            // Lighting
            vec3 lightPos = vec3(5.0, 8.0, 5.0);
            vec3 l = normalize(lightPos - p);
            vec3 v = normalize(u_cameraPos - p);
            
            float diffuse = max(dot(n, l), 0.0);
            
            // SSS Approximation
            float wrap = 0.4;
            float diffuseSSS = max(0.0, (dot(n, l) + wrap) / (1.0 + wrap));
            vec3 sssColor = vec3(0.8, 0.2, 0.1) * pow(clamp(1.0 - dot(v, n), 0.0, 1.0), 3.0);

            vec3 col = u_albedo * diffuseSSS + sssColor * 0.5;

            gl_FragColor = vec4(col, 1.0);
        }
    `;

    window.ZombieEnemy = class ZombieEnemy extends ScarabEnemy {
        constructor(spawnPoint) {
            // Call the parent constructor but we will override the mesh
            super(spawnPoint);

            // Clean up the mesh created by the parent
            if (this.mesh) {
                scene.remove(this.mesh);
            }

            this.levelScalar = 1.0 + (gameState.wave - 1) * 0.25;
            this.maxHp = Math.round(ENEMY_SPECS.hp * this.levelScalar * 1.2); // Tougher
            this.speed = (ENEMY_SPECS.speed + (gameState.wave * 0.05)) * 0.8; // Slower
            this.hp = this.maxHp;

            this.mesh = this.buildMesh();
            this.mesh.position.copy(this.position);
            scene.add(this.mesh);
        }

        buildMesh() {
            const group = new THREE.Group();

            // The SDF will be rendered on this plane.
            // The plane acts as a "viewport" for the raymarched zombie.
            const geometry = new THREE.PlaneGeometry(3, 3); 
            const material = new THREE.ShaderMaterial({
                vertexShader: sdfVertexShader,
                fragmentShader: sdfFragmentShader,
                uniforms: {
                    u_time: { value: 0.0 },
                    u_cameraPos: { value: new THREE.Vector3(0, 1.5, -3.0) }, // Virtual camera for SDF
                    u_decay: { value: 0.05 },
                    u_albedo: { value: new THREE.Vector3(0.3, 0.8, 0.4) } // Sickly green
                },
                transparent: true
            });

            this.shaderMaterial = material;
            const sdfPlane = new THREE.Mesh(geometry, material);
            sdfPlane.position.y = 1.5; // Center the plane vertically
            group.add(sdfPlane);

            // Add HP bar from parent, but adjust position for the new mesh
            const barBackGeo = new THREE.PlaneGeometry(0.7, 0.08);
            const barBackMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
            this.hpBack = new THREE.Mesh(barBackGeo, barBackMat);
            this.hpBack.position.y = 2.8; // Position above the SDF plane
            group.add(this.hpBack);

            const barFillGeo = new THREE.PlaneGeometry(0.7, 0.08);
            this.hpFillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
            this.hpFill = new THREE.Mesh(barFillGeo, this.hpFillMat);
            this.hpFill.position.set(0, 2.8, 0.01);
            group.add(this.hpFill);

            return group;
        }

        update(dt) {
            // Call parent update for movement, HP bar, etc.
            // We need to temporarily bypass the leg animation part as it's not relevant.
            const originalLegs = this.legs;
            this.legs = []; // Prevent errors in parent update
            super.update(dt);
            this.legs = originalLegs; // Restore

            // Update shader time for walking animation
            if (this.shaderMaterial) {
                this.shaderMaterial.uniforms.u_time.value += dt * this.speed * 0.5;
            }

            // Make the SDF plane always face the main game camera
            if (this.mesh) {
                this.mesh.lookAt(camera.position);
            }
        }

        // Override takeDamage to handle flash effect on shader if needed
        takeDamage(dmg) {
            super.takeDamage(dmg);
            if (this.shaderMaterial) {
                // Flash red
                this.shaderMaterial.uniforms.u_albedo.value.set(1.0, 0.2, 0.2);
                setTimeout(() => {
                    if (this.shaderMaterial) { // Check if it hasn't been destroyed
                       this.shaderMaterial.uniforms.u_albedo.value.set(0.3, 0.8, 0.4);
                    }
                }, 120);
            }
        }
    };
})();