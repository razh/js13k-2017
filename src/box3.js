import { object3d_traverse, object3d_updateMatrixWorld } from './object3d';
import {
  vec3_create,
  vec3_add,
  vec3_applyMatrix4,
  vec3_min,
  vec3_max,
} from './vec3';

export var box3_create = (
  min = vec3_create(Infinity, Infinity, Infinity),
  max = vec3_create(-Infinity, -Infinity, -Infinity),
) => {
  return {
    min,
    max,
  };
};

export var box3_copy = (a, b) => {
  Object.assign(a.min, b.min);
  Object.assign(a.max, b.max);
  return a;
};

export var box3_makeEmpty = box => {
  box.min.x = box.min.y = box.min.z = Infinity;
  box.max.x = box.max.y = box.max.z -= Infinity;
  return box;
};

export var box3_expandByPoint = (box, point) => {
  vec3_min(box.min, point);
  vec3_max(box.max, point);
  return box;
};

export var box3_setFromObject = (() => {
  var v1 = vec3_create();

  return (box, object) => {
    object3d_updateMatrixWorld(object);
    box3_makeEmpty(box);

    object3d_traverse(object, node => {
      var { geometry } = node;
      if (geometry) {
        geometry.vertices.map(vertex => {
          Object.assign(v1, vertex);
          vec3_applyMatrix4(v1, node.matrixWorld);
          box3_expandByPoint(box, v1);
        });
      }
    });

    return box;
  };
})();

export var box3_intersectsBox = (a, b) => {
  return !(
    a.max.x < b.min.x || a.min.x > b.max.x ||
    a.max.y < b.min.y || a.min.y > b.max.y ||
    a.max.z < b.min.z || a.min.z > b.max.z
  );
};

export var box3_translate = (box, offset) => {
  vec3_add(box.min, offset);
  vec3_add(box.max, offset);
  return box;
};
