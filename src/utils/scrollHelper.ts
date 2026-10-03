/**
 * Senior Frontend Universal Horizontal Scroll & Drag-to-Scroll Engine
 * Enables natural mouse-wheel horizontal scrolling, click-and-drag panning,
 * and smooth touch momentum for all horizontal overflow containers across the app.
 */

let initialized = false;

export function initGlobalHorizontalScroll() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // 1. Convert vertical mouse wheel into horizontal scroll on any horizontal overflow container
  window.addEventListener(
    'wheel',
    (e: WheelEvent) => {
      // Ignore if user is holding Shift or has horizontal wheel delta
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.shiftKey) return;

      let target = e.target as HTMLElement | null;
      while (target && target !== document.body && target !== document.documentElement) {
        const style = window.getComputedStyle(target);
        const overflowX = style.overflowX;
        const isHorizontal =
          overflowX === 'auto' ||
          overflowX === 'scroll' ||
          target.classList.contains('overflow-x-auto');

        // Check if element has horizontal scrollable space
        if (isHorizontal && target.scrollWidth > target.clientWidth + 2) {
          const atLeft = target.scrollLeft <= 0;
          const atRight = target.scrollLeft >= target.scrollWidth - target.clientWidth - 1;

          // If scrolling down (deltaY > 0) and not at right end, OR scrolling up (deltaY < 0) and not at left end
          if ((e.deltaY > 0 && !atRight) || (e.deltaY < 0 && !atLeft)) {
            e.preventDefault();
            // Smoothly scroll horizontally
            target.scrollLeft += e.deltaY;
            return;
          }
        }
        target = target.parentElement;
      }
    },
    { passive: false }
  );

  // 2. Mouse Drag-to-Scroll for tabs and horizontal containers
  let activeContainer: HTMLElement | null = null;
  let startX = 0;
  let initialScrollLeft = 0;
  let isDragging = false;
  let hasMoved = false;

  window.addEventListener('mousedown', (e: MouseEvent) => {
    // Left click only
    if (e.button !== 0) return;

    let target = e.target as HTMLElement | null;
    while (target && target !== document.body && target !== document.documentElement) {
      // Don't drag inside inputs, textareas, selects, or interactive modals
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      const style = window.getComputedStyle(target);
      const overflowX = style.overflowX;
      const isHorizontal =
        overflowX === 'auto' ||
        overflowX === 'scroll' ||
        target.classList.contains('overflow-x-auto');

      if (isHorizontal && target.scrollWidth > target.clientWidth + 2) {
        activeContainer = target;
        startX = e.pageX;
        initialScrollLeft = target.scrollLeft;
        isDragging = true;
        hasMoved = false;
        return;
      }
      target = target.parentElement;
    }
  });

  window.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isDragging || !activeContainer) return;

    const dx = e.pageX - startX;
    if (Math.abs(dx) > 4) {
      hasMoved = true;
      activeContainer.scrollLeft = initialScrollLeft - dx;
      activeContainer.classList.add('cursor-grabbing', 'select-none');
    }
  });

  const stopDrag = () => {
    if (activeContainer) {
      activeContainer.classList.remove('cursor-grabbing', 'select-none');
    }
    isDragging = false;
    activeContainer = null;
  };

  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('mouseleave', stopDrag);

  // Suppress accidental clicks if user dragged
  window.addEventListener(
    'click',
    (e: MouseEvent) => {
      if (hasMoved) {
        e.preventDefault();
        e.stopPropagation();
        hasMoved = false;
      }
    },
    true // capture phase
  );
}
