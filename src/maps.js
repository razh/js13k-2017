import { colors } from './boxColors';
import { boxGeom_create } from './boxGeom';
import { align } from './boxTransforms';
import { camera_lookAt } from './camera';
import { component_create, entity_add } from './entity';
import { geom_clone, geom_merge, translate } from './geom';
import { keys_create } from './keys';
import { material_create } from './material';
import { light_create } from './directionalLight';
import { mesh_create } from './mesh';
import {
  object3d_create,
  object3d_add,
  object3d_translateOnAxis,
} from './object3d';
import {
  physics_create,
  physics_add,
  physics_bodies,
  physics_update,
  BODY_STATIC,
  BODY_DYNAMIC,
  SHAPE_HEIGHTFIELD,
} from'./physics';
import { ray_create, ray_intersectObjects } from './ray';
import { terrain_create, terrain_fbm, terrain_fromStringArray } from './terrain';
import {
  vec3_create,
  vec3_length,
  vec3_normalize,
  vec3_set,
  vec3_subVectors,
} from './vec3';
import { compose } from './utils';

export var createMap = (gl, scene, camera) => {
  scene.player = camera;

  var fogColor = [0.11, 0.12, 0.15];
  gl.clearColor(...fogColor, 1);
  vec3_set(scene.fogColor, ...fogColor);
  scene.fogFar = 128;

  var map = object3d_create();

  object3d_add(scene, map);

  vec3_set(camera.position, 64, 64, 64);
  camera_lookAt(camera, vec3_create());
  var cameraPhysics = physics_create(mesh_create(boxGeom_create(2, 4, 2)), BODY_DYNAMIC);
  entity_add(camera, cameraPhysics);

  var cameraObject = object3d_create();
  object3d_add(cameraObject, camera);
  object3d_add(map, cameraObject);

  var keys = keys_create();
  var cameraDirection = vec3_create();

  var updateCamera = dt => {
    var speed = 16;

    var x = 0;
    var z = 0;

    if (keys.KeyW || keys.ArrowUp) { z--; }
    if (keys.KeyS || keys.ArrowDown) { z++; }
    if (keys.KeyA || keys.ArrowLeft) { x--; }
    if (keys.KeyD || keys.ArrowRight) { x++; }

    if (!x && !z) {
      return;
    }

    if (keys.ShiftLeft || keys.ShiftRight) {
      speed *= 4;
    }

    vec3_normalize(vec3_set(cameraDirection, x, 0, z));
    object3d_translateOnAxis(camera, cameraDirection, speed * dt);
  };

  entity_add(map, component_create({
    update(component, dt) {
      updateCamera(dt);
      scene.physics = physics_update(physics_bodies(map));
    },
  }));

  var terrainMaterial = material_create();
  vec3_set(terrainMaterial.color, 0.25, 0.28, 0.325);
  terrainMaterial.shininess = 10;

  var terrainWidthSegments = 64;
  var terrainHeightSegments = 64;

  var terrainMap = terrain_fbm(terrainWidthSegments, terrainHeightSegments);

  var terrainMesh = mesh_create(
    terrain_create(
      terrainMap,
      vec3_create(6 * 26 / (terrainWidthSegments - 1), 1.5, 6 * 30 / (terrainHeightSegments - 1)),
    ).reduce(geom_merge),
    terrainMaterial,
  );

  var terrainPhysics = physics_create(terrainMesh, BODY_STATIC);
  terrainPhysics.shape = SHAPE_HEIGHTFIELD;
  vec3_set(terrainMesh.position, -13 * 6, 1, -14 * 6);
  entity_add(terrainMesh, terrainPhysics);

  object3d_add(map, terrainMesh);
  var walls = createWalls(6);
  walls.map(wall => object3d_add(map, wall));

  var nodes = createNodes(6);
  var navMesh = generateNavMesh(nodes, walls);
  scene.nodes = nodes;
  scene.navMesh = navMesh;

  var ambient = vec3_create(0.5, 0.5, 0.55);

  var light = light_create(vec3_create(0.2, 0.3, 0.4), 3);
  vec3_set(light.position, 128, 48, 0);

  var directionalLights = [
    light,
  ];

  directionalLights.map(light => object3d_add(map, light));

  return {
    ambient,
    directional: directionalLights,
  };
};

