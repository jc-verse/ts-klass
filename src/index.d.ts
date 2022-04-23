type StaticKeys<K> = K extends `static ${string}` ? K : never;
type StripStatic<K> = K extends `static ${infer U}` ? U : never;

type Static<T extends object> = Pick<T, StaticKeys<keyof T>> extends infer U
  ? { [K in keyof U as StripStatic<K>]: U[K] }
  : never;

type Instance<T extends object> = T;

declare const klassMarker: unique symbol;

type Klass<T extends object> = Static<T> &
  (<U extends object>(props?: U) => Instance<T> & U) & {
    [klassMarker]: true;
  };

type KlassWithCtor<T extends { constructor: (...args: never) => void }> =
  Static<T> &
    ((...args: Parameters<T["constructor"]>) => Instance<T>) & {
      [klassMarker]: true;
    };

declare function klass(name: string): typeof klass & { boundName: string };
declare function klass<T extends { constructor: (...args: never) => void }>(
  proto: T,
): KlassWithCtor<T>;
declare function klass<T extends object>(proto: T): Klass<T>;

export function nеw<T extends Klass<object>>(someKlass: T): T;
export function isKlass(maybeKlass: unknown): maybeKlass is Klass<object>;
export default klass;
