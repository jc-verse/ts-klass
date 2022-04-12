export default function klass(bodyOrName) {
  if (typeof bodyOrName === "string") {
    return function klassWithName(body) {
      if (typeof body === "string")
        {throw new Error(
          `The klass already has a name bound as "${bodyOrName}". You can't re-write its name.`,
        );}
      const aNewKlass = klass(body);
      Object.defineProperty(aNewKlass, "name", {
        value: bodyOrName,
        writable: false,
        enumerable: false,
        configurable: true,
      });
      return aNewKlass;
    };
  }
  const body = bodyOrName;
  const { constructor, ...methods } = body;

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

  function newKlass(...args) {
    const instance = Object.create(methods);
    if (!Object.hasOwn(body, "constructor")) {
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
    Object.defineProperty(methods, "constructor", {
      value: newKlass,
      writable: true,
      enumerable: false,
      configurable: true,
    });
    return instance;
  }
  staticFields.forEach(([key, value]) => {
    newKlass[key] = value;
  });
  Object.defineProperty(newKlass, "name", {
    value: "",
    writable: false,
    enumerable: false,
    configurable: true,
  });
  Object.defineProperty(newKlass, "new", { value: newKlass });
  newKlass[klassMarker] = true;
  return newKlass;
}

// klass.extends = function extend(someKlass) {
//   if (!klass.isKlass(someKlass))
//     throw new Error("You can only extend a klass.");
//   return function subKlass(proto) {

//   }
// };

klass.isKlass = (maybeKlass) => Boolean(maybeKlass[klassMarker]);

const klassMarker = Symbol("klass");

export function nеw(someKlass) {
  if (!klass.isKlass(someKlass))
    throw new Error("nеw should only be called on klasses");
  return someKlass;
}
