/**
 * Shared option picker (docs/DESIGN.md): search, optional scope segmented control, optional extra
 * filters, paginated grid or list of option buttons with roving arrow-key focus, empty state, and
 * an aria-live selected summary. Returns a cleanup that removes its listeners (invariant 7).
 */
import { h, mount, segmented, stateBlock } from './dom.js';

/**
 * Pure filter for picker items (unit-tested in tests/picker.test.js).
 *
 * @template {{ id: string, searchText?: string, label?: string }} T
 * @param {T[]} items
 * @param {{
 *   query?: string,
 *   predicate?: ((item: T) => boolean) | null,
 *   alwaysIncludeIds?: string[],
 *   keepSelectedId?: string | null,
 *   keepSelectedOutsideFilter?: boolean,
 * }} [opts]
 * @returns {T[]}
 */
export function filterPickerItems(
  items,
  { query = '', predicate = null, alwaysIncludeIds = [], keepSelectedId = null, keepSelectedOutsideFilter = false } = {},
) {
  const q = String(query ?? '').trim().toLowerCase();
  const alwaysSet = new Set(alwaysIncludeIds);
  const regular = items.filter((item) => !alwaysSet.has(item.id));
  const matched = regular.filter((item) => {
    if (predicate && !predicate(item)) return false;
    if (!q) return true;
    const hay = String(item.searchText ?? item.label ?? item.id).toLowerCase();
    return hay.includes(q);
  });

  // When a non-empty search matches nothing, return empty so the empty state can show.
  if (q && !matched.length) return [];

  const out = [];
  const seen = new Set();
  for (const id of alwaysIncludeIds) {
    const item = items.find((x) => x.id === id);
    if (item && !seen.has(item.id)) {
      out.push(item);
      seen.add(item.id);
    }
  }
  if (keepSelectedOutsideFilter && !q && keepSelectedId && !seen.has(keepSelectedId) && !matched.some((m) => m.id === keepSelectedId)) {
    const sel = items.find((x) => x.id === keepSelectedId);
    if (sel) {
      out.push(sel);
      seen.add(sel.id);
    }
  }
  for (const item of matched) {
    if (!seen.has(item.id)) {
      out.push(item);
      seen.add(item.id);
    }
  }
  return out;
}

/**
 * Pure next-index calculation for roving focus inside a 1D list or 2D option grid.
 *
 * @param {number} current
 * @param {string} key
 * @param {number} count
 * @param {number} [cols]
 * @returns {number}
 */
export function moveRovingIndex(current, key, count, cols = 1) {
  if (count <= 0) return -1;
  const idx = Math.max(0, Math.min(count - 1, current));
  const c = Math.max(1, cols);
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (c === 1) {
    if (key === 'ArrowDown' || key === 'ArrowRight') return (idx + 1) % count;
    if (key === 'ArrowUp' || key === 'ArrowLeft') return (idx - 1 + count) % count;
    return idx;
  }
  if (key === 'ArrowRight') return Math.min(count - 1, idx + 1);
  if (key === 'ArrowLeft') return Math.max(0, idx - 1);
  if (key === 'ArrowDown') return Math.min(count - 1, idx + c);
  if (key === 'ArrowUp') return Math.max(0, idx - c);
  return idx;
}

/** Measure how many columns a rendered option container currently lays out. */
function measureColumns(container, buttons) {
  if (buttons.length < 2) return 1;
  const firstTop = Math.round(buttons[0].getBoundingClientRect().top);
  let cols = 1;
  for (let i = 1; i < buttons.length; i++) {
    if (Math.abs(Math.round(buttons[i].getBoundingClientRect().top) - firstTop) <= 4) cols++;
    else break;
  }
  return Math.max(1, cols);
}

