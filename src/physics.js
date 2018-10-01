import {
  box3_create,
  box3_copy,
  box3_intersectsBox,
  box3_setFromObject,
  box3_translate,
} from './box3.js';
import {
  component_create,
  entity_add,
  entity_filter,
} from './entity.js';
import { object3d_traverse } from './object3d.js';
import { ray_create, ray_intersectsMesh } from './ray.js';
import {
  vec3_create,
  vec3_add,
  vec3_addScaledVector,
  vec3_multiplyScalar,
  vec3_set,
  vec3_sub,
} from './vec3.js';

export var BODY_STATIC = 1;
export var BODY_DYNAMIC = 2;

export var SHAPE_BOX = 1;
export var SHAPE_HEIGHTFIELD = 2;

export var physics_create = (entity, physics) => {
  return component_create({
    physics,
    shape: SHAPE_BOX,
    boundingBox: box3_setFromObject(box3_create(), entity),
    velocity: vec3_create(),
    update(component, dt) {
      vec3_addScaledVector(component.parent.position, component.velocity, dt);
    },
  });
};

export var physics_add = (entity, physics) => {
  return entity_add(entity, physics_create(entity, physics));
};

export var is_physics_component = object => object.physics;

export var physics_bodies = object => {
  var bodies = [];

  object3d_traverse(object, node => {
    bodies.push(...entity_filter(node, is_physics_component));
  });

  return bodies;
};

var narrowPhase = (() => {
  var penetration = vec3_create();
  var ray = ray_create();

  return {
    [SHAPE_BOX | SHAPE_BOX](bodyA, bodyB, boxA, boxB) {
      // Determine overlap.
      // d0 is negative side or 'left' side.
      // d1 is positive or 'right' side.
      var d0x = boxB.max.x - boxA.min.x;
      var d1x = boxA.max.x - boxB.min.x;

      var d0y = boxB.max.y - boxA.min.y;
      var d1y = boxA.max.y - boxB.min.y;

      var d0z = boxB.max.z - boxA.min.z;
      var d1z = boxA.max.z - boxB.min.z;

      // Only overlapping on an axis if both ranges intersect.
      var dx = 0;
      if (d0x > 0 && d1x > 0) {
        dx = d0x < d1x ? d0x : -d1x;
      }

      var dy = 0;
      if (d0y > 0 && d1y > 0) {
        dy = d0y < d1y ? d0y : -d1y;
      }

      var dz = 0;
      if (d0z > 0 && d1z > 0) {
        dz = d0z < d1z ? d0z : -d1z;
      }

      // Determine minimum axis of separation.
      var adx = Math.abs(dx);
      var ady = Math.abs(dy);
      var adz = Math.abs(dz);

      if (adx < ady && adx < adz) {
        vec3_set(penetration, dx, 0, 0);
      } else if (ady < adz) {
        vec3_set(penetration, 0, dy, 0);
      } else {
        vec3_set(penetration, 0, 0, dz);
      }

      var objectA = bodyA.parent;
      var objectB = bodyB.parent;

      if (bodyA.physics === BODY_STATIC) {
        vec3_sub(objectB.position, penetration);
      } else if (bodyB.physics === BODY_STATIC) {
        vec3_add(objectA.position, penetration);
      } else {
        vec3_multiplyScalar(penetration, 0.5);
        vec3_add(objectA.position, penetration);
        vec3_sub(objectB.position, penetration);
      }
    },

    [SHAPE_BOX | SHAPE_HEIGHTFIELD](bodyA, bodyB, boxA, boxB) {
      if (bodyA.shape === SHAPE_HEIGHTFIELD) {
        [bodyA, bodyB] = [bodyB, bodyA];
        [boxA, boxB] = [boxB, boxA];
      }

      var box = boxA;
      var boxObject = bodyA.parent;
      var heightfieldObject = bodyB.parent;

      Object.assign(ray.origin, boxObject.position);
      vec3_set(ray.direction, 0, -1, 0);

      var intersections = ray_intersectsMesh(ray, heightfieldObject);
      if (intersections.length) {
        intersections.sort((a, b) => a.distance - b.distance);

        var point = intersections[0].point;
        var dy = box.min.y - point.y;
        if (dy <= 0) {
          boxObject.position.y -= dy;
        }
      }
    },
  };
})();

export var physics_update = (() => {
  var boxA = box3_create();
  var boxB = box3_create();

  return bodies => {
    var contacts = [];

    for (var i = 0; i < bodies.length; i++) {
      var bodyA = bodies[i];

      for (var j = i + 1; j < bodies.length; j++) {
        var bodyB = bodies[j];

        // Immovable objects.
        if (bodyA.physics === BODY_STATIC && bodyB.physics === BODY_STATIC) {
          return;
        }

        // Two dynamic bodies, or one static and one dynamic body.
        var objectA = bodyA.parent;
        var objectB = bodyB.parent;

        box3_translate(box3_copy(boxA, bodyA.boundingBox), objectA.position);
        box3_translate(box3_copy(boxB, bodyB.boundingBox), objectB.position);

        if (box3_intersectsBox(boxA, boxB)) {
          var contact = narrowPhase[bodyA.shape | bodyB.shape](bodyA, bodyB, boxA, boxB);
          if (contact) {
            contacts.push(contact);
          }
        }
      }
    }

    return contacts;
  };
})();
