import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { InteractionDefaults, px, type Point, type Px } from 'boardkit-core';
import { PointerKind } from '../../shared/dom/PointerKind.js';
import { useTouchScrollGuard } from './useTouchScrollGuard.js';

const LONG_PRESS_MS = 250;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

// Mirrors core's internal crossedDragThreshold, which isn't exported.
function pastThreshold(origin: Point<Px>, at: Point<Px>, thresholdPx: number): boolean {
  const dx = at.x - origin.x;
  const dy = at.y - origin.y;
  return dx * dx + dy * dy >= thresholdPx * thresholdPx;
}

interface DragGestureCallbacks {
  readonly onGrab: (at: Point<Px>) => void;
  readonly onMove: (at: Point<Px>) => void;
  readonly onRelease: (at: Point<Px>) => void;
  readonly onCancel: () => void;
}

export interface UseDragGestureInput extends DragGestureCallbacks {
  readonly canStart: (event: ReactPointerEvent) => boolean;
  readonly enabled: boolean;
}

export interface UseDragGestureResult {
  readonly ref: RefObject<HTMLDivElement>;
  readonly onPointerDown: (event: ReactPointerEvent) => void;
  readonly onContextMenu: (event: { preventDefault(): void }) => void;
  readonly lifted: boolean;
}

function pointOf(event: { clientX: number; clientY: number }): Point<Px> {
  return { x: px(event.clientX), y: px(event.clientY) };
}

type PointerHandler = (event: PointerEvent) => void;

// Once the tile moves off the press point, the browser may start a native drag of whatever is
// now under it (an <img>, say), which fires pointercancel and kills our gesture.
function preventNativeDrag(event: Event): void {
  event.preventDefault();
}

function addPointerListeners(onMove: PointerHandler, onUp: PointerHandler, onCancel: () => void): void {
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
  window.addEventListener('dragstart', preventNativeDrag, true);
}

function removePointerListeners(onMove: PointerHandler, onUp: PointerHandler, onCancel: () => void): void {
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);
  window.removeEventListener('pointercancel', onCancel);
  window.removeEventListener('dragstart', preventNativeDrag, true);
}

// Swallows the click the browser synthesizes right after pointerup, so it doesn't reach whatever the tile was dropped on.
function startClickSuppression(): () => void {
  const suppress = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  window.addEventListener('click', suppress, { capture: true, once: true });
  return () => window.removeEventListener('click', suppress, { capture: true });
}

function armMouseDrag(): () => void {
  document.body.style.userSelect = 'none';
  return startClickSuppression();
}

interface MouseGestureContext {
  readonly callbacks: DragGestureCallbacks;
  readonly teardownRef: { current: (() => void) | null };
}

interface MouseGestureHandlers {
  readonly onMove: PointerHandler;
  readonly onUp: PointerHandler;
  readonly onCancel: () => void;
}

interface EndMouseGestureInput {
  readonly ctx: MouseGestureContext;
  readonly handlers: MouseGestureHandlers;
  readonly previousUserSelect: string;
}

// Macrotask teardown: the browser's trailing click fires after a microtask checkpoint, so a queueMicrotask would run too early.
function endMouseGesture(input: EndMouseGestureInput, stopSuppression: (() => void) | null): void {
  const { ctx, handlers, previousUserSelect } = input;
  removePointerListeners(handlers.onMove, handlers.onUp, handlers.onCancel);
  document.body.style.userSelect = previousUserSelect;
  window.setTimeout(() => stopSuppression?.(), 0);
  ctx.teardownRef.current = null;
}

// Only arms text-selection/click suppression past the drag threshold, so a plain click never pays for it.
function runMouseGesture(ctx: MouseGestureContext, event: ReactPointerEvent): void {
  const origin = pointOf(event);
  const previousUserSelect = document.body.style.userSelect;
  let dragStarted = false;
  let stopSuppression: (() => void) | null = null;
  const onMove = (moveEvent: PointerEvent) => {
    const at = pointOf(moveEvent);
    if (!dragStarted && pastThreshold(origin, at, InteractionDefaults.dragThresholdPx)) { dragStarted = true; stopSuppression = armMouseDrag(); }
    ctx.callbacks.onMove(at);
  };
  const onUp = (upEvent: PointerEvent) => { ctx.callbacks.onRelease(pointOf(upEvent)); finish(); };
  const onCancel = () => { ctx.callbacks.onCancel(); finish(); };
  const handlers: MouseGestureHandlers = { onMove, onUp, onCancel };
  const finish = () => endMouseGesture({ ctx, handlers, previousUserSelect }, stopSuppression);
  ctx.teardownRef.current = finish;
  addPointerListeners(onMove, onUp, onCancel);
  ctx.callbacks.onGrab(origin);
}

