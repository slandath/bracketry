import type { Shell } from "./data/data";
import "./styles/buttons.scss";
import "./styles/main.scss";
import "./styles/rounds.scss";
import "./styles/SelectionTool.scss";
import { create_element_from_Html } from "./utils";

/**
 * Builds and mounts the bracket HTML shell inside the provided container element.
 */
export const create_html_shell = (
  user_wrapper_el: HTMLElement,
): Shell => {
  const the_root_element = create_element_from_Html(`
    <div class="bracket-root">
      <div class="navigation-button left"></div>
      <div class="navigation-button right"></div>
      <div class="scroll-button button-up"></div>
      <div class="scroll-button button-down"></div>

      <div class="round-titles-grid-item">
        <div class="round-titles-wrapper equal-width-columns-grid"></div>
      </div>

      <div class="scrollbar-parent">
        <div class="scrollbar-overflow-preventer">
          <div class="scrollbar"></div>
        </div>
      </div>

      <div class="matches-scroller scroll-y-enabled">
        <div class="matches-positioner equal-width-columns-grid"></div>
      </div>
    </div>
  `) as HTMLElement;

  user_wrapper_el.append(the_root_element);

  const find = <T extends Element = HTMLElement>(
    selector: string,
  ): T | null => the_root_element.querySelector<T>(selector);

  // Stored element references
const elements = {
  the_root_element,
  scrollbar: find(".scrollbar") as HTMLElement | null,
  round_titles_wrapper: find(".round-titles-wrapper") as HTMLElement | null,
  matches_scroller: find(".matches-scroller") as HTMLElement,
  matches_positioner: find(".matches-positioner") as HTMLElement,
};

  const uninstall = (): void => {
    // Remove all DOM nodes and clear references
    (Object.keys(elements) as Array<keyof typeof elements>).forEach((key) => {
      const el = elements[key];
      if (el instanceof Element) {
        el.remove();
      }
      delete (elements as Record<string, unknown>)[key];
    });
  };

  return {
    ...elements,
    uninstall,
  };
};
