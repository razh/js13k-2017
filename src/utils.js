// @flow

export var compose = (...fns: Function[]) => fns.reduceRight((f, g) => (...args) => f(g(...args)));

export var rearg = (fn: Function) => (...args: *[]) => (value: any) => fn(value, ...args);
