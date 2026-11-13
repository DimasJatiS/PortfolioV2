/**
 * Block shell of the Home story (Spesifikasi Lanjutan 11.1–11.2).
 *
 * Every vertex carries its block's attributes (centre, explode offset, spin,
 * layer, seed, face, featured index). The vertex shader computes breathing,
 * exploding and the base-first reassembly from uniforms only, so the CPU does
 * no per-frame work and the whole shell is one draw call.
 */

const blockMotion = /* glsl */ `
  attribute vec3 aCenter;
  attribute vec3 aOffset;
  attribute vec3 aSpin;
  attribute float aLayer;
  attribute float aSeed;
  attribute float aFace;
  attribute float aFeatured;

  uniform float uTime;
  uniform float uBreath;
  uniform float uExplode;
  uniform float uAssemble;
  uniform float uCapLift;
  uniform vec3 uCapOffset;

  // Rodrigues rotation; the vector's length is the angle.
  vec3 rotateAxisAngle(vec3 v, vec3 axisAngle) {
    float angle = length(axisAngle);
    if (angle < 1e-5) return v;
    vec3 k = axisAngle / angle;
    return v * cos(angle) + cross(k, v) * sin(angle) + k * dot(k, v) * (1.0 - cos(angle));
  }

  // 0 when assembled, 1 when fully apart. Lower layers settle first (base up).
  float explodeAmount() {
    float settled = smoothstep(aLayer * 0.15, aLayer * 0.15 + 0.4, uAssemble);
    return uExplode * (1.0 - settled);
  }

  vec3 blockTranslation(float e) {
    vec3 outward = normalize(vec3(aCenter.x, aCenter.y * 0.35 + 0.1, aCenter.z));
    // Breathing: a 4 s cycle, each block out of phase with its neighbours.
    float breath = uBreath * (0.03 + 0.025 * sin(uTime * 1.5708 + aSeed * 6.2832));
    vec3 t = aOffset * e + outward * breath;
    if (aFace > 3.5) t += uCapOffset * uCapLift;
    return t;
  }
`;

export const blocksVertexShader = /* glsl */ `
  ${blockMotion}

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vRest;
  varying float vFace;
  varying float vFeatured;
  varying float vSeed;

  void main() {
    float e = explodeAmount();
    vec3 local = rotateAxisAngle(position - aCenter, aSpin * e);
    vec3 n = rotateAxisAngle(normal, aSpin * e);
    vec3 p = aCenter + local + blockTranslation(e);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    vViewPosition = -mvPosition.xyz;
    vNormal = normalize(normalMatrix * n);
    vRest = position;
    vFace = aFace;
    vFeatured = aFeatured;
    vSeed = aSeed;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const blocksFragmentShader = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uHigh;
  uniform vec3 uAccent;
  uniform float uDissolve;
  uniform float uFace;
  uniform float uFaceGlow;
  uniform vec3 uFocus;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vRest;
  varying float vFace;
  varying float vFeatured;
  varying float vSeed;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float valueNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
          mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
          mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }

  void main() {
    // Glass → wireframe: fragments under the threshold vanish; a thin bright
    // band runs along the dissolving front.
    float n = valueNoise(vRest * 3.0 + vSeed * 7.0);
    if (n < uDissolve) discard;
    float front = (1.0 - smoothstep(0.0, 0.06, n - uDissolve)) * step(0.001, uDissolve);

    vec3 N = normalize(vNormal);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(vViewPosition);
    float fresnel = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 2.0);
    float diffuse = 0.55 + 0.45 * dot(N, normalize(vec3(0.35, 0.85, 0.4)));

    vec3 color = mix(uBase, uHigh, clamp(diffuse * 0.7 + fresnel * 0.5, 0.0, 1.0));

    float onFace = (1.0 - step(0.5, abs(vFace - uFace))) * uFaceGlow;
    float focus = 0.0;
    if (vFeatured > 0.5) focus = vFeatured < 1.5 ? uFocus.x : (vFeatured < 2.5 ? uFocus.y : uFocus.z);
    color = mix(color, uAccent, onFace * 0.35 + focus * 0.12);
    color += uAccent * front * 1.2;

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

export const blockEdgesVertexShader = /* glsl */ `
  ${blockMotion}

  varying float vSeed;
  varying float vFace;

  void main() {
    float e = explodeAmount();
    vec3 local = rotateAxisAngle(position - aCenter, aSpin * e);
    vec3 p = aCenter + local + blockTranslation(e);
    vSeed = aSeed;
    vFace = aFace;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const blockEdgesFragmentShader = /* glsl */ `
  uniform vec3 uLine;
  uniform vec3 uGlow;
  uniform float uOpacity;
  uniform float uGlowAmount;
  uniform float uTime;
  uniform float uFace;
  uniform float uFaceGlow;

  varying float vSeed;
  varying float vFace;

  void main() {
    // Seams pulse out of phase, like light leaking between the blocks.
    float pulse = 0.5 + 0.5 * sin(uTime * 1.5708 + vSeed * 6.2832);
    vec3 color = mix(uLine, uGlow, uGlowAmount * pulse);
    float alpha = uOpacity * mix(1.0, 0.6 + 0.4 * pulse, uGlowAmount);

    // Faces: the active face lights up in the wireframe.
    float onFace = (1.0 - step(0.5, abs(vFace - uFace))) * uFaceGlow;
    color = mix(color, uGlow, onFace * 0.9);
    alpha = max(alpha, onFace);
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;
