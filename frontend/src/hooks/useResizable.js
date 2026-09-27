'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Drag-to-resize for a pane.
 * axis "x" resizes width, "y" resizes height.
 * reverse=true when the pane sits after the handle (dragging left/up makes it bigger).
 */
export function useResizable({ initial, min, max, axis = 'x', reverse = false }) {
  const [size, setSize] = useState(initial);
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const onPointerDown = useCallback(
    (event) => {
      event.preventDefault();
      const startPos = axis === 'x' ? event.clientX : event.clientY;
      const startSize = sizeRef.current;

      const onMove = (moveEvent) => {
        const pos = axis === 'x' ? moveEvent.clientX : moveEvent.clientY;
        const delta = reverse ? startPos - pos : pos - startPos;
        setSize(Math.min(max, Math.max(min, startSize + delta)));
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        document.body.classList.remove('is-resizing', `is-resizing-${axis}`);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      document.body.classList.add('is-resizing', `is-resizing-${axis}`);
    },
    [axis, min, max, reverse],
  );

  return { size, onPointerDown };
}