/**
 * Build a shared picker component with search, optional scope, paginated grid/list options,
 * roving arrow-key navigation, empty state, and aria-live selection readout.
 *
 * @template {{ id: string, searchText?: string, label?: string }} T
 * @param {{
 *   label: string,
 *   layout?: 'grid' | 'list',
 *   items: T[],
 *   value: string,
 *   search?: { placeholder?: string, ariaLabel?: string } | null,
 *   scope?: { label: string, options: { value: string, label: string }[], value: string, onChange?: (v: string) => void } | null,
 *   extraControls?: HTMLElement[],
 *   extraPanel?: HTMLElement | null,
 *   pageSize?: number,
 *   alwaysIncludeIds?: string[],
 *   keepSelectedOutsideFilter?: boolean,
 *   predicate?: ((item: T, scopeValue: string) => boolean) | null,
 *   emptyTitle?: string,
 *   emptyBody?: string,
 *   formatCount?: (info: { shown: number, filtered: number, total: number, query: string, scope: string }) => string,
 *   formatSelected?: (item: T | null, info: { filtered: number, total: number }) => any,
 *   renderOption: (item: T, state: { selected: boolean, scope: string }) => { className?: string, attrs?: Record<string, any>, content: any },
 *   onSelect: (item: T) => void,
 *   onClear?: (() => void) | null,
 * }} opts
 */
