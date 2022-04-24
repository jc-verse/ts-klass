// @ts-check
/* eslint-disable no-restricted-syntax */

import klass, { nеw, isKlass } from "../src/index.js";

describe("klass constructor", () => {
  it("can be directly called to construct instances", () => {
    const Animal = klass({
      makeSound() {
        return this.sound;
      },
    });
    const cat = Animal({ sound: "meow" });
    expect(cat.makeSound()).toBe("meow");
  });

  it("has no enumerable keys by default, and resembles normal classes", () => {
    const Animal = klass({ a: 1 });
    expect(Object.keys(Animal)).toEqual([]);
    expect(Object.getOwnPropertyNames(Animal)).toEqual(
      Object.getOwnPropertyNames(class {}),
    );
  });

  it("throws if a klass is newed", () => {
    const Animal = klass({ a: 1 });
    // @ts-expect-error: for testing
    expect(() => new Animal()).toThrowErrorMatchingInlineSnapshot(
      `"Please don't new a klass, because we hate new. Call it directly or use the \\"nеw\\" API."`,
    );
  });

  it("throws if trying to create a klass with a primitive as body", () => {
    // @ts-expect-error: for testing
    expect(() => klass(1)).toThrowErrorMatchingInlineSnapshot(
      `"You can't create a klass with a non-object body."`,
    );
    expect(() => klass(null)).toThrowErrorMatchingInlineSnapshot(
      `"You can't create a klass with a non-object body."`,
    );
    expect(() =>
      klass(() => console.log("foo")),
    ).toThrowErrorMatchingInlineSnapshot(
      `"You can't create a klass with a non-object body."`,
    );
  });

  it("accepts an explicit constructor", () => {
    const Animal = klass({
      /**
       * @param {string} sound
       * @param {string} name
       */
      constructor(sound, name) {
        this.sound = sound;
        this.name = name;
      },
      makeSound() {
        return this.sound;
      },
    });
    const cat = Animal("meow", "Fiona");
    expect(cat.makeSound()).toBe("meow");
    expect(cat.name).toBe("Fiona");
  });

  it("assigns prototype correctly", () => {
    const Animal = klass({
      makeSound() {
        return this.sound;
      },
    });
    const cat = Animal({ sound: "meow" });
    expect(Object.hasOwn(cat, "sound")).toBe(true);
    expect(Object.hasOwn(cat, "makeSound")).toBe(false);
    expect(Object.hasOwn(Object.getPrototypeOf(cat), "makeSound")).toBe(true);
  });

  it("ignores existing prototypes of body", () => {
    class RealClass {
      a = 1;
    }
    const KlassClone = klass(new RealClass());
    const instance = KlassClone();
    expect(instance.a).toBe(1);
    expect(Object.getPrototypeOf(Object.getPrototypeOf(instance))).toBe(
      Object.prototype,
    );
  });

  it("can be checked with instanceof", () => {
    const Animal = klass("Animal")({});
    expect(Animal instanceof klass).toBe(true);
    expect(Animal instanceof Function).toBe(true);
    expect(Animal instanceof Object).toBe(true);
    const cat = Animal();
    expect(cat instanceof Animal).toBe(true);
    expect(cat instanceof Function).toBe(false);
    expect(cat instanceof Object).toBe(true);
  });

  it("can be retrieved through constructor reflection on instance", () => {
    const Animal = klass({});
    const dog = Animal();
    expect(dog.constructor).toBe(Animal);
  });

  it("has correct length value", () => {
    const Animal = klass({});
    expect(Animal.length).toBe(1);
    const Animal2 = klass({
      constructor() {},
    });
    expect(Animal2.length).toBe(0);
    const Animal3 = klass({
      constructor(foo, bar) {
        console.log(foo, bar);
      },
    });
    expect(Animal3.length).toBe(2);
  });
});

