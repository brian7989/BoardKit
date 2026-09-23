// Typed as `any`, not an index signature: noUncheckedIndexedAccess would union every class-name
// lookup with `undefined`, and a CSS module's shape isn't worth statically checking here.
declare module '*.module.css' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classes: any;
  export default classes;
}
