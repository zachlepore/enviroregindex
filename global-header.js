'use strict';

class EriGlobalHeader extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active');
    this.innerHTML = `
      <header class="global-header">
        <div class="global-header-inner">
          <a class="global-header-logo" href="/directory.html" aria-label="EnviroRegIndex Directory">
            Enviro<span>Reg</span>Index
          </a>
          <nav class="global-header-nav" aria-label="Primary navigation">
            <a class="global-header-link${active === 'directory' ? ' active' : ''}"
               href="/directory.html"${active === 'directory' ? ' aria-current="page"' : ''}>Directory</a>
            <a class="global-header-link${active === 'workflows' ? ' active' : ''}"
               href="/tasks.html"${active === 'workflows' ? ' aria-current="page"' : ''}>Workflows</a>
          </nav>
        </div>
      </header>`;
  }
}

customElements.define('eri-global-header', EriGlobalHeader);
