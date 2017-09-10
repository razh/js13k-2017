import { boxGeom_create } from './boxGeom';
import { $translateY } from './boxTransforms';
import { translate } from './geom';
import { vec3_create } from './vec3';
import { compose } from './utils';

export var terrain_create = (map, heights, scale = vec3_create(1, 1, 1)) => {
  var height = char => scale.y * heights.indexOf(char);

  var geoms = [];

  map.map((row, i) =>
    row.split('').map((char, j) => {
      if (i < map.length - 1 && j < row.length - 1) {
        geoms.push(
          compose(
            translate(j * scale.x, 0, i * scale.z),
            $translateY({
              nx_py_nz: height(char),
              px_py_nz: height(row[j + 1]),
              nx_py_pz: height(map[i + 1][j]),
              px_py_pz: height(map[i + 1][j + 1]),
            }),
          )(boxGeom_create(scale.x, scale.y, scale.z))
        );
      }
    }),
  );

  return geoms;
};
