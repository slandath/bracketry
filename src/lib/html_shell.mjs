import "./styles/buttons.scss";
import "./styles/main.scss";
import "./styles/rounds.scss";
import "./styles/SelectionTool.scss";
import { create_element_from_Html } from "./utils.mjs";

export const create_html_shell = (user_wrapper_el) => {
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
    `);

  user_wrapper_el.append(the_root_element);

  const find = (s) => the_root_element.querySelector(s);

  let elements = {
    the_root_element,
    scrollbar: find(".scrollbar"),
    round_titles_wrapper: find(".round-titles-wrapper"),
    matches_scroller: find(".matches-scroller"),
    matches_positioner: find(".matches-positioner"),
  };

  const uninstall = () => {
    Object.keys(elements).forEach((k) => {
      if (elements[k] instanceof Element) {
        elements[k].remove();
      }
      delete elements[k];
    });
    elements = null;
  };

  return {
    ...elements,
    uninstall,
  };
};