export function createPicker({
  label,
  layout = 'grid',
  items: initialItems = [],
  value: initialValue = '',
  search = null,
  scope = null,
  extraControls = [],
  extraPanel = null,
  pageSize = 12,
  alwaysIncludeIds = [],
  keepSelectedOutsideFilter = false,
  predicate = null,
  emptyTitle = 'No matching options',
  emptyBody = 'Try a different search or clear the active filters.',
  formatCount = ({ filtered, total }) => `${filtered} of ${total}`,
  formatSelected = (item) => (item ? ['Selected: ', h('strong', {}, item.label ?? item.id)] : 'Nothing selected'),
  renderOption,
  onSelect,
  onClear = null,
}) {
  let allItems = [...initialItems];
  let selectedId = initialValue;
  let query = '';
  let scopeValue = scope?.value ?? '';
  let limit = pageSize;
  let statusOverride = null;
  let filteredItems = [];
  let visibleButtons = [];

  const controls = h('div.filters.picker-controls');
  let searchInput = null;
  const cleanups = [];

  if (scope) {
    const seg = segmented({
      label: scope.label,
      options: scope.options,
      value: scopeValue,
      onChange: (next) => {
        scopeValue = next;
        limit = pageSize;
        scope.onChange?.(next);
        render();
      },
    });
    controls.append(seg);
  }

  if (search) {
    searchInput = h('input.search.picker-search', {
      type: 'search',
      placeholder: search.placeholder ?? 'Search',
      'aria-label': search.ariaLabel ?? `Search ${label.toLowerCase()}`,
    });
    const onInput = () => {
      query = searchInput.value;
      limit = pageSize;
      render();
    };
    searchInput.addEventListener('input', onInput);
    cleanups.push(() => searchInput.removeEventListener('input', onInput));
    controls.append(searchInput);
  }

  for (const el of extraControls) {
    if (el) controls.append(el);
  }

  const countLine = h('p.hint-text.picker-count', { role: 'status' });
  const optionsEl = h(`div.picker-options.picker-${layout}`, { role: 'group', 'aria-label': label });
  const moreBtn = h('button.btn.btn-secondary.btn-sm.picker-more', { type: 'button', hidden: true });
  const emptyHost = h('div.picker-empty', { hidden: true });
  const selectedLine = h('div.picker-selected', { 'aria-live': 'polite', 'aria-atomic': 'true' });

  const onMoreClick = () => {
    const prevCount = visibleButtons.length;
    limit += pageSize;
    render();
    // Move keyboard focus smoothly to the first newly revealed option if triggered from Show more.
    if (visibleButtons[prevCount]) {
      setRovingTabIndex(prevCount);
      visibleButtons[prevCount].focus({ preventScroll: false });
    }
  };
  moreBtn.addEventListener('click', onMoreClick);
  cleanups.push(() => moreBtn.removeEventListener('click', onMoreClick));

  const setRovingTabIndex = (activeIdx) => {
    visibleButtons.forEach((btn, i) => btn.setAttribute('tabindex', i === activeIdx ? '0' : '-1'));
  };

  const onOptionsKeydown = (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const currentIdx = visibleButtons.indexOf(document.activeElement);
    if (currentIdx === -1) return;
    e.preventDefault();
    const cols = layout === 'grid' ? measureColumns(optionsEl, visibleButtons) : 1;
    const nextIdx = moveRovingIndex(currentIdx, e.key, visibleButtons.length, cols);
    if (nextIdx >= 0 && nextIdx < visibleButtons.length) {
      setRovingTabIndex(nextIdx);
      visibleButtons[nextIdx].focus({ preventScroll: false });
    }
  };
  optionsEl.addEventListener('keydown', onOptionsKeydown);
  cleanups.push(() => optionsEl.removeEventListener('keydown', onOptionsKeydown));

  const updateSelectedLine = () => {
    const current = allItems.find((x) => x.id === selectedId) ?? null;
    mount(selectedLine, formatSelected(current, { filtered: filteredItems.length, total: allItems.length }));
  };

  const handleSelect = (item, btn) => {
    selectedId = item.id;
    const activeIdx = visibleButtons.indexOf(btn);
    visibleButtons.forEach((b, i) => {
      const isSel = b.dataset.value === selectedId;
      b.setAttribute('aria-pressed', String(isSel));
      b.setAttribute('tabindex', i === (activeIdx >= 0 ? activeIdx : 0) ? '0' : '-1');
    });
    updateSelectedLine();
    onSelect(item);
  };

  const clearAll = () => {
    query = '';
    limit = pageSize;
    if (searchInput) searchInput.value = '';
    onClear?.();
    render();
    searchInput?.focus({ preventScroll: true });
  };

  function computeFiltered() {
    return filterPickerItems(allItems, {
      query,
      predicate: predicate ? (item) => predicate(item, scopeValue) : null,
      alwaysIncludeIds,
      keepSelectedId: selectedId,
      keepSelectedOutsideFilter,
    });
  }

  function render() {
    const focusedValue = optionsEl.contains(document.activeElement) ? document.activeElement?.dataset?.value : null;
    filteredItems = computeFiltered();

    // Slice to the current page limit; if the selected item is inside filteredItems but beyond the
    // slice (e.g. chosen by Random), surface it at the top so the selection is immediately visible.
    let shown = filteredItems.slice(0, limit);
    if (selectedId && !shown.some((x) => x.id === selectedId)) {
      const sel = filteredItems.find((x) => x.id === selectedId);
      if (sel) shown = [sel, ...shown.slice(0, Math.max(0, limit - 1))];
    }

    countLine.textContent = statusOverride ?? formatCount({ shown: shown.length, filtered: filteredItems.length, total: allItems.length, query, scope: scopeValue });
    updateSelectedLine();

    if (!shown.length) {
      optionsEl.hidden = true;
      moreBtn.hidden = true;
      emptyHost.hidden = false;
      visibleButtons = [];
      mount(
        emptyHost,
        stateBlock({
          title: emptyTitle,
          body: emptyBody,
          kind: 'empty',
          action: { label: 'Clear filters', variant: 'btn-secondary', onClick: clearAll },
        }),
      );
      return;
    }

    optionsEl.hidden = false;
    emptyHost.hidden = true;
    const activeIndex = Math.max(
      0,
      shown.findIndex((item) => item.id === (focusedValue ?? selectedId)),
    );

    visibleButtons = shown.map((item, i) => {
      const selected = item.id === selectedId;
      const spec = renderOption(item, { selected, scope: scopeValue });
      const btn = h(
        `button.picker-option${spec.className ?? ''}`,
        {
          ...(spec.attrs ?? {}),
          type: 'button',
          'data-value': item.id,
          'aria-pressed': String(selected),
          tabindex: i === activeIndex ? '0' : '-1',
        },
        spec.content,
      );
      btn.addEventListener('click', () => handleSelect(item, btn));
      return btn;
    });

    mount(optionsEl, visibleButtons);

    const remaining = filteredItems.length - shown.length;
    if (remaining > 0) {
      moreBtn.hidden = false;
      moreBtn.textContent = `Show more (${remaining} more)`;
    } else {
      moreBtn.hidden = true;
    }

    if (focusedValue !== null) {
      const target = visibleButtons.find((b) => b.dataset.value === focusedValue) ?? visibleButtons[0];
      target?.focus({ preventScroll: true });
    }
  }

  const el = h(
    'div.picker',
    {},
    controls.childNodes.length ? controls : null,
    extraPanel ?? null,
    countLine,
    optionsEl,
    moreBtn,
    emptyHost,
    selectedLine,
  );

  render();

  return {
    el,
    setItems(nextItems) {
      allItems = [...nextItems];
      statusOverride = null;
      render();
    },
    setStatus(text) {
      statusOverride = text;
      countLine.textContent = text;
    },
    setValue(nextId) {
      selectedId = nextId;
      render();
    },
    getValue() {
      return selectedId;
    },
    setQuery(nextQuery) {
      query = nextQuery;
      if (searchInput) searchInput.value = nextQuery;
      limit = pageSize;
      render();
    },
    refresh() {
      limit = pageSize;
      render();
    },
    getFiltered() {
      return computeFiltered();
    },
    clear: clearAll,
    cleanup() {
      for (const fn of cleanups) fn();
    },
  };
}

