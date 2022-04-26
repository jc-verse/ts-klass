type StaticKeys<K> = K extends `static ${string}` ? K : never;
type StripStatic<K> = K extends `static ${infer U}` ? U : never;

type Static<T extends object> = { [K in keyof T as StripStatic<K>]: T[K] };

type Instance<T extends object> = Omit<T, StaticKeys<keyof T>>;

declare const klassMarker: unique symbol;

type Klass<Body extends object> = Static<Body> & {
  [klassMarker]: true;
} & (Body extends { constructor: (...args: never) => void }
    ? (
        this: ThisParameterType<Body["constructor"] & Instance<Body>>,
        ...args: Parameters<Body["constructor"]>
      ) => Instance<Omit<Body, "constructor">> &
        ThisParameterType<Body["constructor"]>
    : <U extends object>(
        props?: U & ThisType<Instance<Body>>,
      ) => Instance<Body> & U);

type KlassCreator = {
  <Body extends object>(body: Body & ThisType<any>): Klass<Body>;
  extends: (SuperKlass: Klass<any>) => KlassCreator;
};

declare const klass: KlassCreator & ((name: string) => KlassCreator);

export function nеw<T extends Klass<object>>(someKlass: T): T;
export function isKlass(maybeKlass: unknown): maybeKlass is Klass<object>;
export default klass;
