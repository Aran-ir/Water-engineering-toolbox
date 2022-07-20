import {isNumber, transformToRange} from '@alwatr/math';
import {css, html, nothing} from 'lit';
import {customElement} from 'lit/decorators/custom-element.js';
import {query} from 'lit/decorators/query.js';

import {AppElement} from '../app-debt/app-element';
import {fillPipeGunyaMethod} from '../utilities/flow-calculator';

import type {ListenerInterface} from '@alwatr/signal';
import type {IonContent} from '@ionic/core/components/ion-content';
import type {TemplateResult, CSSResult, PropertyDeclaration, PropertyValues} from 'lit';

declare global {
  interface HTMLElementTagNameMap {
    'flow-rate-calculator-gunya-method': PageFlowCalculator;
  }
}

type lines = {
  horizontalDistanceLine: {start: {x: number; y: number}; end: {x: number; y: number}};
  heightLine: {end: {x: number; y: number}};
};

/**
 * APP PWA Flow Calculation Page Element
 *
 * ```html
 * <flow-rate-calculator-gunya-method></flow-rate-calculator-gunya-method>
 * ```
 */
@customElement('flow-rate-calculator-gunya-method')
export class PageFlowCalculator extends AppElement {
  static override styles = [
    ...(<CSSResult[]>AppElement.styles),
    css`
      input#file-input[type='file'] {
        display: none;
      }
      .file__input-label {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }
      .form__input-hd {
        --ion-color-primary: #f02d01;
      }

      #image-canvas {
        width: 100%;
        object-fit: contain;
      }
    `,
  ];

  protected _listenerList: Array<unknown> = [];
  protected _ctx?: CanvasRenderingContext2D;
  protected _canvas?: HTMLCanvasElement;
  protected _image?: HTMLImageElement;
  protected _lines: lines = {
    horizontalDistanceLine: {start: {x: 0, y: 0}, end: {x: 0, y: 0}},
    heightLine: {end: {x: 0, y: 0}},
  };
  protected _results: number[] = [];

