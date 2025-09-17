/**
 * @jest-environment jsdom
 */

import { test, expect } from '@jest/globals';
import { init } from './utils.js';
import finished_ucl from './data/ucl-finished.js';
import ResizeObserver from 'resize-observer-polyfill';
global.ResizeObserver = ResizeObserver;


test('bracket.uninstall() removes elements from DOM', () => {
    let { wrapper, bracket: br } = init(finished_ucl)
    br.uninstall()
    expect(wrapper.innerHTML).toBe('')
})
