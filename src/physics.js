// @flow

import type { Box3 } from './box3';
import type { Entity, MeshEntity, Component } from './entity';
import type { Object3D } from './object3d';

export type PhysicsComponent = Component & {
  parent: ?MeshEntity,
  physics: number,
  boundingBox: Box3,
};

import {
  box3_create,
  box3_copy,
  box3_intersectsBox,
  box3_setFromObject,
  box3_translate,
} from './box3';
import {
  component_create,
  entity_add,
  entity_filter,
  is_entity,
} from './entity';
import { object3d_traverse } from './object3d';
import {
  vec3_create,
  vec3_add,
  vec3_multiplyScalar,
  vec3_set,
  vec3_sub,
} from './vec3';

export var BODY_STATIC = 1;
export var BODY_DYNAMIC = 2;

export var physics_create = (entity: MeshEntity, physics: number): PhysicsComponent => {
  return component_create({
    physics,
    boundingBox: box3_setFromObject(box3_create(), entity),
  });
};

export var physics_add = (entity: MeshEntity, physics: number) => {
  entity_add(entity, physics_create(entity, physics));
};

export var is_physics_component = (object: Object) => object.physics;

export var physics_bodies = (object: Object3D): PhysicsComponent[] => {
  var bodies = [];

  object3d_traverse(object, node => {
    if (is_entity(node)) {
      bodies.push(
        ...((entity_filter(((node: any): MeshEntity), is_physics_component): any): PhysicsComponent[])
      );
    }
  });

  return bodies;
};

export var physics_update = (() => {
  var penetration = vec3_create();

  var boxA = box3_create();
  var boxB = box3_create();

  return (bodies: PhysicsComponent[]) => {
    bodies.map(bodyA => {
      bodies.map(bodyB => {
        if (
          // Same object.
          bodyA === bodyB ||
          // Immovable objects.
          bodyA.physics === BODY_STATIC && bodyB.physics === BODY_STATIC
        ) {
          return;
        }

        var objectA = ((bodyA.parent: any): Object3D);
        var objectB = ((bodyB.parent: any): Object3D);

        // Two dynamic bodies, or one static and one dynamic body.
        box3_translate(box3_copy(boxA, bodyA.boundingBox), objectA.position);
        box3_translate(box3_copy(boxB, bodyB.boundingBox), objectB.position);

        if (box3_intersectsBox(boxA, boxB)) {
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

          if (adx <= ady && ady <= adz) {
            vec3_set(penetration, dx, 0, 0);
          } else if (ady <= adx && ady <= adz) {
            vec3_set(penetration, 0, dy, 0);
          } else {
            vec3_set(penetration, 0, 0, dz);
          }

          if (bodyA.physics === BODY_STATIC) {
            vec3_sub(objectB.position, penetration);
          } else if (bodyB.physics === BODY_STATIC) {
            vec3_add(objectA.position, penetration);
          } else {
            vec3_multiplyScalar(penetration, 0.5);
            vec3_add(objectA.position, penetration);
            vec3_sub(objectB.position, penetration);
          }
        }
      });
    });
  };
})();
