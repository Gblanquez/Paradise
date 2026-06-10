const SELECTORS = {
  parent: '.why-parent',
  canvas: '.why-gradient-canvas',
}

const VERTEX_SHADER = `
precision highp float;

attribute vec2 a_position;
attribute vec2 a_uv;

uniform float u_time;
uniform float u_seed;

varying vec2 v_uv;

void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_seed;

varying vec2 v_uv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float filmGrain(vec2 p, float time, float seed) {
  vec2 q = p + vec2(seed * 17.17, time * 83.31);
  float a = fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453123);
  float b = fract(sin(dot(q + vec2(23.4, 91.7), vec2(269.5, 183.3))) * 24634.6345);
  float c = fract(sin(dot(q * mat2(0.8, -0.6, 0.6, 0.8), vec2(419.2, 371.9))) * 15731.7431);

  return (a + b + c) / 3.0 - 0.5;
}

vec2 gradient(vec2 p) {
  float angle = hash(p) * 6.28318530718;

  return vec2(cos(angle), sin(angle));
}

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;

  return 130.0 * dot(m, g);
}

float perlin(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  float a = dot(gradient(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
  float b = dot(gradient(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(gradient(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(gradient(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 0.5 + 0.5;
}

vec2 skew(vec2 st) {
  vec2 r = vec2(0.0);

  r.x = 1.1547 * st.x;
  r.y = st.y + 0.5 * r.x;

  return r;
}

float simplex(vec2 st) {
  vec2 i = floor(skew(st));
  vec2 x0 = st - vec2(i.x * 0.8660254, i.y - i.x * 0.5);
  vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec2 x1 = x0 - i1 + vec2(0.8660254, 0.5);
  vec2 x2 = x0 - vec2(0.0, 1.0) + vec2(1.7320508, 0.0);

  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
  m = m * m;
  m = m * m;

  vec3 n = vec3(
    dot(gradient(i), x0),
    dot(gradient(i + i1), x1),
    dot(gradient(i + 1.0), x2)
  );

  return clamp(dot(m, n) * 24.0 + 0.5, 0.0, 1.0);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 5; i++) {
    value += amplitude * simplex(p);
    p *= 2.01;
    amplitude *= 0.5;
  }

  return value;
}

vec3 brandGradient(float t) {
  vec3 c0 = vec3(0.788, 0.961, 1.000);
  vec3 c1 = vec3(0.482, 0.714, 1.000);
  vec3 c2 = vec3(0.071, 0.078, 0.129);
  vec3 c3 = vec3(0.008, 0.000, 0.000);
  vec3 c4 = vec3(0.090, 0.000, 0.000);
  vec3 c5 = vec3(0.851, 0.271, 0.125);
  vec3 c6 = vec3(0.875, 0.361, 0.651);
  vec3 c7 = vec3(0.851, 0.549, 1.000);
  vec3 c8 = vec3(0.067, 0.063, 0.094);
  vec3 c9 = vec3(0.949, 0.553, 0.702);
  vec3 c10 = vec3(0.180, 0.557, 0.969);

  vec3 color = mix(c0, c1, smoothstep(0.00, 0.13, t));
  color = mix(color, c2, smoothstep(0.13, 0.29, t));
  color = mix(color, c3, smoothstep(0.29, 0.34, t));
  color = mix(color, c4, smoothstep(0.34, 0.39, t));
  color = mix(color, c5, smoothstep(0.39, 0.57, t));
  color = mix(color, c6, smoothstep(0.57, 0.68, t));
  color = mix(color, c7, smoothstep(0.68, 0.75, t));
  color = mix(color, c8, smoothstep(0.75, 0.85, t));
  color = mix(color, c9, smoothstep(0.85, 0.91, t));
  color = mix(color, c10, smoothstep(0.91, 1.00, t));

  return color;
}

vec3 meshPalette(float t, float seed) {
  vec3 cyan = vec3(0.788, 0.961, 1.000);
  vec3 lightBlue = vec3(0.482, 0.714, 1.000);
  vec3 electricBlue = vec3(0.180, 0.557, 0.969);
  vec3 deepBlue = vec3(0.071, 0.078, 0.129);
  vec3 red = vec3(0.851, 0.271, 0.125);
  vec3 pink = vec3(0.875, 0.361, 0.651);
  vec3 violet = vec3(0.851, 0.549, 1.000);
  vec3 black = vec3(0.008, 0.000, 0.000);

  float palette = fract(sin(seed * 1.371) * 43758.5453);
  vec3 a = cyan;
  vec3 b = electricBlue;
  vec3 c = deepBlue;

  if (palette > 0.66) {
    a = red;
    b = pink;
    c = violet;
  } else if (palette > 0.33) {
    a = lightBlue;
    b = violet;
    c = electricBlue;
  }

  vec3 color = mix(a, b, smoothstep(0.08, 0.64, t));
  color = mix(color, c, smoothstep(0.56, 1.0, t));

  return mix(black, color, 0.96);
}

vec3 brandPalette(float t) {
  return brandGradient(clamp(t, 0.0, 1.0));
}

vec3 rangedBrandPalette(float t, float seed) {
  vec3 cyan = brandPalette(0.00);
  vec3 warm = brandPalette(0.57);
  vec3 pink = brandPalette(0.68);
  vec3 violet = brandPalette(0.75);
  vec3 blue = brandPalette(1.00);
  vec3 color = mix(cyan, warm, smoothstep(0.0, 0.38, t));

  color = mix(color, warm, smoothstep(0.28, 0.58, t) * 0.58);
  color = mix(color, pink, smoothstep(0.5, 0.74, t));
  color = mix(color, violet, smoothstep(0.68, 0.86, t));
  color = mix(color, blue, smoothstep(0.84, 1.0, t));

  return color;
}

float ellipseLayer(vec2 uv, vec2 center, vec2 radius, float rotation, float softness) {
  float s = sin(rotation);
  float c = cos(rotation);
  vec2 p = uv - center;
  vec2 q = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  float distanceField = length(q / radius);

  return 1.0 - smoothstep(1.0 - softness, 1.0 + softness, distanceField);
}

void main() {
  vec2 uv = v_uv;
  vec3 dark = vec3(0.0, 0.002, 0.006);
  float time = u_time * 0.88;
  vec2 aspectUv = uv;

  aspectUv.x *= u_resolution.x / max(u_resolution.y, 1.0);

  vec2 flow = vec2(cos(time * 0.72 + u_seed * 0.2), sin(time * 0.58 + u_seed * 0.31));
  vec2 counterFlow = vec2(sin(time * 0.46 + u_seed * 0.17), cos(time * 0.63 + u_seed * 0.23));
  vec2 movingUv = aspectUv + vec2(time * 0.28, -time * 0.18) + flow * 0.14;
  vec2 reverseUv = aspectUv + vec2(-time * 0.16, time * 0.22) + counterFlow * 0.12;
  float slowNoise = snoise(movingUv * 0.34 + u_seed * 0.03);
  float edgeNoise = snoise(reverseUv * 0.74 + slowNoise * 0.24);
  float velvetNoise = fbm(movingUv * 0.88 + reverseUv * 0.18 + u_seed * 0.02);

  vec2 center = vec2(0.68 + flow.x * 0.26 + counterFlow.y * 0.1, 0.68 + flow.y * 0.22);
  float s = sin(-0.58 + slowNoise * 0.22 + sin(time * 0.6) * 0.18);
  float c = cos(-0.58 + slowNoise * 0.22 + sin(time * 0.6) * 0.18);
  vec2 p = uv - center;
  vec2 q = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  float mainDistance = length(q / vec2(0.82, 0.64));
  float mainField = 1.0 - smoothstep(0.42 + edgeNoise * 0.07, 1.3 + edgeNoise * 0.09, mainDistance);

  vec2 darkCenter = vec2(0.16 + counterFlow.x * 0.2, 0.12 + flow.x * 0.14);
  vec2 dp = uv - darkCenter;
  float darkDistance = length(dp / vec2(0.68 + sin(time * 0.42) * 0.05, 0.78));
  float darkMass = 1.0 - smoothstep(0.44 + slowNoise * 0.06, 1.18 + slowNoise * 0.04, darkDistance);

  float diagonal = smoothstep(-0.2, 0.88, uv.x * 0.68 + uv.y * 0.96 + slowNoise * 0.16 + sin(time * 0.56) * 0.14);
  float colorAmount = clamp(mainField * 0.92 + diagonal * 0.28 + velvetNoise * 0.12, 0.0, 1.0);
  float paletteTravel = time * 0.22 + sin(time * 1.05 + u_seed * 0.11) * 0.2 + snoise(movingUv * 0.4 + counterFlow * 0.24) * 0.14;
  float paletteIndex = clamp(colorAmount * 0.82 + velvetNoise * 0.2 + edgeNoise * 0.06 + paletteTravel, 0.0, 1.0);
  vec3 color = rangedBrandPalette(paletteIndex, u_seed);
  vec3 bloom = rangedBrandPalette(clamp(paletteIndex + 0.16, 0.0, 1.0), u_seed + 2.0);

  color = mix(color, bloom, smoothstep(0.42, 0.9, mainField) * 0.26);
  color = mix(dark, color, 0.2 + colorAmount * 0.88);
  color = mix(color, dark, clamp(darkMass * 0.86 + (1.0 - diagonal) * 0.22, 0.0, 0.94));

  float vignette = smoothstep(1.05, 0.1, distance(uv, vec2(0.5, 0.5)));
  float grain = filmGrain(gl_FragCoord.xy, time, u_seed);
  float grainFine = filmGrain(gl_FragCoord.xy * 1.73 + vec2(41.0, 19.0), time * 1.37, u_seed + 4.0);

  color *= 0.72 + vignette * 0.36;
  color = pow(max(color, vec3(0.0)), vec3(0.94));
  color += (grain * 0.78 + grainFine * 0.22) * 0.032;
  color = mix(color, dark, 0.08);

  gl_FragColor = vec4(color, 1.0);
}
`

