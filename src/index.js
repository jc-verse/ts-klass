export default function klass(proto) {
  const { constructor, ...methods } = proto;

  const [staticFields] = Object.entries(methods).reduce(
    (acc, [key, value]) => {
      const trimmedKey = key.trim();
      if (trimmedKey.startsWith("static ")) {
        acc[0].push([trimmedKey.replace(/^static /, "").trim(), value]);
        delete methods[key];
      } else {
        acc[1].push([key, value]);
      }
      return acc;
    },
    [[], []],
  );

  function _klass(...args) {
    const instance = Object.create(methods);
    if (!Object.hasOwn(proto, "constructor")) {
      const props = args[0];
      if (props) {
        Object.defineProperties(
          instance,
          Object.fromEntries(
            Object.keys(props).map((k) => [
              k,
              {
                enumerable: true,
                configurable: true,
                writable: true,
                value: props[k],
              },
            ]),
          ),
        );
      }
    } else {
      constructor.call(instance, ...args);
    }
    return instance;
  }
  staticFields.forEach(([key, value]) => {
    _klass[key] = value;
  });
  _klass.new = _klass;
  _klass[klassMarker] = true;
  return _klass;
}

const klassMarker = Symbol("klass");

export function nеw(someKlass) {
  if (!someKlass[klassMarker])
    throw new Error("nеw should only be called on klasses");
  return someKlass;
}
