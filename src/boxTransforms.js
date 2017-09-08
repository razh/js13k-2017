// @flow

import { geom_translate } from './geom';
import boxIndices from './boxIndices';
import {
  vec3_create,
  vec3_add,
  vec3_divideScalar,
  vec3_set,
  vec3_subVectors,
} from './vec3';
import { rearg } from './utils';

var computeCentroid = (geom, indices, vector = vec3_create()) => {
  vec3_set(vector, 0, 0, 0);

  if (Array.isArray(indices)) {
    indices.map(index => vec3_add(vector, geom.vertices[index]));
    vec3_divideScalar(vector, indices.length);
  }

  return vector;
};

var alignBoxVertices = (() => {
  var centroid = vec3_create();

  return (geom, key) => {
    var indices = boxIndices[key];
    computeCentroid(geom, indices, centroid);
    return geom_translate(geom, -centroid.x, -centroid.y, centroid.z);
  };
})();

var relativeAlignBoxVertices = (() => {
  var centroidA = vec3_create();
  var centroidB = vec3_create();
  var delta = vec3_create();

  return (geomA, keyA, geomB, keyB) => {
    var indicesA = boxIndices[keyA];
    var indicesB = boxIndices[keyB];

    computeCentroid(geomA, indicesA, centroidA);
    computeCentroid(geomB, indicesB, centroidB);

    vec3_subVectors(delta, centroidB, centroidA);
    return geom_translate(geomA, delta.x, delta.y, delta.z);
  };
})();

export var align = rearg(alignBoxVertices);
export var relativeAlign = rearg(relativeAlignBoxVertices);
