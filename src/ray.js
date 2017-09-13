import { mat4_create, mat4_getInverse } from './mat4';
import {
  vec3_create,
  vec3_add,
  vec3_applyMatrix4,
  vec3_clone,
  vec3_crossVectors,
  vec3_distanceTo,
  vec3_dot,
  vec3_multiplyScalar,
  vec3_subVectors,
  vec3_transformDirection,
} from './vec3';

export var ray_create = (origin = vec3_create(), direction = vec3_create()) => {
  return {
    origin,
    direction,
  };
};

export var ray_copy = (a, b) => {
  Object.assign(a.origin, b.origin);
  Object.assign(a.direction, b.direction);
  return a;
};

export var ray_at = (ray, t, result = vec3_create()) => {
  return vec3_add(
    vec3_multiplyScalar(Object.assign(result, ray.direction), t),
    ray.origin,
  );
};

export var ray_intersectBox = (ray, box, optionalTarget) => {
  var { origin, direction } = ray;

  var txmin = (box.min.x - origin.x) / direction.x;
  var txmax = (box.max.x - origin.x) / direction.x;
  if (txmin > txmax) {
    [txmin, txmax] = [txmax, txmin];
  }

  var tymin = (box.min.y - origin.y) / direction.y;
  var tymax = (box.max.y - origin.y) / direction.y;
  if (tymin > tymax) {
    [tymin, tymax] = [tymax, tymin];
  }

  if ((txmin > tymax) || (tymin > txmax)) {
    return;
  }

  // Math.min/max with NaN support (0 / 0).
  var tmin = ((tymin > txmin) || (txmin !== txmin)) ? tymin : txmin;
  var tmax = ((tymax < txmax) || (txmax !== txmax)) ? tymax : txmax;

  var tzmin = (box.min.z - origin.z) / direction.z;
  var tzmax = (box.max.z - origin.z) / direction.z;
  if (tzmin > tzmax) {
    [tzmin, tzmax] = [tzmax, tzmin];
  }

  if ((tmin > tzmax) || (tzmin > tmax)) {
    return;
  }

  tmin = ((tzmin > tmin) || (tmin !== tmin)) ? tzmin : tmin;
  tmax = ((tzmax < tmax) || (tmax !== tmax)) ? tzmax : tmax;

  if (tmax < 0) {
    return;
  }

  return ray_at(ray, tmin >= 0 ? tmin : tmax, optionalTarget);
};

export var ray_intersectTriangle = (() => {
  var delta = vec3_create();
  var edge0 = vec3_create();
  var edge1 = vec3_create();
  var p = vec3_create();
  var q = vec3_create();

  return (ray, a, b, c) => {
    vec3_subVectors(edge0, b, a);
    vec3_subVectors(edge1, c, a);

    vec3_crossVectors(p, ray.direction, edge1);

    // Determinant.
    var d = vec3_dot(edge0, p);
    if (!d) {
      return;
    }

    // u.
    vec3_subVectors(delta, ray.origin, a);
    var u = vec3_dot(delta, p);
    if (0 > u || u > d) {
      return;
    }

    // v.
    vec3_crossVectors(q, delta, edge0);
    var v = vec3_dot(ray.direction, q);
    if (0 > v || (u + v) > d) {
      return;
    }

    return vec3_dot(edge1, q) / d;
  };
})();

export var ray_intersectsMesh = (() => {
  var inverseMatrix = mat4_create();
  var rayCopy = ray_create();

  var intersectionPoint = vec3_create();
  var intersectionPointWorld = vec3_create();

  var checkIntersection = (object, ray, a, b, c, point) => {
    var t = ray_intersectTriangle(ray, a, b, c);
    if (!t) {
      return;
    }

    ray_at(ray, t, point);
    Object.assign(intersectionPointWorld, point);
    vec3_applyMatrix4(intersectionPointWorld, object.matrixWorld);

    var distance = vec3_distanceTo(ray.origin, intersectionPointWorld);

    return {
      t,
      object,
      distance,
      point: vec3_clone(intersectionPointWorld),
    };
  };

  return (ray, object) => {
    var intersections = [];

    mat4_getInverse(inverseMatrix, object.matrixWorld);
    ray_applyMatrix4(ray_copy(rayCopy, ray), inverseMatrix);

    var { vertices, faces } = object.geometry;

    faces.map((face, index) => {
      var a = vertices[face.a];
      var b = vertices[face.b];
      var c = vertices[face.c];

      var intersection = checkIntersection(object, rayCopy, a, b, c, intersectionPoint);
      if (intersection) {
        intersection.face = face;
        intersection.faceIndex = index;
        intersections.push(intersection);
      }
    });

    return intersections;
  };
})();

export var ray_applyMatrix4 = (r, m) => {
  vec3_applyMatrix4(r.origin, m);
  vec3_transformDirection(r.direction, m);
  return r;
};

export var ray_intersectObjects = (ray, objects) => {
  return []
    .concat(...objects.map(object => ray_intersectsMesh(ray, object)))
    .sort((a, b) => a.distance - b.distance);
};
