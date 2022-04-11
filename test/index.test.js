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
