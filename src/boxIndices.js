// @flow

// Vertices.
// pz-nz order is reversed for the nx side.
export var px_py_pz = [0];
export var px_py_nz = [1];
export var px_ny_pz = [2];
export var px_ny_nz = [3];
export var nx_py_nz = [4];
export var nx_py_pz = [5];
export var nx_ny_nz = [6];
export var nx_ny_pz = [7];

// Edges.
export var px_py = [].concat(px_py_pz, px_py_nz);
export var px_ny = [].concat(px_ny_pz, px_ny_nz);
export var nx_py = [].concat(nx_py_nz, nx_py_pz);
export var nx_ny = [].concat(nx_ny_nz, nx_ny_pz);

export var px_pz = [].concat(px_py_pz, px_ny_pz);
export var px_nz = [].concat(px_py_nz, px_ny_nz);
export var nx_nz = [].concat(nx_py_nz, nx_ny_nz);
export var nx_pz = [].concat(nx_py_pz, nx_ny_pz);

export var py_pz = [].concat(px_py_pz, nx_py_pz);
export var py_nz = [].concat(px_py_nz, nx_py_nz);
export var ny_pz = [].concat(px_ny_pz, nx_ny_pz);
export var ny_nz = [].concat(px_ny_nz, nx_ny_nz);

// Faces.
export var px = [].concat(px_py, px_ny);
export var nx = [].concat(nx_py, nx_ny);
export var py = [].concat(px_py, nx_py);
export var ny = [].concat(px_ny, nx_ny);
export var pz = [].concat(px_pz, nx_pz);
export var nz = [].concat(px_nz, nx_nz);

// All vertices.
export var all = [].concat(px, nx);
