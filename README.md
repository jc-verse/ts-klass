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
const dog = Animal.new({ sound: "woof" });
dog.makeSound();
```

To save you from your colleagues who grep the word `new` through the entire code base and slaughter those that typed one, you can construct instances without `new` as well:

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

## TODOs

This project is still in its early infancy.

1. Typings
2. Static methods
3. Class fields
4. Private methods/fields
5. Builder pattern?
