import { apply_matches_updates } from "./apply_matches_updates";
import { ananlyze_data } from "./data/analyze_data";
import type { BracketInstance, Data, Match, Shell } from "./data/data";
import { handle_data_errors } from "./data/handle_errors";
import { render_content } from "./draw/render_content";
import { handle_images } from "./handle_images";
import { create_html_shell } from "./html_shell";
import { create_navigation } from "./navigation/navigation";
import {
  apply_options,
  filter_updatable_options,
} from "./options/apply_options";
import { create_options_dealer } from "./options/options_dealer";
import { create_scrolla } from "./scroll/scrolla.js";
import { update_highlight } from "./ui_events/highlight";
import { install_ui_events } from "./ui_events/ui_events";
import { deep_clone_object, is_valid_number } from "./utils";

// track all live instances
const all_bracketry_instances: BracketInstance[] = [];

// Helper to merge new data safely
const try_assign_new_data = (old_data: Data, new_data: Data): boolean => {
  const { have_critical_error } = handle_data_errors(ananlyze_data(new_data));
  if (have_critical_error) return false;

  Object.keys(old_data).forEach((key) => delete old_data[key]);
  Object.assign(old_data, deep_clone_object(new_data));
  return true;
};

// ======================================================
// createBracket
// ======================================================
export const createBracket = (
  initial_user_data: Record<string, unknown>,
  user_wrapper_el: HTMLElement | null,
  user_options: Record<string, unknown>,
): BracketInstance => {
  let alive = false;
  const options_dealer = create_options_dealer();
  const actual_data: Data = {
    rounds: [],
    matches: [],
    teams: {},
  };

  const stub: BracketInstance = {
    moveToPreviousRound: () => void 0,
    moveToNextRound: () => void 0,
    moveToLastRound: () => void 0,
    setBaseRoundIndex: () => void 0,
    getNavigationState: () => void 0,
    applyNewOptions: () => void 0,
    replaceData: () => void 0,
    applyMatchesUpdates: () => void 0,
    getAllData: () => deep_clone_object(initial_user_data || {}),
    getUserOptions: () => deep_clone_object(user_options),
    highlightContestantHistory: () => void 0,
    uninstall: () => void 0,
    user_wrapper_el,
  };

  // Invalid DOM
  if (
    !user_wrapper_el ||
    !(user_wrapper_el instanceof Element) ||
    !user_wrapper_el.closest("html")
  ) {
    console.warn(
      "Could not install bracket because invalid element is provided:",
      user_wrapper_el,
    );
    return stub;
  }

  // Kill duplicates in same wrapper
  all_bracketry_instances.forEach((inst) => {
    if (inst.user_wrapper_el === user_wrapper_el) {
      inst.uninstall();
    }
  });

  const html_shell = create_html_shell(user_wrapper_el);
  apply_options(user_options, options_dealer, html_shell);

  const merge_ok = try_assign_new_data(actual_data, initial_user_data as Data);
  if (!merge_ok) return stub;

  alive = true;

  render_content(actual_data, html_shell, options_dealer.get_final_value);
  const scrolla = create_scrolla(html_shell, options_dealer.get_final_value);
  const navigation = create_navigation(
    html_shell,
    options_dealer.get_final_value,
    scrolla,
  );

  let unhandle_images = (): void => {};

  if (html_shell.matches_positioner) {
    unhandle_images = handle_images(
      html_shell.matches_positioner,
      navigation.repaint,
    );
  }

  const uninstall = (): void => {
    if (!alive) return;

    unhandle_images();
    ui_events.uninstall();
    scrolla.uninstall();
    navigation.uninstall();
    html_shell.uninstall();

    const instance_i = all_bracketry_instances.indexOf(instance);
    if (instance_i > -1) all_bracketry_instances.splice(instance_i, 1);

    alive = false;
  };

  const ui_events = install_ui_events(
    actual_data,
    options_dealer.get_final_value,
    html_shell,
    {
      ...navigation,
      handle_click: (el: Element | null) => {
        if (el instanceof HTMLElement) navigation.handle_click(el);
      },
    },
  );

  const instance: BracketInstance = {
    moveToPreviousRound: () => {
      if (alive) navigation.move_left();
    },
    moveToNextRound: () => {
      if (alive) navigation.move_right();
    },
    moveToLastRound: () => {
      if (alive) navigation.set_base_round_index(Infinity);
    },
    setBaseRoundIndex: (i: number) => {
      if (!is_valid_number(i)) {
        console.warn("setBaseRoundIndex accepts only numbers; got:", i);
        return;
      }
      if (alive) navigation.set_base_round_index(i);
    },
    getNavigationState: navigation.get_state,
    applyNewOptions: (new_options: Record<string, unknown>) => {
      if (!alive) return;
      apply_options(
        filter_updatable_options(new_options),
        options_dealer,
        html_shell,
      );
      navigation.repaint();
    },
    replaceData: (new_data: Record<string, unknown>) => {
      if (!alive) return;
      const ok = try_assign_new_data(actual_data, new_data as Data);
      if (!ok) {
        console.warn("Failed to apply new data");
        return;
      }
      render_content(actual_data, html_shell, options_dealer.get_final_value);
      navigation.set_base_round_index(0);
      scrolla.adjust_offset(0);
      navigation.repaint();
    },
    applyMatchesUpdates: (u: Record<string, unknown>) => {
      if (!alive) return;
      apply_matches_updates(
        u,
        actual_data as Data & { matches: Match[] },
        html_shell as Shell,
        ((key: string) => options_dealer.get_final_value(key)) as (
          key?: unknown,
        ) => unknown,
        navigation.repaint,
      );
    },
    getAllData: () => deep_clone_object(actual_data || {}),
    getUserOptions: () =>
      deep_clone_object(options_dealer?.get_user_options() || {}),
    highlightContestantHistory: (contestantId: string) => {
      if (alive && html_shell.matches_positioner)
        update_highlight(html_shell.matches_positioner, contestantId);
    },
    uninstall: () => {
      if (alive) uninstall();
    },
    user_wrapper_el,
  };

  all_bracketry_instances.push(instance);
  return instance;
};
