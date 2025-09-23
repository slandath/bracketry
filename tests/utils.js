import { createBracket } from "../index.js";

export const deep_clone_object = (obj) => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  let temp = new obj.constructor();
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      temp[key] = deep_clone_object(obj[key]);
    }
  }
  return temp;
};

export const create_wrapper = () => {
  const wrapper = document.createElement("div");
  document.body.append(wrapper);
  return wrapper;
};

export const init = (data, options) => {
  const wrapper = create_wrapper();
  return {
    bracket: createBracket(data, wrapper, options),
    wrapper,
  };
};
