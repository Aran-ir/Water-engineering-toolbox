import {router} from '@alwatr/router';
import {SignalInterface} from '@alwatr/signal';
import {css, html, nothing} from 'lit';
import {customElement} from 'lit/decorators/custom-element.js';

import '@erbium/iconsax';
import 'pwa-helper-components/pwa-install-button.js';
import 'pwa-helper-components/pwa-update-available.js';

import {AppElement} from './app-debt/app-element';
import {mainNavigation} from './config';

import './pages/page-home';
import './pages/page-game';
import './pages/page-about';

import type {RoutesConfig} from '@alwatr/router';
import type {ListenerInterface} from '@alwatr/signal';
import type {TemplateResult, CSSResult} from 'lit';


declare global {
  interface HTMLElementTagNameMap {
    'app-index': AppIndex;
  }
}

/**
 * APP PWA Root Element
 *
 * ```html
 * <app-index></app-index>
 * ```
 */
@customElement('app-index')
export class AppIndex extends AppElement {
  static override styles = [
    ...(<CSSResult[]>AppElement.styles),
    css`
      :host {
        inset: 0;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        display: flex;
        position: absolute;
        flex-direction: column;
        justify-content: space-between;
        contain: layout size style;
        overflow: hidden;
        z-index: 0;
      }
      .page-container {
        position: relative;
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: 0%;
        contain: size layout style;
      }
      ion-tab-bar {
        height: 56px;
      }
      ion-tab-button {
        letter-spacing: 0;
        font-size: 12px;
        font-weight: 400;
      }
      /* This will be displayed only on lazy loading. */
      [unresolved]::after {
        content: '...';
        display: block;
        font-size: 2em;
        padding-top: 30vh;
        letter-spacing: 3px;
        text-align: center;
      }
    `,
  ];

  constructor() {
    super();
    router.initial();
  }

  protected _hideNavigation = true;
  protected _hideNavigationSignal = new SignalInterface('hide-navigation');
  protected _activePage = 'home';
  protected _listenerList: Array<unknown> = [];

  protected _routes: RoutesConfig = {
    // TODO: refactor route, we need to get active page!
    // TODO: ability to redirect!
    map: (route) => (this._activePage = route.sectionList[0]?.toString().trim() || 'home'),
    list: {
      home: {
        render: () => html`<page-home class="ion-page"></page-home>`,
      },
      about: {
        render: () => html`<page-about class="ion-page"></page-about>`,
      },
    },
  };

  override connectedCallback(): void {
    super.connectedCallback();

    this._listenerList.push(
        router.signal.addListener(
            (route) => {
              this._logger.logMethodArgs('routeChanged', {route});
              this._activePage = route.sectionList[0]?.toString().trim() || 'home';
              this.requestUpdate();
            },
            {receivePrevious: true},
        ),
        this._hideNavigationSignal.addListener((_hideNavigation) => {
          const oldValue = this._hideNavigation;
          this._hideNavigation = _hideNavigation;
          this.requestUpdate('_hideNavigation', oldValue);
        }),
    );

    this._hideNavigationSignal.dispatch(false);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._listenerList.forEach((listener) => (listener as ListenerInterface<keyof AlwatrSignals>).remove());
  }

  override render(): TemplateResult {
    return html`
      ${this._renderHeader()}
      <main class="page-container">${router.outlet(this._routes)}</main>
    `;
  }

  protected _renderHeader(): TemplateResult | typeof nothing {
    if (this._hideNavigation) return nothing;

    const listTemplate = mainNavigation.map((item) => {
      const selected = this._activePage === item.id;
      return html`
        <ion-button href="${router.makeUrl({sectionList: [item.id]})}" ?hidden="${selected}">
          <er-iconsax slot="icon-only" name="${item.icon}" category="broken"></er-iconsax>
        </ion-button>
      `;
    });

    return html`
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title slot="start"></ion-title>
          <ion-buttons slot="primary">${listTemplate}</ion-buttons>
          ${this._renderPWAButtons()}
        </ion-toolbar>
      </ion-header>
    `;
  }

  protected _renderPWAButtons(): TemplateResult {
    return html`
      <ion-buttons slot="end">
        <pwa-install-button>
          <ion-button>
            <er-iconsax slot="icon-only" name="import" category="broken"></er-iconsax>
          </ion-button>
        </pwa-install-button>
        <pwa-update-available>
          <ion-button>
            <er-iconsax slot="icon-only" name="export" category="broken"></er-iconsax>
          </ion-button>
        </pwa-update-available>
      </ion-buttons>
    `;
  }
}
