import {router} from '@alwatr/router';
import {css, html} from 'lit';
import {customElement} from 'lit/decorators/custom-element.js';
import {when} from 'lit/directives/when.js';

import {AppElement} from '../app-debt/app-element';
import {Tools} from '../config';

import type {ListenerInterface} from '@alwatr/signal';
import type {TemplateResult, CSSResult} from 'lit';

declare global {
  interface HTMLElementTagNameMap {
    'page-home': PageHome;
  }
}

/**
 * APP PWA Home Page Element
 *
 * ```html
 * <page-home></page-home>
 * ```
 */
@customElement('page-home')
export class PageHome extends AppElement {
  static override styles = [...(<CSSResult[]>AppElement.styles), css``];

  protected _listenerList: Array<unknown> = [];

  override connectedCallback(): void {
    super.connectedCallback();
    // this._listenerList.push(router.signal.addListener(() => this.requestUpdate()));
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._listenerList.forEach((listener) => (listener as ListenerInterface<keyof AlwatrSignals>).remove());
  }

  override render(): TemplateResult {
    return html` <ion-content> ${this._renderToolsList()} </ion-content> `;
  }

  protected _renderToolsList(): TemplateResult {
    const toolsTemplate = Tools.map(
        (tool) => html`
        <ion-item href=${router.makeUrl({sectionList: [tool.id]})}>
          ${when(tool.icon, () => html`<er-iconsax name=${tool.icon} category="broken" slot="start"></er-iconsax>`)}
          <ion-label>${this._localize.term(tool.id)}</ion-label>
        </ion-item>
      `,
    );

    return html` <ion-list lines="full">${toolsTemplate}</ion-list>`;
  }
}
