type StaticKeys<K> = K extends `static ${string}` ? K : never;
type StripStatic<K> = K extends `static ${infer U}` ? U : never;

type Static<T extends object> = Pick<T, StaticKeys<keyof T>> extends infer U
  ? { [K in keyof U as StripStatic<K>]: U[K] }
  : never;

type Instance<T extends object> = Omit<T, StaticKeys<keyof T>>;

declare const klassMarker: unique symbol;

type Klass<Body extends object> = Static<Body> &
  (<U extends object>(
    props?: U & ThisType<Instance<Body>>,
  ) => Instance<Body> & U) & {
    [klassMarker]: true;
  };

type KlassWithCtor<Body extends { constructor: (...args: never) => void }> =
  Static<Body> &
    ((
      this: ThisParameterType<Body["constructor"] & Instance<Body>>,
      ...args: Parameters<Body["constructor"]>
    ) => Instance<Body> & ThisParameterType<Body["constructor"]>) & {
      [klassMarker]: true;
    };

declare function klass(name: string): typeof klass & { boundName: string };
declare function klass<Body extends { constructor: (...args: never) => void }>(
  body: Body & ThisType<any>,
): KlassWithCtor<Body>;
declare function klass<Body extends object>(
  body: Body & ThisType<any>,
): Klass<Body>;

export function nеw<T extends Klass<object>>(someKlass: T): T;
export function isKlass(maybeKlass: unknown): maybeKlass is Klass<object>;
export default klass;