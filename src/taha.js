import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Octree } from "three/addons/math/Octree.js";
import { Capsule } from "three/addons/math/Capsule.js";

const scene = new THREE.Scene();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const canvas = document.getElementById("experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Physics
const GRAVITY = 30;
const CAPSULE_RADIUS = 0.35;
const CAPSULE_HEIGHT = 1;
const JUMP_HEIGHT = 15;
const MOVE_SPEED = 1;

let character = {
  instance: null,
  isMoving: false,
};

let targetRotation = 0;

const playerCollider = {
  start: new THREE.Vector3(0, CAPSULE_RADIUS, 0),
  end: new THREE.Vector3(0, CAPSULE_HEIGHT, 0),
  radius: CAPSULE_RADIUS,
};

const colliderOctree = new Octree();
// const playerCollider = new Capsule(
//   (0, CAPSULE_RADIUS, 0),
//   (0, CAPSULE_HEIGHT, 0),
//   CAPSULE_RADIUS
// );

let playerVelocity = new THREE.Vector3();
let playerOnFloor = false;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.75;

const modalContent = {
  Project_1: {
    title: "Project three",
    content: "this is project one, hello world",
    link: "https://example.com/",
  },
  Project_2: {
    title: "Project two",
    content: "this is project two, hello world",
    link: "https://example.com/",
  },
  Project_3: {
    title: "Project one",
    content: "this is project three, hello world",
    link: "https://example.com/",
  },
  Squirtle: {
    title: "About Me",
    content: "this is about me, wassup",
  },
};

const modal = document.querySelector(".modal");
const modalTitle = document.querySelector(".modal-title");
const modalProjectDes = document.querySelector(".modal-project-des");
const modalExitButton = document.querySelector(".modal-exit-button");
const modalVisitProjectButton = document.querySelector(
  ".modal-project-visit-button"
);

function showModal(id) {
  const content = modalContent[id];
  if (content) {
    modalTitle.textContent = content.title;
    modalProjectDes.textContent = content.content;

    if (content.link) {
      modalVisitProjectButton.href = content.link;
      modalVisitProjectButton.classList.remove("hidden");
    } else {
      modalVisitProjectButton.classList.add("hidden");
    }
    modal.classList.toggle("hidden");
  }
}

function hideModal() {
  modal.classList.toggle("hidden");
}

let intersectObject = "";
const intersectObjects = [];
const intersectObjectsNames = [
  "Project_1",
  "Project_2",
  "Project_3",
  "Chicken",
  "Pikachu",
  "Bulbasaur",
  "Squirtle",
];

const loader = new GLTFLoader();

loader.load(
  "/models/Portfolio.glb",
  function (glb) {
    glb.scene.traverse((child) => {
      if (intersectObjectsNames.includes(child.name)) {
        intersectObjects.push(child);
      }
      console.log(child.name)

      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // console.log(child)
      }

      if (child.name === "Character") {
        character.instance = child;
        playerCollider.start.copy(child.position).add(0, CAPSULE_RADIUS, 0);
        playerCollider.end.copy(child.position).add(0, CAPSULE_HEIGHT, 0);
      }
      if (child.name === "Ground_Collider") {
        colliderOctree.fromGraphNode(child);
      }
    });
    scene.add(glb.scene);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

const sun = new THREE.DirectionalLight(0xffffff);
sun.castShadow = true;
sun.position.set(75, 80, -50);
sun.target.position.set(50, 0, 0);
sun.shadow.mapSize.width = 4096;
sun.shadow.mapSize.height = 4096;
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;
sun.shadow.normalBias = 0.2;
scene.add(sun);

const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
scene.add(shadowHelper);

const helper = new THREE.DirectionalLightHelper(sun, 5);
scene.add(helper);

const light = new THREE.AmbientLight(0x404040, 10);
scene.add(light);

const aspect = sizes.width / sizes.height;
const camera = new THREE.OrthographicCamera(
  -aspect * 50,
  aspect * 50,
  50,
  -50,
  1,
  1000
);

camera.position.x = -13;
camera.position.y = 39;
camera.position.z = -67;

const controls = new OrbitControls(camera, canvas);
controls.update();

function handleResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  const aspect = sizes.width / sizes.height;
  camera.left = -aspect * 50;
  camera.right = aspect * 50;
  camera.top = 50;
  camera.bottom = -50;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function jumpCharacter(meshID) {
  const mesh = scene.getObjectByName(meshID);
  const jumpHeight = 2;
  const jumpDuration = 0.5;

  const t1 = gsap.timeline();

  t1.to(mesh.scale, {
    x: 1.2,
    y: 0.8,
    z: 1.2,
    duration: jumpDuration * 0.2,
    ease: "power2.out",
  });

  t1.to(mesh.scale, {
    x: 0.8,
    y: 1.3,
    z: 0.8,
    duration: jumpDuration * 0.3,
    ease: "power2.out",
  });

  t1.to(
    mesh.position,
    {
      y: mesh.position.y + jumpHeight,
      duration: jumpDuration * 0.5,
      ease: "power2.out",
    },
    "<"
  );

  t1.to(mesh.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: jumpDuration * 0.3,
    ease: "power1.inOut",
  });

  t1.to(
    mesh.position,
    {
      y: mesh.position.y,
      duration: jumpDuration * 0.5,
      ease: "bounce.out",
    },
    ">"
  );

  t1.to(mesh.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: jumpDuration * 0.2,
    ease: "elastic.out(1, 0.3)",
  });
}

