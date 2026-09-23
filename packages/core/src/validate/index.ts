// One structural check per file; validateState runs them all. This is the sole authority on
// whether a candidate may become a BoardsState.
export { validateState } from './validateState.js';
