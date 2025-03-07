
type ObjectType = {
  [k: string]: any
}

export const deepMergeObject = (target: ObjectType, source: ObjectType) => {
  if (typeof target === "object" && typeof source === "object") {
    return Object.fromEntries(
      Object.keys(target)
        .concat(Object.keys(source))
        .map((k) => {
          if (
            typeof target[k] === "object" &&
            typeof source[k] === "object"
          ) {
            return [k, deepMergeObject(target[k], source[k])];
          }
          return [k, target[k] || source[k]];
        })
    );
  }
  return target;
}