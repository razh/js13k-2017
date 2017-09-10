import { object3d_create } from './object3d';

export var mesh_create = (geometry, material) => {
  return Object.assign(
    object3d_create(),
    {
      geometry,
      material,
    }
  );
};
