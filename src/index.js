// eslint-disable-next-line no-restricted-syntax
const Constructors = new WeakMap();

function defineProperties(obj, properties) {
  properties.forEach(([key, value]) => {
    Object.defineProperty(obj, key, {
      value,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  });
}

function splitBody(body) {
  const staticFields = [],
    instanceFields = [],
    instanceMethods = [];
  Object.entries(body).forEach(([key, value]) => {
    const trimmedKey = key.trim();
    if (trimmedKey.startsWith("static "))
      staticFields.push([trimmedKey.replace(/^static /, "").trim(), value]);
    // TODO: `{ foo() {} }` and `{ foo: function () {} }` should be
    // differentiated, the latter is still a class field, not a method
    else if (typeof value === "function") instanceMethods.push([key, value]);
    else instanceFields.push([key, value]);
  });
  return { staticFields, instanceFields, instanceMethods };
}

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
  if (SuperKlass && !isKlass(SuperKlass))
    throw new Error("You can only extend klasses.");

  const constructor = Object.hasOwn(body, "constructor")
    ? (() => {
        const customCtor = body.constructor;
        delete body.constructor;
        function constructor(...args) {
          // eslint-disable-next-line @typescript-eslint/no-invalid-this
          defineProperties(this, instanceFields);
          // eslint-disable-next-line @typescript-eslint/no-invalid-this
          customCtor.apply(this, args);
        }
        Object.defineProperty(constructor, "length", {
          value: customCtor.length,
        });
        return constructor;
      })()
    : function defaultConstructor(props = {}) {
        // eslint-disable-next-line @typescript-eslint/no-invalid-this
        defineProperties(this, [...instanceFields, ...Object.entries(props)]);
      };

  function SomeKlass(...args) {
    if (new.target) {
      throw new Error(
        'Please don\'t new a klass, because we hate new. Call it directly or use the "nеw" API.',
      );
    }
    const instance = Object.create(SomeKlass.prototype);
    Constructors.get(SuperKlass)?.apply(instance, args);
    constructor.apply(instance, args);
    return instance;
  }
  Constructors.set(SomeKlass, constructor);
  if (SuperKlass) {
    Object.setPrototypeOf(SomeKlass, SuperKlass);
    Object.setPrototypeOf(SomeKlass.prototype, SuperKlass.prototype);
    // For accessing `super` in the body. We don't allow `super` in static
    // methods yet, but we should figure out a way to (probably through chaining
    // another `.static({})` block that binds another prototype)
    Object.setPrototypeOf(body, SuperKlass.prototype);
  }
  const { staticFields, instanceMethods, instanceFields } = splitBody(body);

  // Static fields are defined on the constructor
  staticFields.forEach(([key, value]) => {
    SomeKlass[key] = value;
  });
  // Instance methods are defined on constructor.prototype
  instanceMethods.forEach(([key, value]) => {
    SomeKlass.prototype[key] = value;
  });
  Object.defineProperty(SomeKlass, "name", { value: name });
  Object.defineProperty(SomeKlass, "length", { value: constructor.length });
  Object.defineProperty(SomeKlass.prototype, Symbol.toStringTag, {
    value: name || "Object",
  });
  // Brand for the newly created klass
  SomeKlass[klassMarker] = true;
  return SomeKlass;
}

function bindKlassName(klassCtor, name) {
  Object.defineProperty(klassCtor, "boundName", {
    value: name,
    configurable: false,
    enumerable: true,
    writable: false,
  });
}

export default function klass(bodyOrName) {
  if (typeof bodyOrName === "string") {
    const nameBoundKlassCreator = (body) =>
      klassCreator(body, bodyOrName, null);
    nameBoundKlassCreator.extends = (SuperKlass) => {
      const creator = (body) => klassCreator(body, bodyOrName, SuperKlass);
      bindKlassName(creator, bodyOrName);
      return creator;
    };
    bindKlassName(nameBoundKlassCreator, bodyOrName);
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
