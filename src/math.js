export var clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

export var randFloat = (low, high) => {
  return low + Math.random() * (high - low);
};

export var randFloatSpread = range => {
  return range * (0.5 - Math.random());
};
