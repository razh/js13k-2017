import { box3_create, box3_copy, box3_translate } from './box3';
import { boxGeom_create } from './boxGeom';
import { align, $scale, $translateY } from './boxTransforms';
import { component_create, entity_find } from './entity';
import { entity_add } from './entity';
import { geom_clone, geom_merge, geom_translate, scale } from './geom';
import { material_create } from './material';
import { mesh_create } from './mesh';
import { object3d_add, object3d_lookAt } from './object3d';
import {
  physics_add,
  physics_bodies,
  is_physics_component,
  BODY_DYNAMIC,
} from './physics';
import { ray_create, ray_intersectBox, ray_intersectObjects } from './ray';
import {
  vec3_create,
  vec3_addVectors,
  vec3_distanceTo,
  vec3_distanceToSquared,
  vec3_length,
  vec3_multiplyScalar,
  vec3_normalize,
  vec3_set,
  vec3_subVectors,
} from './vec3';
import { compose, sample } from './utils';

var STATE_SEARCHING = 1;
var STATE_FOUND = 2;

export var seeker_create = () => {
  var beamHeight = 256;
  var innerBeamSize = 0.5;
  var outerBeamSize = 0.75;

  // Beams
  var transformBeam = compose(
    align('ny'),
    scale(-1, 1, 1),
    $translateY({ all: 1 }),
  );

  // Inner beam
  var innerBeamGeom = transformBeam(boxGeom_create(
    innerBeamSize,
    beamHeight,
    innerBeamSize,
  ));

  var innerBeamMaterial = material_create();
  vec3_set(innerBeamMaterial.emissive, 1, 1, 1);

  var innerBeam = mesh_create(innerBeamGeom, innerBeamMaterial);

  // Outer beam
  var outerBeamGeom = transformBeam(boxGeom_create(
    outerBeamSize,
    beamHeight,
    outerBeamSize,
  ));

  var outerBeamMaterial = material_create();
  vec3_set(outerBeamMaterial.emissive, 1, 0.25, 0.25);

  var outerBeam = mesh_create(outerBeamGeom, outerBeamMaterial);

  // Seeker ray.
  var rayGeometry = align('nz')(boxGeom_create(0.1, 0.1, 1));
  var rayMaterial = material_create();
  vec3_set(rayMaterial.emissive, 1, 0.5, 0.5);
  var rayMesh = mesh_create(rayGeometry, rayMaterial);

  // Seeker body
  var headDimensions = [0.8, 1, 0.8];

  var headGeometry = compose(
    $scale({ ny: [0, 1, 0] }),
    align('py'),
  )(boxGeom_create(...headDimensions));

  var armGeometry = geom_merge(
    compose(
      $scale({ pz: [0, 0, 1] }),
      align('nz'),
    )(boxGeom_create(0.6, 0.6, 1.5)),

    compose(
      $scale({ nz: [0, 0, 1] }),
      align('pz'),
    )(boxGeom_create(0.6, 0.6, 1))
  );

  var leftArmGeometry = geom_translate(geom_clone(armGeometry), -headDimensions[0], 0, 0);
  var rightArmGeometry = geom_translate(geom_clone(armGeometry), headDimensions[0], 0, 0);

  var torsoGeometry = geom_merge(
    compose(
      $scale({ py: [0, 1, 0] }),
      align('ny'),
    )(boxGeom_create(...headDimensions)),

    geom_clone(headGeometry),
  );

  geom_translate(headGeometry, 0, headDimensions[1], 0);
  geom_translate(torsoGeometry, 0, -headDimensions[1], 0);

  var geom = [
    headGeometry,
    leftArmGeometry,
    rightArmGeometry,
    torsoGeometry,
  ].reduce(geom_merge);
  var material = material_create();
  vec3_set(material.color, 0.5, 0.5, 0.5);
  vec3_set(material.specular, 1, 1, 1);
  vec3_set(material.emissive, 0.5, 0, 0.1);

  var seeker = physics_add(mesh_create(geom, material), BODY_DYNAMIC);
  object3d_add(seeker, innerBeam);
  object3d_add(seeker, outerBeam);
  object3d_add(seeker, rayMesh);
  var ray = ray_create();
  var rotation = Math.random() * 2 * Math.PI;
  var defaultRotationVelocity = Math.PI;
  var rotationVelocity = defaultRotationVelocity;
  var target = vec3_create();

  var vector = vec3_create();
  var playerBox = box3_create();

  var state = STATE_SEARCHING;

  var previousNode;
  var currentNode;

  return entity_add(seeker, component_create({
    update(component, dt, scene) {
      var { player, walls } = scene;

      if (state === STATE_SEARCHING) {
        // Rotate seeker ray.
        rotation += (rotationVelocity * dt) % (2 * Math.PI);
      } else if (state === STATE_FOUND) {
        // Look at player directly.
        var delta = vec3_subVectors(vector, player.position, seeker.position);
        rotation = Math.atan2(delta.z, delta.x);
      }

      Object.assign(ray.origin, seeker.position);
      vec3_set(ray.direction, Math.cos(rotation), 0, Math.sin(rotation));

      // Look where we're aiming.
      vec3_addVectors(target, ray.origin, ray.direction);
      object3d_lookAt(seeker, target);

      // Only get intersections that the seeker is facing towards.
      var intersections = ray_intersectObjects(ray, walls)
        .filter(intersection => intersection.t > 0);

      var distance;
      if (intersections.length) {
        distance = intersections[0].distance;
      }

      var canSeePlayer = false;

      box3_copy(playerBox, entity_find(player, is_physics_component).boundingBox);
      box3_translate(playerBox, player.position);
      var playerIntersectionPoint = ray_intersectBox(ray, playerBox);
      // I see you.
      if (playerIntersectionPoint) {
        var playerIntersectionDistance = vec3_distanceTo(playerIntersectionPoint, seeker.position);
        if (playerIntersectionDistance < distance) {
          canSeePlayer = true;
          object3d_lookAt(seeker, Object.assign(target, player.position, {
            y: seeker.position.y,
          }));
          distance = playerIntersectionDistance;
        }
      }

      rayMesh.scale.z = distance;

      if (canSeePlayer) {
        rotationVelocity = 0;
        state = STATE_FOUND;
        _o.classList.add('e');
        player.state.hits++;
        setTimeout(() => _o.classList.remove('e'), 300);
      } else {
        rotationVelocity = defaultRotationVelocity;
        state = STATE_SEARCHING;
      }

      var physics = entity_find(seeker, is_physics_component);
      var velocity = physics.velocity;
      if (state === STATE_SEARCHING) {
        // Movement.
        var { nodes, navMesh } = scene;

        var findNearestNode = () => {
          var minNode;
          var minDistanceSquared = Infinity;
          var distanceSquared;

          nodes.map(node => {
            distanceSquared = vec3_distanceToSquared(seeker.position, node);
            if (distanceSquared < minDistanceSquared) {
              minDistanceSquared = distanceSquared;
              minNode = node;
            }
          });

          return minNode;
        };

        if (!previousNode) {
          previousNode = findNearestNode();
        }

        var distanceToNode = Infinity;
        if (currentNode) {
          vec3_subVectors(vector, currentNode, seeker.position);
          vector.y = 0;
          distanceToNode = vec3_length(vector);
        }

        if (!currentNode || distanceToNode < 5) {
          do {
            var candidateNodes = navMesh[nodes.indexOf(previousNode)];
            currentNode = nodes[sample(candidateNodes)];
          } while (currentNode === previousNode);

          previousNode = currentNode;
        }

        velocity = vec3_subVectors(physics.velocity, currentNode, seeker.position);
      } else if (state === STATE_FOUND) {
        velocity = vec3_subVectors(physics.velocity, player.position, seeker.position);
      }

      velocity.y = 0;
      vec3_multiplyScalar(vec3_normalize(velocity), 10);
    },
  }));
};
