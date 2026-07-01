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
        uniform float offset;
        uniform float exponent;
        uniform float time;
        varying vec3 vWorldPosition;

        // Fractional noise helper
        float noise(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        // Smooth 2D noise for drifting clouds
        float smoothNoise(vec2 uv) {
            vec2 i = floor(uv);
            vec2 f = fract(uv);
            
            // Four corners in 2D of a tile
            float a = noise(i);
            float b = noise(i + vec2(1.0, 0.0));
            float c = noise(i + vec2(0.0, 1.0));
            float d = noise(i + vec2(1.0, 1.0));

            // Smooth interpolation
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
            // Compute vertical gradient mapping
            float h = normalize(vWorldPosition + offset).y;
            vec3 skyColor = mix(bottomColor, topColor, max(pow(max(h + 0.15, 0.0), exponent), 0.0));
            
            // Drifting multi-octave clouds using noise
            vec2 uv1 = vWorldPosition.xz * 0.005 + vec2(time * 0.003, time * 0.001);
            vec2 uv2 = vWorldPosition.xz * 0.012 - vec2(time * 0.001, time * 0.002);
            
            float n1 = smoothNoise(uv1);
            float n2 = smoothNoise(uv2);
            float cloudDensity = smoothstep(0.42, 0.75, (n1 * 0.6 + n2 * 0.4));

            // Colorize clouds with a subtle glowing edge
            vec3 cloudColor = vec3(0.04, 0.28, 0.16); // Bioluminescent green highlight
            vec3 finalColor = mix(skyColor, cloudColor, cloudDensity * 0.25 * max(h, 0.0));
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

    window.initSkybox = function(scene) {
        const skyGeo = new THREE.SphereGeometry(250, 32, 15);
        
        const skyUniforms = {
            topColor: { value: new THREE.Color(0x0a3b22) },     // Glowing deep jungle teal
            bottomColor: { value: new THREE.Color(0x010803) },  // Matches fogColor precisely
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
            update: function(deltaSeconds) {
                skyUniforms.time.value += deltaSeconds;
            }
        };
    };
})();
