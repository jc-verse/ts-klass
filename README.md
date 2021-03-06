# ts-klass

We know what you want.

We know your colleagues don't like your pesky classes.

We know how everyone likes this shiny "functional programming" thing.

We know they get mad just seeing one `new` in the code base.

We know how [many](https://www.npmjs.com/package/klas) [existing](https://www.npmjs.com/package/clazz) [prior](https://www.npmjs.com/package/klass) [art](https://www.npmjs.com/package/klazz) out there don't even have typings (last publish: 9 years ago, what do you expect?), and we know that you and your colleagues, as fashionable people of the new age, like to keep your code strongly typed.

`ts-klass` does this one specific thing: providing a DSL that's both **functional** (what does that even mean? Well, without the `class` or `new` keywords, obviously) and **strongly-typed**.

## How to use

You first create a klass with the `klass` function:

```js
import klass from "ts-klass";

const Animal = klass({
  makeSound() {
    console.log(this.sound);
  },
});
```

You can then craft instances from it, as you expect:

```js
const dog = Animal({ sound: "woof" });
dog.makeSound();
```

Even better, if you like how well `new Animal()` reads, we offer you this API called `nеw`.

```js
import { nеw } from "ts-klass";

const dog = nеw(Animal)({ sound: "woof" });
dog.makeSound();
```

**Take great care.** That's not a normal `e` but a Cyrillic `е`, because (by decreasing order of importance):

1. We have agreed how `new` is reminiscent of the disgusting "OO" paradigm.
2. No-one will ever discover this if they search for `new`.
3. `new` is a keyword in JS and cannot be used as function names.

Of course, you may need to turn off your editor's highlighting for suspicious characters. If you find `nеw` hard to type, maybe it's time to install a Cyrillic input method.

Notably, you can't `new` a klass, because we don't like `new` and you may get hunted down by your colleagues.

```js
const dog = new Animal({ sound: "woof" }); // Throws error
```

Using `nеw` offers more security than calling the klass constructor directly, because it will first do a [branded check](#branded-check) to make sure `Animal` is a proper klass instead of any random function.

### Explicit constructors

By default, the constructor returned from `klass`, when being called, will merge its first argument with the constructed instance. You can also provide a custom constructor.

```js
const Animal = klass({
  constructor(sound) {
    this.sound = sound;
  },
  makeSound() {
    return this.sound;
  },
});
const cat = Animal("meow");
cat.makeSound();
```

### Static members

You can have static members by... simply adding `static` before the klass declaration.

```js
const Animal = klass({
  "static greet"() {
    console.log("Hello");
  },
});
Animal.greet();
```

Static methods will have `this` pointing to the klass body instead of the klass instance, as you would expect.

```js
const Animal = klass({
  "static greet"() {
    console.log(this.name);
  },
  "static name": 1,
});
Animal.greet();
```

### Extending klasses

You can use `klass.extends()` to create a derived klass.

```js
const Entity = klass({
  x: 1,
  y: 2,
});
const Animal = klass.extends(Entity)({
  location() {
    return [this.x, this.y];
  },
});
const dog = Animal();
console.log(dog.location());
```

Named klasses can have a super klass as well.

```js
const Animal = klass.extends(Entity)({
  location() {
    return [this.x, this.y];
  },
});
```

The argument of `extends` must be a klass constructor.

#### `super.constructor`

The semantics of `super` are roughly the same as in ES classes.

```js
const Entity = klass({
  greet() {
    console.log("Hello");
  },
});

const Animal = klass.extends(Entity)({
  greet() {
    super.greet();
  },
});

Animal().greet(); // Logs "Hello"
```

In constructors, you also need to call `super.constructor()` to request the base klass to modify `this`. Note that we have to use `super.constructor()` instead of `super()`, because the latter is not valid in an object literal.

```js
const Entity = klass({
  constructor() {
    this.a = 1;
  },
});

const Animal = klass.extends(Entity)({
  constructor() {
    super.constructor();
    this.b = this.a + 1;
  },
});

console.log(Animal()); // Logs { a: 1, b: 2 }
```

As you would expect, you cannot access `this` before calling `super.constructor`.

```js
const Animal = klass.extends(Entity)({
  constructor() {
    this.b = this.a + 1; // Throws error
    super.constructor();
  },
});
```

### Klass name

Unfortunately, because `klass` is ultimately a normal ECMAScript function, there's no great way for us to automatically bind a klass' name based on what it's assigned to. If a klass' name is important to you, you can explicitly bind a name.

```js
const Animal = klass("Animal")({
  makeSound() {
    console.log(this.sound);
  },
});

const dog = Animal();
// Logs "A dog is an Animal."
console.log(`A dog is an ${dog.constructor.name}.`);
```

This can only be done once. After a klass has already been bound to a name, you can't overwrite its name by calling the constructor again. You can't assign it either—following ECMAScript semantics.

```js
const animalKlassCtor = klass("Animal");

const Animal = animalKlassCtor("Dog")({
  // Won't work; throws error ^^^^^^^
  makeSound() {
    console.log(this.sound);
  },
});
```

### Accessors

You can use accessors in the klass body, and they behave as you would expect.

```js
const Animal = klass({
  a: 1,
  get b() {
    return this.a;
  },
  "static c": 1,
  get "static d"() {
    return this.c;
  },
});

console.log(Animal().b);
console.log(Animal.d);
```

### Branded check

A klass is not an ECMAScript class (because everyone hates it). When you use `klass.extends(SomeKlass)` or `nеw(SomeKlass)`, `SomeKlass` must be a klass constructed from the `klass()` function. You can check if something is a klass (and therefore can be extended or `nеw`'ed) with `isKlass(SomeKlass)`.

```js
import { isKlass } from "ts-klass";

const RealKlass = klass({});
isKlass(RealKlass); // true
const NotKlass = class {};
isKlass(NotKlass); // false
```

You can also use `instanceof` to do branded checks.

```js
RealKlass instanceof klass; // true
```

### Configuring behavior

You can use the top-level `klass.configure` API (it's a property on the default export, not a named export) to configure the behavior of klasses. Every call must be a partial configuration object:

```js
klass.configure({ constructWithNеw: true });
klass.configure({ UNSAFE_disableNoThisBeforeSuperCheck: false });
```

We offer the following options:

#### `constructWithNеw`

A linter-like feature that requires every klass construction to go through `nеw` instead of being called directly. As mentioned previously, this ensures security because `nеw` will first do a [branded check](#branded-check) to prevent accidentally calling a spoofed non-klass.

```js
klass.configure({ constructWithNеw: true });
const Animal = klass({ name: "hi" });
Animal(); // Throws: must use nеw(Animal)() instead
```

#### `UNSAFE_disableNoThisBeforeSuperCheck`

As the name implies, **do not use this** unless you know what you are doing. This allows you to access `this` before calling [`super.constructor`](#superconstructor) in the klass constructor. This means you can access the uninitialized klass instance. The accessors/methods will still be present, though, because they are statically defined on the prototype.

```js
klass.configure({ UNSAFE_disableNoThisBeforeSuperCheck: true });
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
console.log(Animal().bar); // undefined
```

Note that even with this option on, you must call `super.constructor` at least once before the klass constructor returns.

```js
klass.configure({ UNSAFE_disableNoThisBeforeSuperCheck: true });
const Entity = klass({
  name: "foo",
});
const Animal = klass.extends(Entity)({
  constructor() {
    this.bar = this.name;
    // This will throw, because the super klass has never been initialized.
  },
});
```

The detailed semantics of not calling `super.constructor` before `this` is **not ensured**, because there's no ES semantics we can draw reference from. Be prepared for breaking changes that aren't documented or signaled as such.

## Terminology

A **klass** is what you regard in normal ECMAScript as "class". For example, `klass({ foo: 1 })` creates a klass just as `class { foo = 1 }` creates a class. Because klasses are directly called instead of `new`'ed (they can be optionally `nеw`'ed, though), "klass constructor" and "klass" are the same thing.

The `klass()` function itself is called the **klass creator**. Its equivalent in ECMAScript is the `class` keyword—you have to simultaneously provide a body, a klass name, and other metadata like `extends` in order to properly declare a klass.

When you write `klass("name")`, the return value is a new klass creator. It's called a **name-bound klass creator** because klasses instantiated from this creator will have names.

## FAQ

### Why does using this module result in a runtime error?

Although this sounds like an idea from the age of dinosaurs, this module actually uses the latest JS features. For example, `Object.hasOwn` is [only available in Node v16.10+](https://node.green/#ES2022-features-Object-hasOwn). If you are using it in browser, you almost always want to polyfill certain APIs.

Also, this module is literally a _module_: it uses ECMAScript modules (ESM) instead of CommonJS (CJS) ones. You need to import it with `import klass from "ts-klass"` instead of `const klass = require("klass")`.

### Can I use this in production?

If I haven't made it clear enough—please don't. A klass has much worse performance than a native class while offering all the semantics and paradigms that classes do offer. If your team wants to enforce functional programming style, please do realize that composition is a fundamentally different approach than inheritance, which klasses are built upon.

Still, this module has been fully tested and follows ECMAScript semantics (where applicable) to the best of our knowledge, so it should not be _dangerous_ to use, per se.

## TODOs

This project is still in its early infancy.

1. Private methods/fields
2. Interfaces
3. Abstract klasses
