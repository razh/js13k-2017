import { boxGeom_create } from './boxGeom';
import { $translateY } from './boxTransforms';
import fbm from './fbm';
import { translate } from './geom';
import { randFloatSpread } from './math';
import { vec3_create } from './vec3';
import { compose } from './utils';

export var terrain_create = (map, scale = vec3_create(1, 1, 1)) => {
  var geoms = [];

  map.map((row, i) =>
    row.map((height, j) => {
      if (i < map.length - 1 && j < row.length - 1) {
        geoms.push(
          compose(
            translate(scale.x * (j + 0.5), 0, scale.z * (i + 0.5)),
            $translateY({
              nx_py_nz: scale.y * height,
              px_py_nz: scale.y * row[j + 1],
              nx_py_pz: scale.y * map[i + 1][j],
              px_py_pz: scale.y * map[i + 1][j + 1],
            }),
          )(boxGeom_create(scale.x, scale.y, scale.z))
        );
      }
    }),
  );

  return geoms;
};

export var terrain_fromStringArray = (strings, heights) => {
  return strings.map(string =>
    string.split('').map(char => heights.indexOf(char))
  );
};

// http://www.playfuljs.com/realistic-terrain-in-130-lines/
export var terrain_diamondSquare = (detail, roughness = 0.5) => {
  var segments = (2 ** detail) + 1;
  var max = segments - 1;

  var map = [];
  for (var i = 0; i < segments; i++) {
    map[i] = [];
  }

  var get = (x, z) => {
    if (0 > x || x > max || 0 > z || z > max) {
      return -1;
    }

    return map[z][x] || 0;
  };

  var set = (x, z, y) => {
    map[z][x] = Math.max(y, 0);
  };

  var average = array => {
    var valid = array.filter(y => y !== -1);
    return valid.reduce((a, b) => (a + b), 0) / valid.length;
  };

  var square = (x, z, size, offset) => {
    set(x, z, average([
      get(x - size, z - size), // top left
      get(x + size, z - size), // top right
      get(x + size, z + size), // bottom right
      get(x - size, z + size), // bottom left
    ]) + offset);
  };

  var diamond = (x, z, size, offset) => {
    set(x, z, average([
      get(x, z - size), // top
      get(x + size, z), // right
      get(x, z + size), // bottom
      get(x - size, z), // left
    ]) + offset);
  };

  var divide = size => {
    var half = size / 2;
    if (half < 1) {
      return;
    }

    var x;
    var z;
    var scale = roughness * size;

    for (z = half; z < max; z += size) {
      for (x = half; x < max; x += size) {
        square(x, z, half, randFloatSpread(scale));
      }
    }

    for (z = 0; z <= max; z += half) {
      for (x = (z + half) % size; x <= max; x += size) {
        diamond(x, z, half, randFloatSpread(scale));
      }
    }

    divide(size / 2);
  };

  set(0, 0, max);
  set(max, 0, max / 2);
  set(max, max, 0);
  set(0, max, max / 2);

  divide(max);

  return map;
};

export var terrain_fbm = (width, depth) => {
  var map = [];

  for (var z = 0; z < depth; z++) {
    map[z] = [];

    for (var x = 0; x < width; x++) {
      map[z][x] = fbm(z, x);
    }
  }

  return map;
};
