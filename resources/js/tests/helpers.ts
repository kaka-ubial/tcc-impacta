import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/** Abre um Radix Select pelo combobox e escolhe a opção pelo texto. */
export async function pick(
    u: UserEvent,
    trigger: HTMLElement,
    option: string | RegExp,
) {
    await u.click(trigger);
    const listbox = await screen.findByRole('listbox');
    await u.click(within(listbox).getByText(option));
}

export const flush = () => new Promise((r) => setTimeout(r, 0));

/** Abre um Radix Select e escolhe a n-ésima opção. */
export async function pickNth(u: UserEvent, trigger: HTMLElement, n = 0) {
    await u.click(trigger);
    const listbox = await screen.findByRole('listbox');
    await u.click(within(listbox).getAllByRole('option')[n]);
}
