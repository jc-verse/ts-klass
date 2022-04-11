export default function klass(proto) {
  const { constructor, ...methods } = proto;

  function _klass(...args) {
    const instance = Object.create(methods);
    if (!Object.hasOwn(proto, "constructor")) {
      const props = args[0];
      Object.defineProperties(
        instance,
        Object.fromEntries(
          Object.keys(props).map((k) => [k, { value: props[k] }]),
        ),
      );
    } else {
      constructor.call(instance, ...args);
    }
    return instance;
  }
  _klass.new = _klass;
  _klass.isKlass = klassMarker;
  return _klass;
}

const klassMarker = Symbol("klass");

export function nеw(someKlass) {
  if (someKlass.isKlass !== klassMarker)
    throw new Error("nеw should only be called on klasses");
  return someKlass;
}
