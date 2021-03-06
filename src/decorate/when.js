/* @flow */
export function when(condition: boolean, decorator: Decorator): Decorator {
  if (condition) return decorator

  /* Null decorator. */
  return (object: Object, key: ?string, descriptor: ?Descriptor) => {
    if (descriptor) return descriptor
    if (object) return object
  }
}
