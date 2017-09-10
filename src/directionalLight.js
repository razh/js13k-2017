import { object3d_create } from './object3d';
import { vec3_create } from './vec3';

export var light_create = (color = vec3_create(), intensity = 1) => {
  return Object.assign(
    object3d_create(),
    {
      color,
      intensity,
      target: object3d_create(),
    }
  );
};
