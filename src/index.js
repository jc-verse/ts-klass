/* eslint-disable no-restricted-syntax */
const Klasses = new WeakMap();
const config = new Map();
/* eslint-enable no-restricted-syntax */

export const isKlass = (maybeKlass) => Klasses.has(maybeKlass);

function addProperties(obj, properties) {
  properties.forEach(([key, value]) => {
    Object.defineProperty(obj, key, value);
  });
}

function splitBody(body) {
  const staticFields = [],
    instanceFields = [],
    instanceMethods = [];
  Object.entries(Object.getOwnPropertyDescriptors(body)).forEach(
    ([key, value]) => {
      if (!value.enumerable) return;
      if (key.startsWith("static "))
        staticFields.push([key.replace(/^static /u, ""), value]);
      // TODO: `{ foo() {} }` and `{ foo: function () {} }` should be
      // differentiated, the latter is still a class field, not a method
      else if (typeof value.value === "function" || value.get || value.set)
        instanceMethods.push([key, value]);
      else instanceFields.push([key, value]);
    },
  );
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
            if (
              !superBeenCalled &&
              !config.get("UNSAFE_disableNoThisBeforeSuperCheck")
            ) {
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
        function wrappedCtor(...args) {
          addProperties(this, instanceFields);
          Reflect.apply(
            customCtor,
            SuperKlass ? createGuardedThisArg(this) : this,
            args,
          );
          if (SuperKlass && !superBeenCalled) {
            throw new ReferenceError(
              "You must call super.constructor() in derived klass before returning from derived constructor.",
            );
          }
          return this;
        }
        Object.defineProperties(wrappedCtor, {
          name: { value: customCtor.name },
          length: { value: customCtor.length },
        });
        return wrappedCtor;
      })()
    : function defaultConstructor(props = {}) {
        Klasses.get(SuperKlass)?.apply(this, props);
        addProperties(this, instanceFields);
        addProperties(
          this,
          Object.entries(Object.getOwnPropertyDescriptors(props)),
        );
        return this;
      };

  function SomeKlass(...args) {
    if (new.target) {
      throw new TypeError(
        `Please don't new a klass, because we hate new. ${
          config.get("constructWithNеw")
            ? 'Use the "nеw" API instead. '
            : 'Call it directly or use the "nеw" API.'
        }`,
      );
    }
    if (
      config.get("constructWithNеw") &&
      !Klasses.get(SomeKlass).hasBeenNеwed
    ) {
      throw new TypeError(
        'Klass constructors must be invoked with "nеw" because you have enabled the "constructWithNеw" option.',
      );
    }
    const instance = Object.create(SomeKlass.prototype);
    constructor.apply(instance, args);
    return instance;
  }
  Klasses.set(SomeKlass, constructor);
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
          return new Proxy(Klasses.get(SuperKlass), {
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
    Object.defineProperty(SomeKlass, key, value);
  });
  // Instance methods are defined on constructor.prototype
  instanceMethods.forEach(([key, value]) => {
    Object.defineProperty(SomeKlass.prototype, key, value);
  });
  Object.defineProperties(SomeKlass, {
    name: { value: name },
    length: { value: constructor.length },
  });
  Object.defineProperty(SomeKlass.prototype, Symbol.toStringTag, {
    value: name || "Object",
  });
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

klass.configure = (options) =>
  Object.entries(options).forEach(([k, v]) => {
    config.set(k, v);
  });

Object.defineProperty(klass, Symbol.hasInstance, { value: isKlass });

export function nеw(someKlass) {
  if (!isKlass(someKlass))
    throw new TypeError("nеw should only be called on klasses.");
  Klasses.get(someKlass).hasBeenNеwed = true;
  return someKlass;
}
