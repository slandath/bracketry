import { throttle_with_trailing } from "./utils";

/**
 * Watches image load events inside the matches area and triggers a throttled repaint.
 *
 * @param matches_positioner The DOM element containing match nodes.
 * @param repaint A function to trigger a repaint of the bracket after images load.
 * @returns Cleanup function that removes the event listener.
 */
export function handle_images(
  matches_positioner: HTMLElement,
  repaint: () => void,
): () => void {
  const throttled_repaint = throttle_with_trailing(repaint, 300);

  const repaint_on_image_load = (e: Event): void => {
    // Listen to any user images (without explicit width/height) that load inside the matches container
    const path = e.composedPath();

    const target = path[0];
    if (
      target instanceof HTMLImageElement &&
      target.closest(".bracket-root .matches-positioner") ===
        matches_positioner &&
      (target.style.width === "" || target.style.height === "")
    ) {
      throttled_repaint();
    }
  };

  document.addEventListener("load", repaint_on_image_load, true);

  return (): void => {
    document.removeEventListener("load", repaint_on_image_load, true);
  };
}
