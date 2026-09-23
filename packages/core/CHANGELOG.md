# boardkit-core

## 0.1.0

Initial release of the pure layout engine behind BoardKit.

- **Zero dependencies**: no DOM, no React, no runtime dependencies.
- **Ops-based API**: every action returns an updated state or a typed rejection, never throws.
- **Exact collision solver**: moves the fewest tiles, then the shortest distance, with fast rejection of impossible layouts.
- **Serializable state** with parse, validate and repair, plus per-breakpoint layouts and reflow.
- **Floating tiles, stacks and multiple boards.**
