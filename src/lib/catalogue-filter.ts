let controller: AbortController | undefined;
function init() {
  controller?.abort(); controller = new AbortController();
  const signal = controller.signal;
  document.querySelectorAll<HTMLElement>('[data-catalogue]').forEach(root => {
    const controls = [...root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-filter]')];
    const items = [...root.querySelectorAll<HTMLElement>('[data-catalogue-item]')];
    const status = root.querySelector<HTMLElement>('[data-catalogue-status]');
    root.querySelector<HTMLElement>('[data-catalogue-controls]')?.removeAttribute('hidden');
    function apply(updateUrl = true) {
      const values = Object.fromEntries(controls.map(el => [el.dataset.filter!, el.value.trim()]));
      let count = 0;
      for (const item of items) {
        const matches = (!values.q || (item.dataset.search ?? '').toLocaleLowerCase().includes(values.q.toLocaleLowerCase())) &&
          ['status', 'kind', 'category'].every(key => !values[key] || (item.dataset[key] ?? '').split('|').includes(values[key]));
        item.hidden = !matches; if (matches) count++;
      }
      if (status) { status.hidden = !Object.values(values).some(Boolean); status.textContent = count ? `找到 ${count} 项内容` : '没有找到对应内容。可以换个关键词，或选择更宽的筛选范围。'; }
      root.querySelectorAll<HTMLElement>('[data-catalogue-select]').forEach(wrapper => {
        const select = wrapper.querySelector<HTMLSelectElement>('select')!;
        const trigger = wrapper.querySelector<HTMLButtonElement>('.custom-select-trigger')!;
        const label = select.selectedOptions[0]?.textContent ?? '';
        trigger.textContent = label;
        trigger.setAttribute('aria-label',`${wrapper.dataset.label}：${label}`);
        wrapper.querySelectorAll<HTMLElement>('[data-value]').forEach(option => {
          const selected = option.dataset.value === select.value;
          option.classList.toggle('is-selected',selected); option.setAttribute('aria-selected',String(selected));
        });
      });
      const countLabel = root.querySelector<HTMLElement>('[data-filter-count]');
      const activeCount = controls.filter(el=>el instanceof HTMLSelectElement && el.value).length;
      if (countLabel) countLabel.textContent = activeCount ? ` · ${activeCount}` : '';
      if (updateUrl) {
        const url = new URL(location.href);
        controls.forEach(el => { const key = el.dataset.filter!; el.value ? url.searchParams.set(key, el.value) : url.searchParams.delete(key); });
        history.replaceState(history.state, '', url);
      }
    }
    function restore() {
      const params = new URLSearchParams(location.search);
      controls.forEach(el => {
        const value = params.get(el.dataset.filter!) ?? '';
        el.value = el instanceof HTMLSelectElement && ![...el.options].some(o=>o.value===value) ? '' : value;
      }); apply(false);
    }
    controls.forEach(el => el.addEventListener(el instanceof HTMLSelectElement ? 'change' : 'input', () => apply(), { signal }));
    root.querySelectorAll<HTMLElement>('[data-catalogue-select]').forEach(wrapper => {
      const trigger = wrapper.querySelector<HTMLButtonElement>('.custom-select-trigger')!;
      const select = wrapper.querySelector<HTMLSelectElement>('select')!;
      const options = [...wrapper.querySelectorAll<HTMLButtonElement>('[data-value]')];
      const close = () => { wrapper.classList.remove('is-open'); trigger.setAttribute('aria-expanded','false'); };
      const open = () => {
        root.querySelectorAll<HTMLElement>('[data-catalogue-select]').forEach(other => {
          other.classList.remove('is-open'); other.querySelector('button')?.setAttribute('aria-expanded','false');
        });
        wrapper.classList.add('is-open'); trigger.setAttribute('aria-expanded','true');
        (options.find(o=>o.dataset.value===select.value) ?? options[0])?.focus();
      };
      trigger.addEventListener('click',()=>wrapper.classList.contains('is-open') ? close() : open(),{signal});
      options.forEach(option => option.addEventListener('click',()=>{
        select.value = option.dataset.value!; select.dispatchEvent(new Event('change')); close(); trigger.focus();
      },{signal}));
      wrapper.addEventListener('keydown',event=>{
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); trigger.focus(); }
        if (event.key === 'Tab') close();
        if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
          event.preventDefault();
          if (!wrapper.classList.contains('is-open')) { open(); return; }
          const current = options.indexOf(document.activeElement as HTMLButtonElement);
          const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length-1 : (current + (event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length;
          options[index]?.focus();
        }
      },{signal});
      document.addEventListener('click',event=>{ if (!wrapper.contains(event.target as Node)) close(); },{signal});
      wrapper.closest('details')?.addEventListener('toggle',event=>{ if (!(event.target as HTMLDetailsElement).open) close(); },{signal});
    });
    window.addEventListener('popstate', restore, { signal }); restore();
  });
}
export function installCatalogueFilters() { document.addEventListener('astro:page-load', init); init(); }
