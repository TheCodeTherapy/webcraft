import { Controller } from '../../controller';

class LinkUI {
	elem: HTMLElement;

	titleElem: HTMLElement;

	boxElem: HTMLElement;

	controller: Controller;

	constructor(el: HTMLElement, controller) {
		this.controller = controller;
		this.elem = document.createElement('div');
		this.elem.setAttribute('id', 'link-ui');
		this.elem.innerHTML = LinkUI.templateElement;
		Array.from(this.elem.querySelectorAll('.close')).forEach(d => d.addEventListener('click', () => this.hide()));
		this.elem.classList.add('threecraft-ui', 'bag-box', 'hidden');
		el.appendChild(this.elem);
	}

	static templateElement = `
    <div id="link-ui-box" class="link-ui-box bag-box-content">
      <div class="title mc-menu">
        <div>Create Link</div>
        <button class="button close">×</button>
      </div>

      <label for="link-ui-input" class="link-ui-label">Link</label>
      <input id="link-ui-input" class="link-ui-input" type="text" />
      <br>
      <label for="link-ui-name" class="link-ui-label">Name (Optional)</label>
      <input id="link-ui-name" class="link-ui-input" type="text" />
      <br>
      <button id="link-ui-button" class="button">Create</button>
    </div>
  `;

	hide() {
		this.elem.classList.add('hidden');
	}

	show() {
		this.elem.classList.remove('hidden');
	}
}

export default LinkUI;