function createShader(gl, type, source) {
  const shader = gl.createShader(type)

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function createProgram(gl) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)

  if (!vertexShader || !fragmentShader) return null

  const program = gl.createProgram()

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }

  return program
}

function createPlaneGeometry(columns = 24, rows = 14) {
  const positions = []
  const uvs = []
  const indices = []

  for (let y = 0; y <= rows; y++) {
    for (let x = 0; x <= columns; x++) {
      const u = x / columns
      const v = y / rows

      positions.push(u * 2 - 1, v * 2 - 1)
      uvs.push(u, v)
    }
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const a = y * (columns + 1) + x
      const b = a + 1
      const c = a + columns + 1
      const d = c + 1

      indices.push(a, c, b, b, c, d)
    }
  }

  return {
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
  }
}

function createMesh(parent, index) {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  })

  if (!gl) return null

  const program = createProgram(gl)

  if (!program) return null

  const positionLocation = gl.getAttribLocation(program, 'a_position')
  const uvLocation = gl.getAttribLocation(program, 'a_uv')
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
  const timeLocation = gl.getUniformLocation(program, 'u_time')
  const seedLocation = gl.getUniformLocation(program, 'u_seed')
  const positionBuffer = gl.createBuffer()
  const uvBuffer = gl.createBuffer()
  const indexBuffer = gl.createBuffer()
  const geometry = createPlaneGeometry()
  const children = Array.from(parent.children)
  const previousParentPosition = parent.style.position
  const previousParentOverflow = parent.style.overflow
  const childStyles = children.map((child) => ({
    child,
    position: child.style.position,
    zIndex: child.style.zIndex,
  }))
  let width = 0
  let height = 0
  let isVisible = true

  canvas.className = SELECTORS.canvas.slice(1)
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: '0',
    pointerEvents: 'none',
  })

  if (window.getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative'
  }

  parent.style.overflow = 'hidden'
  parent.insertBefore(canvas, parent.firstChild)

  children.forEach((child) => {
    if (window.getComputedStyle(child).position === 'static') {
      child.style.position = 'relative'
    }

    child.style.zIndex = child.style.zIndex || '1'
  })

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, geometry.uvs, gl.STATIC_DRAW)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW)

  const resize = () => {
    const rect = parent.getBoundingClientRect()
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const nextWidth = Math.max(1, Math.floor(rect.width * pixelRatio))
    const nextHeight = Math.max(1, Math.floor(rect.height * pixelRatio))

    if (nextWidth === width && nextHeight === height) return

    width = nextWidth
    height = nextHeight
    canvas.width = width
    canvas.height = height
    gl.viewport(0, 0, width, height)
  }

  const render = (time) => {
    if (!isVisible) return

    resize()
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer)
    gl.enableVertexAttribArray(uvLocation)
    gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.uniform2f(resolutionLocation, width, height)
    gl.uniform1f(timeLocation, time * 0.001)
    gl.uniform1f(seedLocation, index * 17.13)
    gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0)
  }

  const setVisible = (value) => {
    isVisible = value
  }

  const destroy = () => {
    childStyles.forEach(({ child, position, zIndex }) => {
      child.style.position = position
      child.style.zIndex = zIndex
    })
    parent.style.position = previousParentPosition
    parent.style.overflow = previousParentOverflow
    gl.deleteBuffer(positionBuffer)
    gl.deleteBuffer(uvBuffer)
    gl.deleteBuffer(indexBuffer)
    gl.deleteProgram(program)
    canvas.remove()
  }

  resize()

  return {
    canvas,
    parent,
    render,
    setVisible,
    destroy,
  }
}

export function initWhyGradientMeshes(root = document) {
  const parents = Array.from(root.querySelectorAll(SELECTORS.parent))
    .filter((parent) => !parent.querySelector(SELECTORS.canvas))
  const meshes = parents
    .map((parent, index) => createMesh(parent, index))
    .filter(Boolean)

  if (!meshes.length) return () => {}

  let rafId = null
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const mesh = meshes.find((item) => item.parent === entry.target)

        mesh?.setVisible(entry.isIntersecting)
      })
    }, { rootMargin: '20%' })
    : null

  const tick = (time) => {
    meshes.forEach((mesh) => mesh.render(time))
    rafId = window.requestAnimationFrame(tick)
  }

  meshes.forEach((mesh) => observer?.observe(mesh.parent))
  rafId = window.requestAnimationFrame(tick)

  return () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId)
    }

    observer?.disconnect()
    meshes.forEach((mesh) => mesh.destroy())
  }
}
