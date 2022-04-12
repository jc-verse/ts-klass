export default function klass(bodyOrName) {
  if (typeof bodyOrName === "string") {
    // eslint-disable-next-line func-style
    const nameBoundKlassCreator = function nameBoundKlassCreator(body) {
      if (typeof body === "string") {
        throw new Error(
          `The klass creator already has a name bound as "${bodyOrName}". You can't re-write its name.`,
        );
      }
      const NewKlass = klass(body);
      Object.defineProperty(NewKlass, "name", {
        value: bodyOrName,
        configurable: true,
        enumerable: false,
        writable: false,
      });
      return NewKlass;
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
  if (typeof bodyOrName !== "object" || !bodyOrName)
    throw new Error("You can't create a klass with a non-object body.");
  const body = bodyOrName;
  // Ignore existing prototype chain on body
  Object.setPrototypeOf(body, Object.prototype);
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

  const [staticFields] = Object.entries(body).reduce(
    (acc, [key, value]) => {
      const trimmedKey = key.trim();
      if (trimmedKey.startsWith("static ")) {
        acc[0].push([trimmedKey.replace(/^static /, "").trim(), value]);
        delete body[key];
      } else {
        acc[1].push([key, value]);
      }
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
    const instance = Object.create(body);
    constructor.call(instance, ...args);
    return instance;
  }
  // Static fields are defined on the constructor
  staticFields.forEach(([key, value]) => {
    SomeKlass[key] = value;
  });
  // Base name; may be overridden later if the klass creator is called inside a
  // name-bound one
  Object.defineProperty(SomeKlass, "name", {
    value: "",
    configurable: true,
    enumerable: false,
    writable: false,
  });
  // Reflection: instance.__proto__.constructor
  Object.defineProperty(body, "constructor", {
    value: SomeKlass,
    configurable: true,
    enumerable: false,
    writable: true,
  });
  // Brand for the newly created klass
  SomeKlass[klassMarker] = true;
  return SomeKlass;
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

export function nеw(someKlass) {
  if (!isKlass(someKlass))
    throw new Error("nеw should only be called on klasses");
  return someKlass;
}
