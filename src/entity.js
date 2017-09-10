// @flow

export type Entity<T> = T & {
  components: Component[],
};

export interface Component {
  parent: ?Object,
  update(): void,
}

export var entity_create = <T: Object>(object: T): Entity<T> => {
  return Object.assign(
    {
      components: [],
    },
    object,
  );
};

export var component_create = <T: Object>(options: T): T & Component => {
  return Object.assign(
    {
      parent: undefined,
      update() {},
    },
    options,
  );
};

export var entity_add = <T: Object>(entity: Entity<T>, ...components: Component[]) => {
  components.map(component => {
    if (entity_has(entity, component)) {
      return;
    }

    component.parent = entity;
    entity.components.push(component);
  });

  return entity;
};

export var entity_has = <T: Object>(entity: Entity<T>, component: Component) => {
  return entity.components.includes(component);
};

export var entity_find = <T: Object>(entity: Entity<T>, predicate: Function): ?Component => {
  return entity.components.find(predicate);
};

export var entity_filter = <T: Object>(entity: Entity<T>, predicate: Function): Component[] => {
  return entity.components.filter(predicate);
};

export var entity_remove = <T: Object>(entity: Entity<T>, ...components: Component[]) => {
  components.map(component => {
    var index = entity.components.indexOf(component);

    if (index >= 0) {
      entity.components
        .splice(index, 1)
        .map(component => (component.parent = undefined));
    }
  });
};

export var entity_update = <T: Object>(entity: Entity<T>, ...args: *[]) => {
  entity.components.map(component => component.update(...args));
};

export var is_entity = (object: Object) => object.components;
