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
    expect(Object.keys(Animal)).toEqual(Object.keys(class {}));
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

  it("throws a better message when constructWithNеw is enabled", () => {
    klass.configure({ constructWithNеw: true });
    const Animal = klass({ a: 1 });
    // @ts-expect-error: for testing
    expect(() => new Animal()).toThrowErrorMatchingInlineSnapshot(
      `"Please don't new a klass, because we hate new. Use the \\"nеw\\" API instead. "`,
    );
    klass.configure({ constructWithNеw: false });
  });

  it("throws if trying to create a klass with a primitive as body", () => {
    // @ts-expect-error: for testing
    expect(() => klass(1)).toThrowErrorMatchingInlineSnapshot(
      `"You can't create a klass with a non-object body."`,
    );
    // @ts-expect-error: for testing
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

  it("ignores non-enumerable properties", () => {
    const body = {};
    Object.defineProperty(body, "hidden", { value: 1 });
    const Animal = klass(body);
    expect(Animal().hidden).toBe(undefined);
  });

  describe("accepts getters & setters", () => {
    test("klass", () => {
      const Animal = klass({
        get name() {
          return 1;
        },
        set name(val) {},
      });
      const dog = Animal();
      expect(Object.hasOwn(dog, "name")).toBe(false);
      expect(Object.hasOwn(Object.getPrototypeOf(dog), "name")).toBe(true);
      expect(dog.name).toBe(1);

      const SubAnimal = klass.extends(Animal)({
        get name2() {
          return 2;
        },
        set name2(val) {},
      });
      const subDog = SubAnimal();
      expect(Object.hasOwn(subDog, "name2")).toBe(false);
      expect(Object.hasOwn(Object.getPrototypeOf(subDog), "name2")).toBe(true);
      expect(
        Object.hasOwn(
          Object.getPrototypeOf(Object.getPrototypeOf(subDog)),
          "name",
        ),
      ).toBe(true);
      expect(subDog.name).toBe(1);
      expect(subDog.name2).toBe(2);
    });
    test("class", () => {
      const Animal = class {
        get name() {
          return 1;
        }
        set name(val) {}
      };
      const dog = new Animal();
      expect(Object.hasOwn(dog, "name")).toBe(false);
      expect(Object.hasOwn(Object.getPrototypeOf(dog), "name")).toBe(true);
      expect(new Animal().name).toBe(1);

      const SubAnimal = class extends Animal {
        get name2() {
          return 2;
        }
        set name2(val) {}
      };
      const subDog = new SubAnimal();
      expect(Object.hasOwn(subDog, "name2")).toBe(false);
      expect(Object.hasOwn(Object.getPrototypeOf(subDog), "name2")).toBe(true);
      expect(
        Object.hasOwn(
          Object.getPrototypeOf(Object.getPrototypeOf(subDog)),
          "name",
        ),
      ).toBe(true);
      expect(subDog.name).toBe(1);
      expect(subDog.name2).toBe(2);
    });
  });

  describe("assigns prototype correctly", () => {
    test("klass", () => {
      expect({ __proto__: { a: 1 } }).toHaveProperty("a");
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

    test("class", () => {
      const Animal = class {
        sound = "meow";
        makeSound() {
          return this.sound;
        }
      };
      const cat = new Animal();
      expect(Object.hasOwn(cat, "sound")).toBe(true);
      expect(Object.hasOwn(cat, "makeSound")).toBe(false);
      expect(Object.hasOwn(Object.getPrototypeOf(cat), "makeSound")).toBe(true);
    });
  });

  describe("ignores existing prototypes of body", () => {
    // Fastest way to make something with an existing prototype
    class RealClass {
      a = 1;
      foo() {}
    }
    test("klass", () => {
      const KlassClone = klass(new RealClass());
      const instance = KlassClone();
      expect(instance.a).toBe(1);
      expect(instance).not.toHaveProperty("foo");
      expect(Object.getPrototypeOf(Object.getPrototypeOf(instance))).toBe(
        Object.prototype,
      );
    });

    test("class", () => {
      const instance = new RealClass();
      expect(Object.getPrototypeOf(Object.getPrototypeOf(instance))).toBe(
        Object.prototype,
      );
    });
  });

  describe("can be checked with instanceof", () => {
    test("klass", () => {
      const Animal = klass({});
      const cat = Animal();
      expect(cat).toBeInstanceOf(Animal);
      expect(cat).not.toBeInstanceOf(Function);
    });

    test("class", () => {
      const Animal = class {};
      const cat = new Animal();
      expect(cat).toBeInstanceOf(Animal);
      expect(cat).not.toBeInstanceOf(Function);
    });
  });

  describe("can be retrieved through constructor of instance", () => {
    test("klass", () => {
      const Animal = klass({});
      const dog = Animal();
      expect(dog.constructor).toBe(Animal);
    });

    test("class", () => {
      const Animal = class {};
      const dog = new Animal();
      expect(dog.constructor).toBe(Animal);
    });
  });

  describe("has correct length value", () => {
    test("klass", () => {
      const Animal = klass({});
      expect(Animal.length).toBe(0);
      const Animal2 = klass({
        constructor() {},
      });
      expect(Animal2.length).toBe(0);
      const Animal3 = klass({
        /**
         * @param {string} foo
         * @param {string} bar
         */
        constructor(foo, bar) {
          console.log(foo, bar);
        },
      });
      expect(Animal3.length).toBe(2);
    });

    test("class", () => {
      const Animal = class {};
      expect(Animal.length).toBe(0);
      const Animal2 = class {
        constructor() {
          console.log("foo");
        }
      };
      expect(Animal2.length).toBe(0);
      const Animal3 = class {
        /**
         * @param {string} foo
         * @param {string} bar
         */
        constructor(foo, bar) {
          console.log(foo, bar);
        }
      };
      expect(Animal3.length).toBe(2);
    });
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
    expect(Animal["   greet2"]()).toBe("hello again");
    expect(Object.keys(Animal).length).toBe(2);
  });

  describe("is removed from instances", () => {
    test("klass", () => {
      const Animal = klass({
        "static greet"() {
          return "hello";
        },
      });
      const dog = Animal();
      expect(dog).not.toHaveProperty("greet");
      expect(dog).not.toHaveProperty("static greet");
    });

    test("class", () => {
      const Animal = class {
        static greet() {
          return "hello";
        }
      };
      const dog = new Animal();
      expect(dog).not.toHaveProperty("greet");
    });
  });

  describe("has this pointing to the klass body", () => {
    test("klass", () => {
      const Animal = klass({
        "static greet"() {
          return this.hey;
        },
        "static hey": 1,
      });
      expect(Animal.greet()).toBe(1);
    });

    test("class", () => {
      const Animal = class {
        static greet() {
          return this.hey;
        }
        static hey = 1;
      };
      expect(Animal.greet()).toBe(1);
    });
  });
});

describe("class field", () => {
  describe("are initialized before constructor", () => {
    test("klass", () => {
      let foo = undefined;
      const Animal = klass({
        name: "dog",
        constructor() {
          foo = this.name;
        },
      });
      Animal();
      expect(foo).toBe("dog");
    });

    test("class", () => {
      let foo = undefined;
      const Animal = class {
        name = "dog";
        constructor() {
          foo = this.name;
        }
      };
      new Animal();
      expect(foo).toBe("dog");
    });
  });
});

describe("name", () => {
  describe("allows binding an explicit name", () => {
    test("klass", () => {
      const animalKlassCreator = klass("Animal");
      const Animal = animalKlassCreator({});
      const dog = Animal();
      expect(isKlass(Animal)).toBe(true);
      expect(Animal.name).toBe("Animal");
      expect(dog).not.toHaveProperty("name");
    });

    test("class", () => {
      const Animal = class {};
      const dog = new Animal();
      expect(Animal.name).toBe("Animal");
      expect(dog).not.toHaveProperty("name");
    });
  });

  describe("falls back to empty string", () => {
    test("klass", () => {
      const Animal = klass({});
      expect(Animal.name).toBe("");
    });

    test("class", () => {
      const Animal = (() => class {})();
      expect(Animal.name).toBe("");
    });
  });

  it("is forbidden to be re-bound", () => {
    // @ts-expect-error: for testing
    expect(() => klass("foo")("bar")({})).toThrowErrorMatchingInlineSnapshot(
      `"The klass creator already has a name bound as \\"foo\\". You can't re-write its name."`,
    );
  });

  describe("overrides default @@toStringTag", () => {
    test("klass", () => {
      const Animal = klass("Animal")({});
      const dog = Animal();
      expect(String(dog)).toBe("[object Animal]");

      const NamelessAnimal = klass({});
      const namelessDog = NamelessAnimal();
      expect(String(namelessDog)).toBe("[object Object]");
    });

    test("class", () => {
      const Animal = class {};
      const dog = new Animal();
      // Native classes never override @@toStringTag, but we do it anyways
      expect(String(dog)).toBe("[object Object]");

      const NamelessAnimal = (() => class {})();
      const namelessDog = new NamelessAnimal();
      expect(String(namelessDog)).toBe("[object Object]");
    });
  });
});

describe("extends", () => {
  it("adds extra properties from the base klass", () => {
    const Entity = klass({
      position: 1,
    });
    const Animal = klass.extends(Entity)({
      location() {
        return [this.position, this.position];
      },
    });
    expect(Animal().location()).toEqual([1, 1]);
  });

  it("can extend a named klass ctor", () => {
    const Entity = klass("Entity")({
      position: 1,
    });
    const Animal = klass("Animal").extends(Entity)({
      location() {
        return [this.position, this.position];
      },
    });
    expect(Animal().location()).toEqual([1, 1]);
    expect(Animal.name).toBe("Animal");
  });

  it("does not take the name from super klass", () => {
    const Entity = klass("Entity")({
      position: 1,
    });
    const Animal = klass.extends(Entity)({
      location() {
        return [this.position, this.position];
      },
    });
    expect(Animal.name).toBe("");
  });

  it("throws when trying to bind name after extends", () => {
    expect(() =>
      // @ts-expect-error: for testing
      klass.extends(klass({}))("name")({}),
    ).toThrowErrorMatchingInlineSnapshot(
      `"The klass creator already has a super klass. Please bind the name before attaching super klass."`,
    );
  });

  describe("has correct prototype chain", () => {
    test("klass", () => {
      const A = klass({
        f: 1,
        fa: 1,
        m() {},
        ma() {},
        "static sf": 1,
        "static sfa": 1,
        "static sm"() {},
        "static sma"() {},
      });
      const B = klass.extends(A)({
        f: 2,
        fb: 2,
        m() {},
        mb() {},
        "static sf": 2,
        "static sfb": 2,
        "static sm"() {},
        "static smb"() {},
      });
      const a = A();
      const b = B();
      expect(Object.getPrototypeOf(B)).toBe(A);
      expect(Object.getPrototypeOf(A)).toBe(Function.prototype);
      expect(Object.getPrototypeOf(b)).toBe(B.prototype);
      expect(Object.getPrototypeOf(Object.getPrototypeOf(b))).toBe(A.prototype);
      expect(Object.getPrototypeOf(a)).toBe(A.prototype);
      expect(Object.getOwnPropertyNames(b).sort()).toEqual(["f", "fa", "fb"]);
      expect(Object.getOwnPropertyNames(Object.getPrototypeOf(b))).toEqual([
        "constructor",
        "m",
        "mb",
      ]);
      expect(
        Object.getOwnPropertyNames(
          Object.getPrototypeOf(Object.getPrototypeOf(b)),
        ),
      ).toEqual(["constructor", "m", "ma"]);
      expect(Object.getOwnPropertyNames(B)).toEqual([
        "length",
        "name",
        "prototype",
        "sf",
        "sfb",
        "sm",
        "smb",
      ]);
      expect(Object.getOwnPropertyNames(A)).toEqual([
        "length",
        "name",
        "prototype",
        "sf",
        "sfa",
        "sm",
        "sma",
      ]);
    });
    test("class", () => {
      class A {
        f = 1;
        fa = 1;
        m() {}
        ma() {}
        static sf = 1;
        static sfa = 1;
        static sm() {}
        static sma() {}
      }
      class B extends A {
        /** @override */ f = 2;
        fb = 2;
        /** @override */ m() {}
        mb() {}
        /** @override */ static sf = 2;
        static sfb = 2;
        /** @override */ static sm() {}
        static smb() {}
      }
      const a = new A();
      const b = new B();
      expect(Object.getPrototypeOf(B)).toBe(A);
      expect(Object.getPrototypeOf(A)).toBe(Function.prototype);
      expect(Object.getPrototypeOf(b)).toBe(B.prototype);
      expect(Object.getPrototypeOf(Object.getPrototypeOf(b))).toBe(A.prototype);
      expect(Object.getPrototypeOf(a)).toBe(A.prototype);
      expect(Object.getOwnPropertyNames(b)).toEqual(["f", "fa", "fb"]);
      expect(Object.getOwnPropertyNames(Object.getPrototypeOf(b))).toEqual([
        "constructor",
        "m",
        "mb",
      ]);
      expect(
        Object.getOwnPropertyNames(
          Object.getPrototypeOf(Object.getPrototypeOf(b)),
        ),
      ).toEqual(["constructor", "m", "ma"]);
      expect(Object.getOwnPropertyNames(B)).toEqual([
        "length",
        "name",
        "prototype",
        "sm",
        "smb",
        "sf",
        "sfb",
      ]);
      expect(Object.getOwnPropertyNames(A)).toEqual([
        "length",
        "name",
        "prototype",
        "sm",
        "sma",
        "sf",
        "sfa",
      ]);
    });
  });

  describe("restores toStringTag in derived klass", () => {
    test("klass", () => {
      const Entity = klass("Entity")({});
      const Animal = klass.extends(Entity)({});
      expect(String(Animal())).toBe("[object Object]");
    });
    test("class", () => {
      const Entity = class Entity {};
      const Animal = (() => class extends Entity {})();
      expect(String(new Animal())).toBe("[object Object]");
    });
  });

  it("forbids extending non-klasses", () => {
    expect(() =>
      // @ts-expect-error: for testing
      klass.extends(class {})({}),
    ).toThrowErrorMatchingInlineSnapshot(`"You can only extend klasses."`);
    // @ts-expect-error: for testing
    expect(() => klass.extends({})({})).toThrowErrorMatchingInlineSnapshot(
      `"You can only extend klasses."`,
    );
  });
});

describe("super call", () => {
  it("needs to call super in constructor", () => {
    const Entity = klass("Entity")({
      constructor() {
        this.a = 1;
        this.same = 5;
      },
    });
    // No name, so that it serializes to `Object {...}`
    const Animal = klass.extends(Entity)({
      constructor() {
        super.constructor();
        this.b = 2;
        this.same = 3;
      },
    });
    const dog = Animal();
    expect(dog).toEqual({ a: 1, b: 2, same: 3 });
  });

  it("needs to happen before accessing this", () => {
    const Entity = klass("Entity")({});
    const Animal = klass.extends(Entity)({
      constructor() {
        this.b = 2;
      },
    });
    expect(() => Animal()).toThrowErrorMatchingInlineSnapshot(
      `"You must call super.constructor() in derived klass before performing 'set' on 'this'."`,
    );
    const Animal2 = klass.extends(Entity)({
      constructor() {
        console.log(this.a);
      },
    });
    expect(() => Animal2()).toThrowErrorMatchingInlineSnapshot(
      `"You must call super.constructor() in derived klass before performing 'get' on 'this'."`,
    );
    const Animal3 = klass.extends(Entity)({
      constructor() {
        console.log(Object.keys(this));
      },
    });
    expect(() => Animal3()).toThrowErrorMatchingInlineSnapshot(
      `"You must call super.constructor() in derived klass before performing 'ownKeys' on 'this'."`,
    );
    const Animal4 = klass.extends(Entity)({
      constructor() {},
    });
    expect(() => Animal4()).toThrowErrorMatchingInlineSnapshot(
      `"You must call super.constructor() in derived klass before returning from derived constructor."`,
    );
  });

  describe("execution order is the same as class", () => {
    test("klass", () => {
      let foo = undefined;
      const Entity = klass("Entity")({
        constructor() {
          foo = this.a;
        },
      });
      // Class field binding happens after super call
      const Animal = klass.extends(Entity)({ a: 1 });
      Animal();
      expect(foo).toBe(undefined);
    });

    test("class", () => {
      let foo = undefined;
      const Entity = class {
        /** @type {number | undefined} */ a;
        constructor() {
          foo = this.a;
        }
      };
      const Animal = class extends Entity {
        /** @override */ a = 1;
      };
      new Animal();
      expect(foo).toBe(undefined);
    });
  });

  it("is valid in methods", () => {
    const A = klass({
      method() {
        return 1;
      },
    });
    const B = klass.extends(A)({
      a: 1,
      method() {
        // Testing order: 'this' should be allowed before 'super'
        const b = this.a;
        return super.method() + b;
      },
    });
    expect(B().method()).toBe(2);
  });
});

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

  it("can be substituted with instanceof", () => {
    const Animal = klass({});
    expect(Animal).toBeInstanceOf(klass);
    expect(Animal).toBeInstanceOf(Function);
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
      /** @returns {string} */
      makeSound() {
        // @ts-expect-error: it actually won't work
        return this.sound;
      },
    });
    expect(() =>
      // @ts-expect-error: for testing
      nеw(Animal)({ sound: "woof" }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"nеw should only be called on klasses."`,
    );
  });
});

describe("configure", () => {
  describe("constructWithNеw", () => {
    beforeAll(() => klass.configure({ constructWithNеw: true }));
    afterAll(() => klass.configure({ constructWithNеw: false }));
    it("forbids directly invoking a klass constructor", () => {
      expect(() => klass({})()).toThrowErrorMatchingInlineSnapshot(
        `"Klass constructors must be invoked with \\"nеw\\" because you have enabled the \\"constructWithNеw\\" option."`,
      );
    });
    it("still allows using nеw", () => {
      expect(nеw(klass({}))({ a: 1 })).toEqual({ a: 1 });
    });
  });

  describe("UNSAFE_disableNoThisBeforeSuperCheck", () => {
    beforeAll(() =>
      klass.configure({ UNSAFE_disableNoThisBeforeSuperCheck: true }),
    );
    afterAll(() =>
      klass.configure({ UNSAFE_disableNoThisBeforeSuperCheck: false }),
    );
    it("allows accessing this before super.constructor, even when it leads to weird behaviors", () => {
      const Entity = klass({
        name: "foo",
      });
      const Animal = klass.extends(Entity)({
        constructor() {
          this.bar = this.name;
          super.constructor();
        },
      });
      // If super.constructor() is called before, `bar` should be defined.
      expect(Animal()).toEqual({ name: "foo" });
    });
  });
});
