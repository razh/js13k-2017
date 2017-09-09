// @flow

import type { Camera } from './camera';
import type { Object3D } from './object3d';

import { boxGeom_create } from './boxGeom';
import { camera_lookAt } from './camera';
import { material_create } from './material';
import { light_create } from './directionalLight';
import { mesh_create } from './mesh';
import { object3d_create, object3d_add } from './object3d';
import { vec3_create, vec3_set } from './vec3';

export var createBasicMap = (scene: Object3D, camera: Camera) => {
  var map = object3d_create();
  object3d_add(scene, map);

  vec3_set(camera.position, 64, 64, 64);
  camera_lookAt(camera, vec3_create());
  object3d_add(map, camera);

  object3d_add(
    map,
    mesh_create(
      boxGeom_create(8, 8, 8),
      material_create(),
    ),
  );

  var ambient = vec3_create(0.5, 0.5, 0.5);

  var light = light_create(vec3_create(1, 1, 1));
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
