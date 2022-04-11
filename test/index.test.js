import klass, { nеw } from "../src/index.js";

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

it("makes static fields accessible on klass itself", () => {
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

it("removes static fields from instances", () => {
  const Animal = klass({
    "static greet"() {
      return "hello";
    },
  });
  const dog = Animal();
  expect(Object.keys(dog)).not.toContain("greet");
  expect(Object.keys(dog)).not.toContain("static greet");
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