// Pac-Man
var createWalls = size => {
  var height = size;

  var ny = align('ny');
  var ny_pz = align('ny_pz');
  var ny_nz = align('ny_nz');

  var wallX = boxGeom_create(size, height, 30 * size);
  var wallZ = boxGeom_create(28 * size, height, size);

  var frontWall = compose(
    ny_nz,
    translate(0, 0, 16 * size),
  )(geom_clone(wallZ));

  var backWall = compose(
    ny_pz,
    translate(0, 0, -14 * size),
  )(geom_clone(wallZ));

  var leftWall = compose(
    align('px_ny'),
    translate(-13 * size, 0, size),
  )(geom_clone(wallX));

  var rightWall = compose(
    align('nx_ny'),
    translate(13 * size, 0, size),
  )(geom_clone(wallX));

  /*
  Left 3/4 block
  ▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊
  ▊            ▊▊            ▊
  ▊ ▊▊▊▊ ▊▊▊▊▊ ▊▊ ▊▊▊▊▊ ▊▊▊▊ ▊ Row 0
  ▊ ▊▊▊▊ ▊▊▊▊▊ ▊▊ ▊▊▊▊▊ ▊▊▊▊ ▊
  ▊ ▊▊▊▊ ▊▊▊▊▊ ▊▊ ▊▊▊▊▊ ▊▊▊▊ ▊
  ▊                          ▊
  ▊ ▊▊▊▊ ▊▊ ▊▊▊▊▊▊▊▊ ▊▊ ▊▊▊▊ ▊ Row 1
  ▊ ▊▊▊▊ ▊▊ ▊▊▊▊▊▊▊▊ ▊▊ ▊▊▊▊ ▊
  ▊      ▊▊    ▊▊    ▊▊      ▊
  ▊▊▊▊▊▊ ▊▊▊▊▊ ▊▊ ▊▊▊▊▊ ▊▊▊▊▊▊ Row 2
  ▊▊▊▊▊▊ ▊▊▊▊▊ ▊▊ ▊▊▊▊▊ ▊▊▊▊▊▊
  ▊▊▊▊▊▊ ▊▊          ▊▊ ▊▊▊▊▊▊
  ▊▊▊▊▊▊ ▊▊ ▊▊▊▊▊▊▊▊ ▊▊ ▊▊▊▊▊▊
  ▊▊▊▊▊▊ ▊▊ ▊▊▊▊▊▊▊▊ ▊▊ ▊▊▊▊▊▊
            ▊▊▊▊▊▊▊▊
  ▊▊▊▊▊▊ ▊▊ ▊▊▊▊▊▊▊▊ ▊▊ ▊▊▊▊▊▊ Row 3
  ▊▊▊▊▊▊ ▊▊ ▊▊▊▊▊▊▊▊ ▊▊ ▊▊▊▊▊▊
  ▊▊▊▊▊▊ ▊▊          ▊▊ ▊▊▊▊▊▊
  ▊▊▊▊▊▊ ▊▊ ▊▊▊▊▊▊▊▊ ▊▊ ▊▊▊▊▊▊
  ▊▊▊▊▊▊ ▊▊ ▊▊▊▊▊▊▊▊ ▊▊ ▊▊▊▊▊▊
  ▊            ▊▊            ▊
  ▊ ▊▊▊▊ ▊▊▊▊▊ ▊▊ ▊▊▊▊▊ ▊▊▊▊ ▊ Row 4
  ▊ ▊▊▊▊ ▊▊▊▊▊ ▊▊ ▊▊▊▊▊ ▊▊▊▊ ▊
  ▊   ▊▊                ▊▊   ▊
  ▊▊▊ ▊▊ ▊▊ ▊▊▊▊▊▊▊▊ ▊▊ ▊▊ ▊▊▊ Row 5
  ▊▊▊ ▊▊ ▊▊ ▊▊▊▊▊▊▊▊ ▊▊ ▊▊ ▊▊▊
  ▊      ▊▊    ▊▊    ▊▊      ▊
  ▊ ▊▊▊▊▊▊▊▊▊▊ ▊▊ ▊▊▊▊▊▊▊▊▊▊ ▊ Row 6
  ▊ ▊▊▊▊▊▊▊▊▊▊ ▊▊ ▊▊▊▊▊▊▊▊▊▊ ▊
  ▊                          ▊
  ▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊
   */
  var blocks = scaleX => {
    var t = (x, z) => translate(x * size * scaleX, 0, z * size);

    return [
      compose(ny_pz, t(10, -10))(boxGeom_create(4 * size, height, 3 * size)),
      compose(ny_pz, t(4.5, -10))(boxGeom_create(5 * size, height, 3 * size)),

      compose(ny_pz, t(10, -7))(boxGeom_create(4 * size, height, 2 * size)),
      compose(ny_pz, t(6, -1))(boxGeom_create(2 * size, height, 8 * size)),
      compose(ny_pz, t(3.5, -4))(boxGeom_create(3 * size, height, 2 * size)),

      compose(ny_pz, t(10.5, -1))(boxGeom_create(5 * size, height, 5 * size)),

      compose(ny_nz, t(9.5, 1))(boxGeom_create(5 * size, height, 5 * size)),
      compose(ny_nz, t(6, 1))(boxGeom_create(2 * size, height, 5 * size)),

      compose(ny_nz, t(11, 7))(boxGeom_create(2 * size, height, 2 * size)),
      compose(ny_nz, t(9, 7))(boxGeom_create(2 * size, height, 5 * size)),
      compose(ny_nz, t(4.5, 7))(boxGeom_create(5 * size, height, 2 * size)),

      compose(ny_nz, t(12, 10))(boxGeom_create(2 * size, height, 2 * size)),
      compose(ny_nz, t(6, 10))(boxGeom_create(2 * size, height, 3 * size)),

      compose(ny_nz, t(7, 13))(boxGeom_create(10 * size, height, 2 * size)),
    ];
  };

  var centerBlocks = [
    compose(ny, translate(0, 0, -12 * size))(boxGeom_create(2 * size, height, 4 * size)),

    compose(ny, translate(0, 0, -8 * size))(boxGeom_create(8 * size, height, 2 * size)),
    compose(ny, translate(0, 0, -5.5 * size))(boxGeom_create(2 * size, height, 3 * size)),

    ny(boxGeom_create(8 * size, height, 6 * size)),

    compose(ny, translate(0, 0, 5 * size))(boxGeom_create(8 * size, height, 2 * size)),
    compose(ny, translate(0, 0, 7.5 * size))(boxGeom_create(2 * size, height, 3 * size)),

    compose(ny, translate(0, 0, 11 * size))(boxGeom_create(8 * size, height, 2 * size)),
    compose(ny, translate(0, 0, 13.5 * size))(boxGeom_create(2 * size, height, 3 * size)),
  ];

  var blockColors = colors({
    py: [0.5, 0.5, 0.55],
    ny: [0.2, 0.2, 0.25],
  });

  return [
    frontWall,
    backWall,
    leftWall,
    rightWall,
    ...blocks(-1),
    ...blocks(1),
    ...centerBlocks,
  ].map(geom => (
    physics_add(
      mesh_create(
        blockColors(geom),
        material_create(),
      ),
      BODY_STATIC,
    )
  ));
};

