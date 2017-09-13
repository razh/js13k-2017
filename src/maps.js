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
import { terrain_create, terrain_fbm, terrain_fromStringArray } from './terrain';
import { vec3_create, vec3_normalize, vec3_set } from './vec3';
import { compose } from './utils';

export var createMap = (gl, scene, camera) => {
  var fogColor = [0.11, 0.12, 0.15];
  gl.clearColor(...fogColor, 1);
  vec3_set(scene.fogColor, ...fogColor);
  scene.fogFar = 128;

  var map = object3d_create();

  object3d_add(scene, map);

  vec3_set(camera.position, 64, 64, 64);
  camera_lookAt(camera, vec3_create());
  var cameraPhysics = physics_create(mesh_create(boxGeom_create(2, 2, 2)), BODY_DYNAMIC);
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
      physics_update(physics_bodies(map));
    },
  }));

  object3d_add(
    map,
    physics_add(
      mesh_create(
        boxGeom_create(8, 8, 8),
        material_create(),
      ),
      BODY_STATIC,
    ),
  );

  var terrainMaterial = material_create();
  vec3_set(terrainMaterial.color, 0.25, 0.28, 0.325);
  terrainMaterial.shininess = 2;

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
  createWalls(map);

  var ambient = vec3_create(0.5, 0.5, 0.55);

  var light = light_create(vec3_create(0.2, 0.3, 0.4), 2);
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
var createWalls = scene => {
  var size = 6;
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

  var blocks = scaleX => {
    return [
      compose(ny_pz, translate(10 * size * scaleX, 0, -10 * size))(boxGeom_create(4 * size, height, 3 * size)),
      compose(ny_pz, translate(4.5 * size * scaleX, 0, -10 * size))(boxGeom_create(5 * size, height, 3 * size)),

      compose(ny_pz, translate(10 * size * scaleX, 0, -7 * size))(boxGeom_create(4 * size, height, 2 * size)),
      compose(ny_pz, translate(6 * size * scaleX, 0, -1 * size))(boxGeom_create(2 * size, height, 8 * size)),
      compose(ny_pz, translate(3.5 * size * scaleX, 0, -4 * size))(boxGeom_create(3 * size, height, 2 * size)),

      compose(ny_pz, translate(10.5 * size * scaleX, 0, -1 * size))(boxGeom_create(5 * size, height, 5 * size)),

      compose(ny_nz, translate(9.5 * size * scaleX, 0, 1 * size))(boxGeom_create(5 * size, height, 5 * size)),
      compose(ny_nz, translate(6 * size * scaleX, 0, 1 * size))(boxGeom_create(2 * size, height, 5 * size)),

      compose(ny_nz, translate(11 * size * scaleX, 0, 7 * size))(boxGeom_create(2 * size, height, 2 * size)),
      compose(ny_nz, translate(9 * size * scaleX, 0, 7 * size))(boxGeom_create(2 * size, height, 5 * size)),
      compose(ny_nz, translate(4.5 * size * scaleX, 0, 7 * size))(boxGeom_create(5 * size, height, 2 * size)),

      compose(ny_nz, translate(12 * size * scaleX, 0, 10 * size))(boxGeom_create(2 * size, height, 2 * size)),
      compose(ny_nz, translate(6 * size * scaleX, 0, 10 * size))(boxGeom_create(2 * size, height, 3 * size)),

      compose(ny_nz, translate(7 * size * scaleX, 0, 13 * size))(boxGeom_create(10 * size, height, 2 * size)),
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

  [
    frontWall,
    backWall,
    leftWall,
    rightWall,
    ...blocks(-1),
    ...blocks(1),
    ...centerBlocks,
  ].map(geom => object3d_add(
    scene,
    physics_add(
      mesh_create(
        colors({
          py: [0.5, 0.5, 0.55],
          ny: [0.2, 0.2, 0.25],
        })(geom),
        material_create()
      ),
      BODY_STATIC,
    ),
  ));
};
