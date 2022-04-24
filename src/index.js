function klassCreator(body, name, SuperKlass) {
  if (typeof body === "string") {
    if (name) {
      throw new Error(
        `The klass creator already has a name bound as "${name}". You can't re-write its name.`,
      );
    } else {
      throw new Error(
        `The klass creator already has a super klass. Please bind the name before attaching super klass.`,
      );
    }
  }
  if (typeof body !== "object" || !body)
    throw new Error("You can't create a klass with a non-object body.");
  if (!isKlass(SuperKlass)) throw new Error("You can only extend klasses.");

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
  });
  Object.defineProperty(SomeKlass, "length", {
    value: constructor.length,
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
    const nameBoundKlassCreator = (body) =>
      klassCreator(body, bodyOrName, null);
    nameBoundKlassCreator.extends = (SuperKlass) => (body) =>
      klassCreator(body, bodyOrName, SuperKlass);
    [nameBoundKlassCreator, nameBoundKlassCreator.extends].forEach((o) => {
      Object.defineProperty(o, "boundName", {
        value: bodyOrName,
        configurable: false,
        enumerable: true,
        writable: false,
      });
    });
    return nameBoundKlassCreator;
  }
  return klassCreator(bodyOrName, "", null);
}

klass.extends = (SuperKlass) => (body) => klassCreator(body, "", SuperKlass);

const klassMarker = Symbol("klass");

export const isKlass = (maybeKlass) => Boolean(maybeKlass[klassMarker]);

Object.defineProperty(klass, Symbol.hasInstance, { value: isKlass });

export function nеw(someKlass) {
  if (!isKlass(someKlass))
    throw new Error("nеw should only be called on klasses.");
  return someKlass;
}