  @query('ion-content') protected _contentElement?: IonContent;

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('resize', () => this._scrollToBottom());
    // this._listenerList.push(router.signal.addListener(() => this.requestUpdate()));
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('resize', () => this._scrollToBottom());
    this._listenerList.forEach((listener) => (listener as ListenerInterface<keyof AlwatrSignals>).remove());
  }

  override render(): TemplateResult {
    return html`
      <ion-content class="ion-padding">
        <canvas id="image-canvas" height="0"> </canvas>
        ${this._renderForm()} ${this._renderResultList()}
      </ion-content>
    `;
  }

  override requestUpdate(
      name?: PropertyKey | undefined,
      oldValue?: unknown,
      options?: PropertyDeclaration<unknown, unknown> | undefined,
  ): void {
    super.requestUpdate(name, oldValue, options);

    if (name === '_image' && this._canvas && this._ctx && this._image) {
      this._canvas.width = this._image?.width ?? 0;
      this._canvas.height = this._image?.height ?? 0;
      this._ctx.drawImage(this._image, 0, 0);
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (this._canvas) {
      this._canvas.addEventListener('touchstart', (e: TouchEvent) => {
        this._disableScroll();
        const lines = this._lines;

        this._touch(e, lines);
      });
      this._canvas.addEventListener('touchend', () => {
        this._enableScroll();

        this._canvas?.removeEventListener('touchend', () => undefined);
      });
    }
  }

  protected _renderForm(): TemplateResult {
    return html`
      <ion-list>
        <ion-button expand="block" fill="outline" class="ion-margin-horizontal">
          <label class="file__input-label" for="file-input">${this._localize.term('upload-image')}</label>
        </ion-button>
        <input type="file" id="file-input" accept="image/*" @change=${this._imageInputChange} />
        <ion-item class="form__input-hd">
          <ion-label position="floating">${this._localize.term('horizontal-distance')}</ion-label>
          <ion-input
            id="horizontal-distance"
            type="number"
            inputmode="numeric"
            required
            @ionFocus=${this._scrollToBottom}
          ></ion-input>
        </ion-item>
        <ion-item class="form__input-pd">
          <ion-label position="floating">${this._localize.term('pipe-diameter')}</ion-label>
          <ion-input
            id="pipe-diameter"
            type="number"
            inputmode="numeric"
            required
            @ionFocus=${this._scrollToBottom}
          ></ion-input>
        </ion-item>
      </ion-list>
      <ion-button expand="block" @click=${(): void => this._calculation()}>
        ${this._localize.term('calculation')}
      </ion-button>
    `;
  }
  protected _renderResultList(): TemplateResult | typeof nothing {
    if (!this._results.length) return nothing;

    const resultsTemplate = this._results.map(
        (result) => html`
        <ion-item>
          <ion-label>${this._localize.number(result)}</ion-label>
        </ion-item>
      `,
    );
    return html` <ion-list>${resultsTemplate}</ion-list> `;
  }

  protected _imageInputChange(event: InputEvent): void {
    const input = <HTMLInputElement | null>event.target;
    this._canvas = this.renderRoot.querySelector('canvas') ?? undefined;
    this._ctx = this._canvas?.getContext('2d') ?? undefined;

    if (input && input.files && input.files[0]) {
      this._image = new Image();
      this._image.addEventListener('load', () => {
        this.requestUpdate('_image');

        if (this._canvas) {
          this._lines = {
            heightLine: {
              end: {
                x: transformToRange(90, {in: [0, 100], out: [0, this._canvas.width]}),
                y: transformToRange(90, {in: [0, 100], out: [0, this._canvas.height]}),
              },
            },
            horizontalDistanceLine: {
              start: {
                x: transformToRange(10, {in: [0, 100], out: [0, this._canvas.width]}),
                y: transformToRange(10, {in: [0, 100], out: [0, this._canvas.height]}),
              },
              end: {
                x: transformToRange(90, {in: [0, 100], out: [0, this._canvas.width]}),
                y: transformToRange(10, {in: [0, 100], out: [0, this._canvas.height]}),
              },
            },
          };
          this._linesUpdate();
        }
      });
      this._image.src = URL.createObjectURL(input.files[0]);
    }
  }

  protected _touch(event: TouchEvent, lines: lines): void {
    if (!this._canvas) return undefined;

    const canvasRect = this._canvas.getBoundingClientRect();

    const position = {
      x: transformToRange(event.touches[0].clientX - canvasRect.left, {
        in: [0, this._canvas.clientWidth],
        out: [0, this._canvas.width],
      }),
      y: transformToRange(event.touches[0].clientY - canvasRect.top, {
        in: [0, this._canvas.clientHeight],
        out: [0, this._canvas.height],
      }),
    };
    const line:
      | {lineName: 'horizontalDistanceLine' | undefined; pointName: 'start' | 'end' | undefined}
      | {lineName: 'heightLine' | undefined; pointName: 'start' | undefined} = {
        lineName: undefined,
        pointName: undefined,
      };

    if (
      this._isAlmostEqual(lines.horizontalDistanceLine.start.x, position.x, this._canvas.width) &&
      this._isAlmostEqual(lines.horizontalDistanceLine.start.y, position.y, this._canvas.height)
    ) {
      line.lineName = 'horizontalDistanceLine';
      line.pointName = 'start';
    } else if (
      this._isAlmostEqual(lines.horizontalDistanceLine.end.x, position.x, this._canvas.width) &&
      this._isAlmostEqual(lines.horizontalDistanceLine.end.y, position.y, this._canvas.height)
    ) {
      line.lineName = 'horizontalDistanceLine';
      line.pointName = 'end';
    } else if (
      this._isAlmostEqual(lines.heightLine.end.x, position.x, this._canvas.width) &&
      this._isAlmostEqual(lines.heightLine.end.y, position.y, this._canvas.height)
    ) {
      line.lineName = 'heightLine';
      line.pointName = 'end';
    }

    const touchMoveEvent = (e: TouchEvent): void => {
      const position = this._touchMoveEventToPosition(e);
      if (position && line.lineName && line.pointName) {
        if (line.lineName === 'horizontalDistanceLine') {
          this._lines[line.lineName][line.pointName] = position;
        } else if (line.lineName === 'heightLine') {
          this._lines[line.lineName]['end'] = position;
        }
        this._linesUpdate();
      }
    };

    if (line.lineName && line.pointName) {
      this._canvas?.addEventListener('touchmove', touchMoveEvent);
      this._canvas?.addEventListener('touchend', () => {
        this._canvas?.removeEventListener('touchmove', touchMoveEvent);
      });
    }
  }
  protected _touchMoveEventToPosition(event: TouchEvent): undefined | {x: number; y: number} {
    if (!this._canvas) return undefined;

    const canvasRect = this._canvas.getBoundingClientRect();

    return {
      x: transformToRange(event.touches[0].clientX - canvasRect.left, {
        in: [0, this._canvas.clientWidth],
        out: [0, this._canvas.width],
      }),
      y: transformToRange(event.touches[0].clientY - canvasRect.top, {
        in: [0, this._canvas.clientHeight],
        out: [0, this._canvas.height],
      }),
    };
  }

  protected _enableScroll(): void {
    if (!this._contentElement) return;

    this._contentElement.scrollY = true;
  }
  protected _disableScroll(): void {
    if (!this._contentElement) return;

    this._contentElement.scrollToTop(100);
    this._contentElement.scrollY = false;
  }
  protected _scrollToBottom(): void {
    console.log(!this._contentElement, '_scrollToBottom');

    if (!this._contentElement) return;

    this._contentElement.scrollToBottom(100);
  }
  protected _clear(): void {
    if (this._ctx && this._canvas && this._image) {
      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
      this._ctx.drawImage(this._image, 0, 0);
    }
  }
  protected _isAlmostEqual(number1: number, number2: number, baseNumber: number): boolean {
    if (number1 > Math.floor(number2 - baseNumber / 10) && number1 < Math.floor(number2 + baseNumber / 10)) {
      return true;
    }
    return false;
  }
  protected _drawLine(start: {x: number; y: number}, end: {x: number; y: number}, color = '#f02d01'): void {
    if (!this._ctx || !this._canvas || !this._image) return;

    this._ctx.beginPath();

    this._ctx.lineWidth = transformToRange(2, {in: [0, 100], out: [0, this._canvas.width]});
    this._ctx.strokeStyle = color;
    this._ctx.moveTo(start.x, start.y);
    this._ctx.arc(
        start.x,
        start.y,
        transformToRange(1, {in: [0, 100], out: [0, this._canvas.width]}),
        0,
        2 * Math.PI,
        false,
    );
    this._ctx.moveTo(end.x, end.y);
    this._ctx.arc(
        end.x,
        end.y,
        transformToRange(1, {in: [0, 100], out: [0, this._canvas.width]}),
        0,
        2 * Math.PI,
        false,
    );

    this._ctx.moveTo(start.x, start.y);
    this._ctx.lineTo(end.x, end.y);

    this._ctx.stroke();
  }
  protected _linesUpdate(): void {
    this._clear();
    this._drawLine(this._lines.horizontalDistanceLine.start, this._lines.horizontalDistanceLine.end);
    this._drawLine(this._lines.horizontalDistanceLine.end, this._lines.heightLine.end, '#7f00ca');
  }
  protected _calculation(): void {
    const horizontalDistanceInput = <HTMLIonInputElement | null>(
      this.renderRoot.querySelector('ion-input#horizontal-distance')
    );
    const diameterPipeInput = <HTMLIonInputElement | null> this.renderRoot.querySelector('ion-input#pipe-diameter');

    if (
      diameterPipeInput &&
      diameterPipeInput.value &&
      isNumber(diameterPipeInput.value) &&
      horizontalDistanceInput &&
      horizontalDistanceInput.value &&
      isNumber(horizontalDistanceInput.value)
    ) {
      const diameterPipe = Number(diameterPipeInput.value);
      const horizontalDistance = Number(diameterPipeInput.value);

      const result = fillPipeGunyaMethod(diameterPipe, horizontalDistance);

      this._results.unshift(result);
      this.requestUpdate();
    }
  }
}