/**
 * Small single-select group of option cards (formats, opponents) with `aria-pressed` and roving
 * arrow-key focus. Returns `{ el, cleanup }`.
 *
 * @template {{ id: string }} T
 * @param {{
 *   label: string,
 *   className?: string,
 *   options: T[],
 *   value: string,
 *   renderOption: (item: T, selected: boolean) => { className?: string, attrs?: Record<string, any>, content: any },
 *   onChange: (item: T) => void,
 * }} opts
 */
export function createOptionGroup({ label, className = '', options, value, renderOption, onChange }) {
  let current = value;
  const group = h(`div.option-grid${className}`, { role: 'group', 'aria-label': label });
  const buttons = options.map((opt, i) => {
    const selected = opt.id === current;
    const spec = renderOption(opt, selected);
    const btn = h(
      `button.option-card${spec.className ?? ''}`,
      {
        ...(spec.attrs ?? {}),
        type: 'button',
        'data-value': opt.id,
        'aria-pressed': String(selected),
        tabindex: selected || (!options.some((o) => o.id === current) && i === 0) ? '0' : '-1',
      },
      spec.content,
    );
    btn.addEventListener('click', () => {
      current = opt.id;
      buttons.forEach((b, idx) => {
        const isSel = options[idx].id === current;
        b.setAttribute('aria-pressed', String(isSel));
        b.setAttribute('tabindex', isSel ? '0' : '-1');
      });
      onChange(opt);
    });
    return btn;
  });
  group.append(...buttons);

  const onKeydown = (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const idx = buttons.indexOf(document.activeElement);
    if (idx === -1) return;
    e.preventDefault();
    const cols = measureColumns(group, buttons);
    const next = moveRovingIndex(idx, e.key, buttons.length, cols);
    if (next >= 0 && next < buttons.length) {
      buttons.forEach((b, i) => b.setAttribute('tabindex', i === next ? '0' : '-1'));
      buttons[next].focus({ preventScroll: false });
    }
  };
  group.addEventListener('keydown', onKeydown);

  return {
    el: group,
    cleanup() {
      group.removeEventListener('keydown', onKeydown);
    },
  };
}

