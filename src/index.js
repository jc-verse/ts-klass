function klassCreator(body, name) {
  if (typeof body !== "object" || !body)
    throw new Error("You can't create a klass with a non-object body.");

  const constructor = Object.hasOwn(body, "constructor")
    ? (() => {
        const constructor = body.constructor;
        delete body.constructor;
        return constructor;
      })()
    : function defaultConstructor(props) {
        if (!props) return;
        Object.defineProperties(
          // eslint-disable-next-line @typescript-eslint/no-invalid-this
          this,
          Object.fromEntries(
            Object.keys(props).map((k) => [
              k,
              {
                value: props[k],
                configurable: true,
                enumerable: true,
                writable: true,
              },
            ]),
          ),
        );
      };

  const [staticFields, instanceFields] = Object.entries(body).reduce(
    (acc, [key, value]) => {
      const trimmedKey = key.trim();
      if (trimmedKey.startsWith("static "))
        acc[0].push([trimmedKey.replace(/^static /, "").trim(), value]);
      else acc[1].push([key, value]);
      return acc;
    },
    [[], []],
  );

  function SomeKlass(...args) {
    if (new.target) {
      throw new Error(
        'Please don\'t new a klass, because we hate new. Call it directly or use the "nеw" API.',
      );
    }
    const instance = Object.create(SomeKlass.prototype);
    constructor.apply(instance, args);
    return instance;
  }
  // Static fields are defined on the constructor
  staticFields.forEach(([key, value]) => {
    SomeKlass[key] = value;
  });
  // Instance fields are defined on constructor.prototype
  instanceFields.forEach(([key, value]) => {
    SomeKlass.prototype[key] = value;
  });
  Object.defineProperty(SomeKlass, "name", {
    value: name,
    configurable: true,
    enumerable: false,
    writable: false,
  });
  Object.defineProperty(SomeKlass, "length", {
    value: constructor.length,
    configurable: true,
    enumerable: false,
    writable: false,
  });
  if (name) {
    Object.defineProperty(SomeKlass.prototype, Symbol.toStringTag, {
      value: name,
    });
  }
  // Brand for the newly created klass
  SomeKlass[klassMarker] = true;
  return SomeKlass;
}

export default function klass(bodyOrName) {
  if (typeof bodyOrName === "string") {
    const nameBoundKlassCreator = (body) => {
      if (typeof body === "string") {
        throw new Error(
          `The klass creator already has a name bound as "${bodyOrName}". You can't re-write its name.`,
        );
      }
      return klassCreator(body, bodyOrName);
    };
    Object.defineProperty(nameBoundKlassCreator, "boundName", {
      value: bodyOrName,
      configurable: false,
      enumerable: true,
      writable: false,
    });
    // nameBoundKlassCreator.extends = extend;
    return nameBoundKlassCreator;
  }
  return klassCreator(bodyOrName, "");
}

// function extend(SuperKlass) {
//   if (!isKlass(SuperKlass))
//     throw new Error("You can only extend a klass.");
//   // eslint-disable-next-line @typescript-eslint/no-this-alias, @typescript-eslint/no-invalid-this
//   const klassCreator = this;
//   function derivedKlassCreator(body) {
//     // eslint-disable-next-line @typescript-eslint/no-invalid-this
//     return function extendedKlass(...args) {
//       const instance = NewKlass(...args);
//     };
//   }
//   if (klassCreator.boundName)
//     derivedKlassCreator.boundName = klassCreator.boundName;
//   derivedKlassCreator.baseKlass = SuperKlass;
//   return derivedKlassCreator;
// }

// klass.extends = extend;

const klassMarker = Symbol("klass");

export const isKlass = (maybeKlass) => Boolean(maybeKlass[klassMarker]);

Object.defineProperty(klass, Symbol.hasInstance, { value: isKlass });

export function nеw(someKlass) {
  if (!isKlass(someKlass))
    throw new Error("nеw should only be called on klasses");
  return someKlass;
}
