import { ease_linear } from './easings';

export var tween_create = ({
  duration = 0,
  delay = 0,
  ease = ease_linear,
}) => {
  return {
    duration,
    delay,
    ease,
  };
};
