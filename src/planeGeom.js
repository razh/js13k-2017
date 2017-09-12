import { geom_create, geom_push } from './geom';

// THREE.PlaneGeometry on XZ plane.
export var planeGeom_create = (width, depth, widthSegments = 1, depthSegments = 1) => {
  var vertices = [];
  var faces = [];

  var halfWidth = width / 2;
  var halfDepth = depth / 2;

  var segmentWidth = width / widthSegments;
  var segmentDepth = depth / depthSegments;

  var x;
  var z;
  var ix;
  var iz;

  for (iz = 0; iz < depthSegments + 1; iz++) {
    z = (iz * segmentDepth) - halfDepth;

    for (ix = 0; ix < widthSegments + 1; ix++) {
      x = (ix * segmentWidth) - halfWidth;
      vertices.push(x, 0, -z);
    }
  }

  for (iz = 0; iz < depthSegments; iz++) {
    for (ix = 0; ix < widthSegments; ix++) {
      var a = ix + (widthSegments + 1) * iz;
      var b = ix + (widthSegments + 1) * (iz + 1);
      var c = (ix + 1) + (widthSegments + 1) * (iz + z);
      var d = (ix + 1) + (widthSegments + 1) * iz;

      faces.push(a, b, d);
      faces.push(b, c, d);
    }
  }

  return geom_push(geom_create(), vertices,faces);
};
