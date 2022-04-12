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

### Class name

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

### Branded check

A klass is not an ECMAScript class (because everyone hates it). When you use `klass.extends(someKlass)` or `nеw(someKlass)`, `someKlass` must be a klass constructed from the `klass()` function. You can check if something is a klass (and therefore can be extended or `nеw`'ed) with `klass.isKlass(someKlass)`.

```js
const RealKlass = klass({});
klass.isKlass(RealKlass); // true
const NotKlass = class {};
klass.isKlass(NotKlass); // false
```

## FAQ

### Why does using this module result in a runtime error?

Although this sounds like an idea from the age of dinosaurs, this module actually uses the latest JS features. For example, `Object.hasOwn` is [only available in Node v16.10+](https://node.green/#ES2022-features-Object-hasOwn). If you are using it in browser, you almost always want to polyfill certain APIs.

Also, this module is literally a _module_: it uses ECMAScript modules (ESM) instead of CommonJS (CJS) ones. You need to import it with `import klass from "ts-klass"` instead of `const klass = require("klass")`.

### Can I use this in production?

If I haven't made it clear enough—please don't. A klass has much worse performance than a native class while offering all the semantics and paradigms that classes do offer. If your team wants to enforce functional programming style, please do realize that composition is a fundamentally different approach than inheritance, which klasses are built upon.

Still, this module has been fully tested and follows ECMAScript semantics (where applicable) to the best of our knowledge, so it should not be _dangerous_ to use, per se.

## TODOs

This project is still in its early infancy.

1. Typings
2. Private methods/fields
3. Extends/implements
4. Abstract classes
5. Builder pattern?
