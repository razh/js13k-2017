// @flow

import { geom_translate } from './geom';
import boxIndices from './boxIndices';
import {
  vec3_create,
  vec3_add,
  vec3_divideScalar,
  vec3_fromArray,
  vec3_multiply,
  vec3_set,
  vec3_setScalar,
  vec3_setX,
  vec3_setY,
  vec3_setZ,
  vec3_subVectors,
} from './vec3';
import { rearg } from './utils';

var computeCentroid = (geom, indices, vector = vec3_create()) => {
  vec3_set(vector, 0, 0, 0);

  indices.map(index => vec3_add(vector, geom.vertices[index]));
  vec3_divideScalar(vector, indices.length);

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

var transformBoxVertices = (() => {
  var vector = vec3_create();

  return (method, identity = vec3_create()) => {
    var baseTransform = (geom, indices, delta, ...args) => {
      if (Array.isArray(delta)) {
        vec3_fromArray(vector, delta);
      } else if (typeof delta === 'object') {
        Object.assign(vector, identity, delta);
      } else if (typeof delta === 'number') {
        vec3_setScalar(vector, delta);
      } else {
        return geom;
      }

      indices.map(index => method(geom.vertices[index], vector, ...args));
      return geom;
    };

    return (geom, vectors, ...args) => {
      if (typeof vectors === 'string') {
        return baseTransform(geom, vectors, ...args);
      } else if (typeof vectors === 'object') {
        Object.keys(vectors).map(key => {
          var delta = vectors[key];
          baseTransform(geom, key, delta, ...args);
        });
      }

      return geom;
    };
  };
})();

export var translateVertices = rearg(transformBoxVertices(vec3_add));
export var scaleVertices = rearg(transformBoxVertices(vec3_multiply, vec3_create(1, 1, 1)));

var callBoxVertices = method => {
  var baseCall = (geom, indices, ...args) => {
    indices.map(index => method(geom.vertices[index], ...args));
    return geom;
  };

  return (geom, vectors, ...args) => {
     if (typeof vectors === 'string') {
       return baseCall(geom, vectors, ...args);
     } else if (typeof vectors === 'object') {
       Object.keys(vectors).map(key => {
         var value = vectors[key];
         baseCall(geom, key, value, ...args);
       });
     }

     return geom;
   };
};

export var set = rearg(callBoxVertices(vec3_set));
export var setX = rearg(callBoxVertices(vec3_setX));
export var setY = rearg(callBoxVertices(vec3_setY));
export var setZ = rearg(callBoxVertices(vec3_setZ));
