import klass, { nеw } from "../src/index.js";

describe("klass constructor", () => {
  it("generates a newable object", () => {
    const Animal = klass({
      makeSound() {
        return this.sound;
      },
    });
    const dog = Animal.new({ sound: "woof" });
    const cat = Animal({ sound: "meow" });
    expect(dog.makeSound()).toBe("woof");
    expect(cat.makeSound()).toBe("meow");
  });

  it("generates a klass without any enumerable keys by default, and resembles normal classes", () => {
    const Animal = klass({ a: 1 });
    expect(Object.keys(Animal)).toEqual([]);
    expect(Object.getOwnPropertyNames(Animal)).toEqual([
      ...Object.getOwnPropertyNames(class {}),
      "new",
    ]);
  });

  it("accepts an explicit constructor", () => {
    const Animal = klass({
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
});

describe("static fields", () => {
  it("are accessible on klass itself", () => {
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
    expect(Animal.greet2()).toBe("hello again");
    expect(Animal.greet3()).toBe("yep still me");
  });

  it("are removed from instances", () => {
    const Animal = klass({
      "static greet"() {
        return "hello";
      },
    });
    const dog = Animal();
    expect(Object.keys(dog)).not.toContain("greet");
    expect(Object.keys(dog)).not.toContain("static greet");
  });

  it("have this pointing to the klass body", () => {
    const Animal = klass({
      "static greet"() {
        return this.hey;
      },
      "static hey": 1,
    });
    expect(Animal.greet()).toBe(1);
  });

  it("can be retrieved through constructor reflection on instance", () => {
    const Animal = klass({
      "static greet"() {
        return "Hi";
      },
    });
    const dog = Animal();
    expect(dog.constructor).toBe(Animal);
  });
});

describe("name", () => {
  it("allows binding an explicit name", () => {
    const Animal = klass("Animal")({});
    const dog = Animal();
    expect(klass.isKlass(Animal)).toBe(true);
    expect(Animal.name).toBe("Animal");
    expect(dog.name).toBe(undefined);
  });
  it("falls back to empty string", () => {
    const Animal = klass({});
    expect(Animal.name).toBe("");
  });
  it("is forbidden to be re-bound", () => {
    expect(() => klass("foo")("bar")({})).toThrowErrorMatchingInlineSnapshot(
      `"The klass already has a name bound as \\"foo\\". You can't re-write its name."`,
    );
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
//     expect(Animal.location()).toEqual([1, 1]);
//   });
// });

describe("isKlass", () => {
  it("rejects non-klasses", () => {
    expect(klass.isKlass(class {})).toBe(false);
    expect(klass.isKlass({})).toBe(false);
    const Foo = klass({});
    expect(klass.isKlass(Foo())).toBe(false);
  });
  it("accepts klasses", () => {
    const Foo = klass({});
    expect(klass.isKlass(Foo)).toBe(true);
    const Bar = klass({ constructor() {} });
    expect(klass.isKlass(Bar)).toBe(true);
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
      nеw(Animal)({ sound: "woof" }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"nеw should only be called on klasses"`,
    );
  });
});