// Hardcoded path-finding nodes.
var createNodes = size => {
  var nodes = scaleX => {
    return [
      [12.5, -13.5],
      [7.5, -13.5],
      [1.5, -13.5],

      [12.5, -9.5],
      [7.5, -9.5],
      [4.5, -9.5],
      [1.5, -9.5],

      [12.5, -6.5],
      [7.5, -6.5],
      [4.5, -6.5],
      [1.5, -6.5],

      [4.5, -3.5],
      [1.5, -3.5],

      [12.5, 0],
      [7.5, 0],
      [4.5, 0],

      [4.5, 3.5],

      [12.5, 6.5],
      [7.5, 6.5],
      [4.5, 6.5],
      [1.5, 6.5],

      [12.5, 9.5],
      [10.5, 9.5],
      [7.5, 9.5],
      [4.5, 9.5],
      [1.5, 9.5],

      [12.5, 12.5],
      [10.5, 12.5],
      [7.5, 12.5],
      [4.5, 12.5],
      [1.5, 12.5],

      [12.5, 15.5],
      [1.5, 15.5],
    ].map(([x, z]) => vec3_create(x * size * scaleX, 0, z * size));
  };

  return [
    ...nodes(-1),
    ...nodes(1),
  ];
};

// Test if nodes are placed correctly.
// eslint-disable-next-line no-unused-vars
var debugNodes = (scene, size) => {
  var nodes = createNodes(size);
  var nodeGeom = boxGeom_create(1, 1, 1);
  var nodeMaterial = material_create();
  vec3_set(nodeMaterial.emissive, 1, 0, 0);
  nodes.map(vector => {
    var node = mesh_create(nodeGeom, nodeMaterial);
    Object.assign(node.position, vector);
    node.position.y = size;
    object3d_add(scene, node);
  });
};

var generateNavMesh = (nodes, walls) => {
  var adjacencyMatrix = [];

  var i;
  for (i = 0; i < nodes.length; i++) {
    adjacencyMatrix[i] = [];
  }

  var ray = ray_create();

  for (i = 0; i < nodes.length; i++) {
    adjacencyMatrix[i] = [];
    Object.assign(ray.origin, nodes[i]);

    for (var j = i; j < nodes.length; j++) {
      vec3_subVectors(ray.direction, nodes[j], nodes[i]);
      var distance = vec3_length(ray.direction);
      var intersections = ray_intersectObjects(ray, walls)
        .filter(intersection => intersection.t > 0);

      if (!intersections.length || distance < intersections[0].distance) {
        adjacencyMatrix[i].push(j);
        adjacencyMatrix[j].push(i);
      }
    }
  }

  return adjacencyMatrix;
};
