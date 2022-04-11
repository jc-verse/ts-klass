export default function klass(proto) {
  function _klass(instance) {
    return Object.create(
      proto,
      Object.fromEntries(
        Object.keys(instance).map((k) => [k, { value: instance[k] }]),
      ),
    );
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
