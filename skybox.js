(function() {
    const vertexShader = `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 skyCloudColor;
        uniform float offset;
        uniform float exponent;
        uniform float time;
        varying vec3 vWorldPosition;

        // Pseudo-random hash
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        // 2D Bilinear Noise
        float noise2d(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                       mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
        }

        // Fractal Brownian Motion (FBM) for realistic dust cloud patterns
        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            // Rotate layers to reduce grid artifacts
            mat2 rot = mat2(0.87758, 0.47942, -0.47942, 0.87758);
            for (int i = 0; i < 4; ++i) {
                v += a * noise2d(p);
                p = rot * p * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }

        void main() {
            // Compute vertical gradient mapping
            float h = normalize(vWorldPosition + offset).y;
            vec3 skyColor = mix(bottomColor, topColor, max(pow(max(h + 0.15, 0.0), exponent), 0.0));
            
            // Animated coordinate grid drifting over time
            vec2 gridUv = fract(vWorldPosition.xz * 0.004 + vec2(time * 0.08, time * 0.03));
            
            // Generate grid lines
            float thickness = 0.035;
            float gridX = smoothstep(thickness, 0.0, gridUv.x) + smoothstep(1.0 - thickness, 1.0, gridUv.x);
            float gridY = smoothstep(thickness, 0.0, gridUv.y) + smoothstep(1.0 - thickness, 1.0, gridUv.y);
            float gridLine = max(gridX, gridY);

            // Pulsing ripple wave propagation radiating from the zenith
            float distFromZenith = length(vWorldPosition.xz) * 0.004;
            float pulseWave = sin(distFromZenith - time * 1.5) * 0.5 + 0.5;
            
            // Active glowing grid strength
            float gridStrength = gridLine * (0.15 + pulseWave * 0.45);

            // Procedural drifting Martian dust clouds
            vec2 cloudUv = vWorldPosition.xz * 0.0008 + vec2(time * 0.012, time * 0.006);
            float dustNoise = fbm(cloudUv * 3.0 + fbm(cloudUv * 1.5));
            float dustCloud = smoothstep(0.38, 0.78, dustNoise) * 0.48;

            // Blend grid color and drifting dust cloud details with sky background, fading towards horizon
            vec3 finalColor = mix(skyColor, skyCloudColor, (gridStrength + dustCloud) * max(h, 0.0));
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

    window.initSkybox = function(scene) {
        const skyGeo = new THREE.SphereGeometry(2500, 32, 15);
        
        const skyUniforms = {
            topColor: { value: new THREE.Color(0x0a3b22) },     // Glowing deep jungle teal
            bottomColor: { value: new THREE.Color(0x010803) },  // Matches fogColor precisely
            skyCloudColor: { value: new THREE.Color(0x042816) }, // Bioluminescent green highlight
            offset: { value: 15 },
            exponent: { value: 1.4 },
            time: { value: 0 }
        };

        const skyMat = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: skyUniforms,
            side: THREE.BackSide,
            depthWrite: false
        });

        const skyMesh = new THREE.Mesh(skyGeo, skyMat);
        scene.add(skyMesh);

        return {
            mesh: skyMesh,
            uniforms: skyUniforms,
            update: function(deltaSeconds) {
                skyUniforms.time.value += deltaSeconds;
            }
        };
    };
})();