function onClick() {
  if (intersectObject !== "") {
    if (["Bulbasaur", "Chicken", "Pikachu"].includes(intersectObject)) {
      jumpCharacter(intersectObject);
    } else {
      showModal(intersectObject);
    }
  }
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}



function playerCollisions() {
  const result = colliderOctree.capsuleIntersect(playerCollider);
  playerOnFloor = false;

  if (result) {
    playerOnFloor = result.normal.y > 0;
    playerCollider.translate(result.normal.multiplyScalar(result.depth));

    if(playerOnFloor){
      character.isMoving = false;
      playerVelocity.x = 0;
      playerVelocity.z = 0;
    }
  }
}

function updatePlayer() {
  if (!character.instance) return;

  if (!playerOnFloor) {
    playerVelocity.y -= GRAVITY * 0.01;
  }

  const translation = playerVelocity.clone().multiplyScalar(0.01);
  playerCollider.start.add(translation);
  playerCollider.end.add(translation);

  // playerCollisions();

  character.instance.position.copy(playerCollider.start);
  character.instance.position.y -= CAPSULE_RADIUS;

  character.instance.rotation.y = THREE.MathUtils.lerp(
    character.instance.rotation.y,
    targetRotation,
    0.1
  );
}

function onKeyDown(event) {
  if (character.isMoving) return;

  switch (event.key.toLowerCase()) {
    case "w":
    case "arrowup":
      playerVelocity.z += character.moveDistance;
      targetRotation = 0;
      break;
    case "s":
    case "arrowdown":
      playerVelocity.z -= character.moveDistance;
      targetRotation = Math.PI;
      break;
    case "a":
    case "arrowleft":
      playerVelocity.x += character.moveDistance;
      targetRotation = Math.PI / 2;
      break;
    case "d":
    case "arrowright":
      playerVelocity.x -= character.moveDistance;
      targetRotation = -Math.PI / 2;
      break;
    default:
      return;
  }
  playerVelocity.y = JUMP_HEIGHT;
  character.isMoving = true;
}

modalExitButton.addEventListener("click", hideModal);
window.addEventListener("resize", handleResize);
window.addEventListener("click", onClick);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("keydown", onKeyDown);

function animate() {
  updatePlayer();

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(intersectObjects);

  if (intersects.length > 0) {
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "default";
    intersectObject = "";
  }

  for (let i = 0; i < intersects.length; i++) {
    intersectObject = intersects[0].object.parent.name;
  }

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
