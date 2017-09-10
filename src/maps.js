import { boxGeom_create } from './boxGeom';
import { camera_lookAt } from './camera';
import { entity_create, component_create, entity_add } from './entity';
import { keys_create } from './keys';
import { material_create } from './material';
import { light_create } from './directionalLight';
import { mesh_create } from './mesh';
import {
  object3d_create,
  object3d_add,
  object3d_translateOnAxis,
} from './object3d';
import { vec3_create, vec3_normalize, vec3_set } from './vec3';

export var createBasicMap = (scene, camera) => {
  var map = entity_create(object3d_create());

  object3d_add(scene, map);

  vec3_set(camera.position, 64, 64, 64);
  camera_lookAt(camera, vec3_create());

  var cameraObject = object3d_create();
  object3d_add(cameraObject, camera);
  object3d_add(map, cameraObject);

  var keys = keys_create();
  var cameraDirection = vec3_create();

  entity_add(map, component_create({
    update(dt) {
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
    },
  }));

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
