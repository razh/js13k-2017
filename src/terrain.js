import { boxGeom_create } from './boxGeom';
import { $translateY } from './boxTransforms';
import { translate } from './geom';
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
