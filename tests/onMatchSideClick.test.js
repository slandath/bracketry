/**
 * @jest-environment jsdom
 */

import { jest, test, expect } from '@jest/globals';
import { init } from './utils.js';
import finished_ucl from './data/ucl-finished.js';
import ResizeObserver from 'resize-observer-polyfill';
global.ResizeObserver = ResizeObserver;


test('calls onMatchSideClick when .side-wrapper is clicked', () => {
    const onMatchSideClick = jest.fn()
    const { wrapper } = init(finished_ucl, { onMatchSideClick })
    wrapper.querySelector('.side-wrapper[contestant-id="inter"]')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onMatchSideClick).toBeCalledWith(
        expect.objectContaining(finished_ucl.matches[1]),
        0
    )
})

test('does not call onMatchSideClick when clicked somewhere else', () => {
    const onMatchSideClick = jest.fn()
    const { wrapper } = init(finished_ucl, { onMatchSideClick })
    wrapper.querySelector('.match-wrapper')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onMatchSideClick).not.toBeCalled();
})



test('calls onMatchSideClick when anything within .side-wrapper is clicked', () => {
    const onMatchSideClick = jest.fn()
    const { wrapper } = init(finished_ucl, { onMatchSideClick })

    const side = wrapper.querySelector('.side-wrapper[contestant-id="inter"]')
    side.querySelector('.player-title').dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onMatchSideClick).toBeCalledWith(
        expect.objectContaining(finished_ucl.matches[1]),
        0
    )
})


test(`contestant's match history isn't highlighted on click when onMatchClick is provided`, () => {
    const { wrapper } = init(finished_ucl, { onMatchSideClick: () => { } })
    wrapper.querySelector('.side-wrapper')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(wrapper.querySelectorAll('.match-wrapper.highlighted').length).toBe(0)
})

