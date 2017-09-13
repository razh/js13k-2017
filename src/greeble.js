import { box3_create, box3_setFromPoints } from './box3';
import { geom_create, geom_translate, geom_merge } from './geom';
import { vec3_create, vec3_addScaledVector } from './vec3';
import { sample } from './utils';

var randomPointInTriangle = (vA, vB, vC) => {
  var a = Math.random();
  var b = Math.random();

  if ((a + b) > 1) {
    a = 1 - a;
    b = 1 - b;
  }

  var c = 1 - a - b;

  return (
    vec3_addScaledVector(
      vec3_addScaledVector(
        vec3_addScaledVector(vec3_create(), vA, a),
        vB,
        b,
      ),
      vC,
      c,
    )
  );
};

var randomPointInFace = (face, geom) => {
  return randomPointInTriangle(
    geom.vertices[face.a],
    geom.vertices[face.b],
    geom.vertices[face.c],
  );
};

var emptyGeometry = geom_create();

export var greeble = (geom, count = 0, fn = () => emptyGeometry) => {
  var greebles = geom_create();
  var box = box3_setFromPoints(box3_create(), geom.vertices);

  while (count--) {
    var face = sample(geom.faces);
    var point = randomPointInFace(face, geom);

    geom_merge(greebles, geom_translate(fn(point, box), point.x, point.y, point.z));
  }

  return greebles;
};
