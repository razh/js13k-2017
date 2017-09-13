import { noise2d } from './noise';

var octaves = 8;
var period = 16;
var lacunarity = 2;
var gain = 0.5;

export default (x, y) => {
  var frequency = 1 / period;
  var amplitude = gain;

  var sum = 0;
  for (var i = 0; i < octaves; i++) {
    sum += amplitude * noise2d(x * frequency, y * frequency);

    frequency *= lacunarity;
    amplitude *= gain;
  }

  return sum;
};