describe("static field", () => {
  it("is accessible on klass itself", () => {
    const Animal = klass({
      "static greet"() {
        return "hello";
      },
      "static    greet2"() {
        return "hello again";
      },
      "     static greet3    "() {
        return "yep still me";
      },
    });
    expect(Animal.greet()).toBe("hello");
    // @ts-expect-error: this is not worth typing, but it's supported
    expect(Animal.greet2()).toBe("hello again");
    // @ts-expect-error: this is not worth typing, but it's supported
    expect(Animal.greet3()).toBe("yep still me");
  });

  it("is removed from instances", () => {
    const Animal = klass({
      "static greet"() {
        return "hello";
      },
    });
    const dog = Animal();
    expect("greet" in dog).toBe(false);
    expect("static greet" in dog).toBe(false);
  });

  it("has this pointing to the klass body", () => {
    const Animal = klass({
      "static greet"() {
        return this.hey;
      },
      "static hey": 1,
    });
    expect(Animal.greet()).toBe(1);
  });
});

describe("name", () => {
  it("allows binding an explicit name", () => {
    const animalKlassCreator = klass("Animal");
    const Animal = animalKlassCreator({});
    const dog = Animal();
    expect(animalKlassCreator.boundName).toBe("Animal");
    expect(isKlass(Animal)).toBe(true);
    expect(Animal.name).toBe("Animal");
    expect("name" in dog).toBe(false);
  });

  it("falls back to empty string", () => {
    const Animal = klass({});
    expect(Animal.name).toBe("");
  });

  it("is forbidden to be re-bound", () => {
    // @ts-expect-error: for testing
    expect(() => klass("foo")("bar")({})).toThrowErrorMatchingInlineSnapshot(
      `"The klass creator already has a name bound as \\"foo\\". You can't re-write its name."`,
    );
  });

  it("overrides default @@toStringTag", () => {
    const Animal = klass("Animal")({});
    const dog = Animal();
    expect(String(dog)).toBe("[object Animal]");
  });
});

// describe("extends", () => {
//   it("adds extra properties from the base klass", () => {
//     const Entity = klass({
//       position: 1,
//     });
//     const Animal = klass.extends(Entity)({
//       location() {
//         return [this.position, this.position];
//       }
//     });
//     expect(Animal().location()).toEqual([1, 1]);
//   });
//   it("can extend a named klass ctor", () => {
//     const Entity = klass("Entity")({
//       position: 1,
//     });
//     const Animal = klass("Animal").extends(Entity)({
//       location() {
//         return [this.position, this.position];
//       }
//     });
//     expect(Animal().location()).toEqual([1, 1]);
//     expect(Animal.name).toBe("Animal");
//   });
//   it("does not take the name from super klass", () => {
//     const Entity = klass("Entity")({
//       position: 1,
//     });
//     const Animal = klass.extends(Entity)({
//       location() {
//         return [this.position, this.position];
//       }
//     });
//     expect(Animal.name).toBe("");
//   });
// });

describe("isKlass", () => {
  it("rejects non-klasses", () => {
    expect(isKlass(class {})).toBe(false);
    expect(isKlass({})).toBe(false);
    const Foo = klass({});
    expect(isKlass(Foo())).toBe(false);
  });

  it("accepts klasses", () => {
    const Foo = klass({});
    expect(isKlass(Foo)).toBe(true);
    const Bar = klass({ constructor() {} });
    expect(isKlass(Bar)).toBe(true);
  });
});

describe("nеw", () => {
  it("yes, it nеws", () => {
    const Animal = klass({
      makeSound() {
        return this.sound;
      },
    });
    expect(nеw(Animal)({ sound: "woof" }).makeSound()).toBe("woof");
  });

  it("doesn't new non-klasses", () => {
    const Animal = () => ({
      makeSound() {
        return this.sound;
      },
    });
    expect(() =>
      // @ts-expect-error: for testing
      nеw(Animal)({ sound: "woof" }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"nеw should only be called on klasses"`,
    );
  });
});
