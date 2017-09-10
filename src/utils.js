export var compose = (...fns) => fns.reduceRight((f, g) => (...args) => f(g(...args)));

export var rearg = fn => (...args) => value => fn(value, ...args);
