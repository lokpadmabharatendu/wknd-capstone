/*
 * table-specs block
 * A label/value specification list (stacked "definition list" layout),
 * migrated from the WKND content-fragment element list.
 * Each authored row = one spec: cell 1 = label, cell 2 = value.
 */

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  const dl = document.createElement('dl');
  dl.className = 'table-specs-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 0) return;

    const group = document.createElement('div');
    group.className = 'table-specs-spec';

    const dt = document.createElement('dt');
    dt.className = 'table-specs-label';
    dt.innerHTML = cells[0] ? cells[0].innerHTML : '';

    const dd = document.createElement('dd');
    dd.className = 'table-specs-value';
    dd.innerHTML = cells[1] ? cells[1].innerHTML : '';

    group.append(dt, dd);
    dl.append(group);
  });

  block.replaceChildren(dl);
}
