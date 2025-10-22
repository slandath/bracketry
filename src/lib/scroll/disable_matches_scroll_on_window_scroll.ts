import { GetOption } from "../data/data";
import { debounce } from "../utils";

export const disable_matches_scroll_on_window_scroll = (
  matches_scroller: HTMLElement,
  get_option: GetOption,
) => {
  if (get_option("verticalScrollMode") === "buttons") {
    return () => void 0;
  }

  const enable_matches_wheel_scroll = debounce(
    (matches_scroller: HTMLElement) => {
      matches_scroller.classList.add("scroll-y-enabled");
    },
    200,
  );

  const handle_window_scroll = () => {
    if (matches_scroller.classList.contains("scroll-y-enabled")) {
      matches_scroller.classList.remove("scroll-y-enabled");
    }
    enable_matches_wheel_scroll(matches_scroller);
  };

  window.addEventListener("scroll", handle_window_scroll);

  return () => window.removeEventListener("scroll", handle_window_scroll);
};
