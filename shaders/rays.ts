/**
 * Hairline rays: 1px lines from the apex to the base that draw themselves in
 * sequence. `aT` runs 0 (apex) → 1 (base); `aIndex` is the ray's 0..1 position
 * in the stagger order.
 */
export const raysVertexShader = /* glsl */ `
  attribute float aT;
  attribute float aIndex;

  uniform float uProgress;
  uniform float uStagger;
  uniform vec2 uPointer;

  varying float vT;
  varying float vReveal;

  void main() {
    vT = aT;
    // Each ray starts a little after the previous one and takes the rest of the timeline.
    vReveal = clamp((uProgress - aIndex * uStagger) / max(1.0 - uStagger, 0.0001), 0.0, 1.0);

    vec3 transformed = position;
    // The base end leans a touch towards the cursor; the apex stays put.
    transformed.xz += uPointer * 0.05 * aT;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

export const raysFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vT;
  varying float vReveal;

  void main() {
    float drawn = 1.0 - smoothstep(vReveal - 0.03, vReveal + 0.0005, vT);
    float falloff = mix(1.0, 0.3, vT);
    float alpha = drawn * falloff * uOpacity;
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;
