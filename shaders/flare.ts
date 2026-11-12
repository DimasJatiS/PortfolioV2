/**
 * Apex flare: an ivory core inside an orange glow with a faint horizontal
 * streak, breathing once every four seconds (PRD 7.1).
 */
export const flareVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const flareFragmentShader = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uGlow;
  uniform float uTime;
  uniform float uIntensity;

  varying vec2 vUv;

  const float PULSE_SECONDS = 4.0;
  const float TAU = 6.28318530718;

  void main() {
    vec2 p = vUv - 0.5;
    float dist = length(p) * 2.0;

    float pulse = 0.86 + 0.14 * sin(uTime * TAU / PULSE_SECONDS);
    float core = smoothstep(0.14, 0.0, dist);
    float glow = pow(max(0.0, 1.0 - dist), 2.8) * pulse;
    float streak = exp(-abs(p.y) * 110.0) * exp(-abs(p.x) * 6.0) * 0.55 * pulse;

    vec3 color = mix(uGlow, uCore, clamp(core + streak * 0.6, 0.0, 1.0));
    float alpha = clamp((glow * 0.85 + core + streak) * uIntensity, 0.0, 1.0);
    if (alpha < 0.003) discard;

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;
