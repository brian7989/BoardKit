// The four building blocks every geometry-changing op composes. Each preserves
// structural sharing: tiles and boards untouched by the change keep their object identity.
export { placePinned } from './placePinned.js';
export { placeFree } from './placeFree.js';
export { detach } from './detach.js';
export { merge } from './merge.js';
