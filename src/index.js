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
    if (key.startsWith("static "))
      staticFields.push([key.replace(/^static /, ""), value]);
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
      throw new TypeError(
        `The klass creator already has a name bound as "${name}". You can't re-write its name.`,
      );
    } else {
      throw new TypeError(
        `The klass creator already has a super klass. Please bind the name before attaching super klass.`,
      );
    }
  }
  if (typeof body !== "object" || !body)
    throw new TypeError("You can't create a klass with a non-object body.");
  if (SuperKlass && !isKlass(SuperKlass))
    throw new TypeError("You can only extend klasses.");

  const { staticFields, instanceMethods, instanceFields } = splitBody(body);

  let superBeenCalled = false;

  function createGuardedThisArg(thisArg) {
    return new Proxy(
      thisArg,
      Object.fromEntries(
        Object.getOwnPropertyNames(Reflect).map((k) => [
          k,
          (...opArgs) => {
            if (!superBeenCalled) {
              throw new ReferenceError(
                `You must call super.constructor() in derived klass before performing '${k}' on 'this'.`,
              );
            }
            return Reflect[k](...opArgs);
          },
        ]),
      ),
    );
  }

  const constructor = Object.hasOwn(body, "constructor")
    ? (() => {
        const customCtor = body.constructor;
        delete body.constructor;
        return new Proxy(customCtor, {
          apply(target, thisArg, args) {
            defineProperties(thisArg, instanceFields);
            Reflect.apply(
              target,
              SuperKlass ? createGuardedThisArg(thisArg) : thisArg,
              args,
            );
            if (SuperKlass && !superBeenCalled) {
              throw new ReferenceError(
                "You must call super.constructor() in derived klass before returning from derived constructor.",
              );
            }
            return thisArg;
          },
        });
      })()
    : function defaultConstructor(props = {}) {
        Constructors.get(SuperKlass)?.apply(this, props);
        defineProperties(this, instanceFields);
        defineProperties(this, Object.entries(props));
        return this;
      };

  function SomeKlass(...args) {
    if (new.target) {
      throw new TypeError(
        'Please don\'t new a klass, because we hate new. Call it directly or use the "nеw" API.',
      );
    }
    const instance = Object.create(SomeKlass.prototype);
    constructor.apply(instance, args);
    return instance;
  }
  Constructors.set(SomeKlass, constructor);
  if (SuperKlass) {
    Object.setPrototypeOf(SomeKlass, SuperKlass);
    Object.setPrototypeOf(SomeKlass.prototype, SuperKlass.prototype);
    // For accessing `super` in the body. We don't properly support `super` in
    // static methods yet, but we should figure out a way to (probably through
    // chaining another `.static({})` block that binds another prototype)
    Object.setPrototypeOf(
      body,
      new Proxy(SuperKlass.prototype, {
        get(target, property) {
          if (property !== "constructor") return Reflect.get(target, property);
          // SuperKlass.prototype.constructor is actually SuperKlass itself, but
          // we proxy it to the constructor function, so that we can support
          // calling `super()` through `super.constructor()`
          return new Proxy(Constructors.get(SuperKlass), {
            apply(ctor, thisArg, args) {
              superBeenCalled = true;
              Reflect.apply(ctor, thisArg, args);
              return thisArg;
            },
          });
        },
      }),
    );
  }

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

export default function klass(bodyOrName) {
  if (typeof bodyOrName === "string") {
    const nameBoundKlassCreator = (body) =>
      klassCreator(body, bodyOrName, null);
    nameBoundKlassCreator.extends = (SuperKlass) => (body) =>
      klassCreator(body, bodyOrName, SuperKlass);
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
    throw new TypeError("nеw should only be called on klasses.");
  return someKlass;
}