interface DragGestureRefs {
  readonly pressActiveRef: { current: boolean };
  readonly touchActiveRef: { current: boolean };
  readonly teardownRef: { current: (() => void) | null };
  readonly setLifted: (value: boolean) => void;
}

interface TouchGestureContext extends DragGestureRefs {
  readonly callbacks: DragGestureCallbacks;
}

function endTouchPress(ctx: TouchGestureContext): void {
  ctx.pressActiveRef.current = false;
  ctx.touchActiveRef.current = false;
  ctx.setLifted(false);
  ctx.teardownRef.current = null;
}

// Scroll-blocking lives in useTouchScrollGuard; this only flips touchActiveRef, which that listener reads.
function attachActiveTouchListeners(ctx: TouchGestureContext): void {
  const onMove = (event: PointerEvent) => ctx.callbacks.onMove(pointOf(event));
  const onUp = (event: PointerEvent) => { ctx.callbacks.onRelease(pointOf(event)); finish(); };
  const onCancel = () => { ctx.callbacks.onCancel(); finish(); };
  function finish() {
    removePointerListeners(onMove, onUp, onCancel);
    endTouchPress(ctx);
  }
  ctx.teardownRef.current = finish;
  addPointerListeners(onMove, onUp, onCancel);
}

function activateTouchDrag(ctx: TouchGestureContext, origin: Point<Px>): void {
  ctx.callbacks.onGrab(origin);
  ctx.touchActiveRef.current = true;
  ctx.setLifted(true);
  attachActiveTouchListeners(ctx);
}

// Nothing dispatches until the finger stays within tolerance for the full long-press.
function runTouchGesture(ctx: TouchGestureContext, event: ReactPointerEvent): void {
  const origin = pointOf(event);
  ctx.pressActiveRef.current = true;
  const onMove = (moveEvent: PointerEvent) => {
    if (pastThreshold(origin, pointOf(moveEvent), LONG_PRESS_MOVE_TOLERANCE_PX)) abort();
  };
  const onUp = () => abort();
  const onCancel = () => abort();
  const timer = window.setTimeout(() => {
    removePointerListeners(onMove, onUp, onCancel);
    activateTouchDrag(ctx, origin);
  }, LONG_PRESS_MS);
  function abort() {
    window.clearTimeout(timer);
    removePointerListeners(onMove, onUp, onCancel);
    endTouchPress(ctx);
  }
  ctx.teardownRef.current = abort;
  addPointerListeners(onMove, onUp, onCancel);
}

function startGesture(input: UseDragGestureInput, refs: DragGestureRefs, event: ReactPointerEvent): void {
  if (!input.canStart(event)) return;
  if (event.pointerType === PointerKind.Touch) runTouchGesture({ callbacks: input, ...refs }, event);
  else runMouseGesture({ callbacks: input, teardownRef: refs.teardownRef }, event);
}

// Mouse/pen drag past the core threshold; touch needs a still 250ms long-press first.
export function useDragGesture(input: UseDragGestureInput): UseDragGestureResult {
  const ref = useRef<HTMLDivElement>(null);
  const [lifted, setLifted] = useState(false);
  const pressActiveRef = useRef(false);
  const touchActiveRef = useRef(false);
  const teardownRef = useRef<(() => void) | null>(null);
  useTouchScrollGuard({ ref, enabled: input.enabled, activeRef: touchActiveRef });
  useEffect(() => () => teardownRef.current?.(), []);
  const refs = { pressActiveRef, touchActiveRef, teardownRef, setLifted };

  const onPointerDown = useCallback((event: ReactPointerEvent) => startGesture(input, refs, event), [input, refs]);
  const onContextMenu = useCallback((event: { preventDefault(): void }) => {
    if (pressActiveRef.current) event.preventDefault();
  }, []);

  return { ref, onPointerDown, onContextMenu, lifted };
}
