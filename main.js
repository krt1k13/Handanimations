// =======================
// THREE.JS SETUP
// =======================
const canvas = document.getElementById("three-canvas");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 120;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// =======================
// PARTICLE SYSTEM
// =======================
const PARTICLE_COUNT = 6000;
let geometry = new THREE.BufferGeometry();
let positions = new Float32Array(PARTICLE_COUNT * 3);
let colors = new Float32Array(PARTICLE_COUNT * 3);

const material = new THREE.PointsMaterial({
  size: 1.8,
  vertexColors: true
});

let particles = new THREE.Points(geometry, material);
scene.add(particles);

// =======================
// SHAPE GENERATORS
// =======================
function generateHeart() {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let t = Math.random() * Math.PI * 2;
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t);
    let z = (Math.random() - 0.5) * 10;

    positions[i * 3] = x * 2;
    positions[i * 3 + 1] = y * 2;
    positions[i * 3 + 2] = z;
  }
}

function generateSaturn() {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let angle = Math.random() * Math.PI * 2;
    let radius = 40 + Math.random() * 10;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }
}

function generateFireworks() {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let r = Math.random() * 50;
    let theta = Math.random() * Math.PI * 2;
    let phi = Math.random() * Math.PI;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
}

function applyColors(r, g, b) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
}

function updateGeometry() {
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
}

// =======================
// DEFAULT STATE
// =======================
generateHeart();
applyColors(1, 0.2, 0.4);
updateGeometry();

// =======================
// HAND TRACKING
// =======================
const video = document.getElementById("video");

const hands = new Hands({
  locateFile: file =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

let lastSwitch = 0;
let mode = 0;

hands.onResults(results => {
  if (!results.multiHandLandmarks.length) return;

  const landmarks = results.multiHandLandmarks[0];
  const indexTip = landmarks[8];
  const thumbTip = landmarks[4];

  // Pinch distance
  const dx = indexTip.x - thumbTip.x;
  const dy = indexTip.y - thumbTip.y;
  const pinch = Math.sqrt(dx * dx + dy * dy);

  // Expansion control
  particles.scale.setScalar(THREE.MathUtils.clamp(1 / pinch, 0.6, 2.2));

  // Color control
  applyColors(1 - pinch * 2, pinch * 2, 0.8);

  // Gesture-based template switch
  if (pinch < 0.04 && performance.now() - lastSwitch > 1000) {
    mode = (mode + 1) % 3;
    lastSwitch = performance.now();

    if (mode === 0) generateHeart();
    if (mode === 1) generateSaturn();
    if (mode === 2) generateFireworks();

    updateGeometry();
  }
});

const cam = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});
cam.start();

// =======================
// ANIMATION LOOP
// =======================
function animate() {
  requestAnimationFrame(animate);
  particles.rotation.y += 0.002;
  renderer.render(scene, camera);
}

animate();

// =======================
// RESIZE HANDLING
// =======================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
