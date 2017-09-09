// @flow

import type { Object3D } from './object3d';
import type { Mesh } from './mesh';

export type Entity = {
  components: Component[],
};

export type Object3DEntity = Object3D & Entity;
export type MeshEntity = Mesh & Entity;

export interface Component {
  parent: ?Object,
  update(): void,
}

export var entity_create = <T: Object>(object: T): T & Entity => {
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

export var entity_add = (entity: Entity, ...components: Component[]) => {
  components.map(component => {
    if (entity_has(entity, component)) {
      return;
    }

    component.parent = entity;
    entity.components.push(component);
  });
};

export var entity_has = (entity: Entity, component: Component) => {
  return entity.components.includes(component);
};

export var entity_find = (entity: Entity, predicate: Function): ?Component => {
  return entity.components.find(predicate);
};

export var entity_filter = (entity: Entity, predicate: Function): Component[] => {
  return entity.components.filter(predicate);
};

export var entity_remove = (entity: Entity, ...components: Component[]) => {
  components.map(component => {
    var index = entity.components.indexOf(component);

    if (index >= 0) {
      entity.components
        .splice(index, 1)
        .map(component => (component.parent = undefined));
    }
  });
};

export var entity_update = (entity: Entity, ...args: *[]) => {
  entity.components.map(component => component.update(...args));
};

export var is_entity = (object: Object) => object.components;
