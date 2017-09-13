export var compose = (...fns) => fns.reduceRight((f, g) => (...args) => f(g(...args)));

export var rearg = fn => (...args) => value => fn(value, ...args);

export var sample = array => {
  return array[Math.floor(Math.random() * array.length)];
};

export var uniq = array => [...new Set(array)];
