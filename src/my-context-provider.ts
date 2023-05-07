import { createContext, provide } from '@lit-labs/context'
import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ContextReducibleMixin, Reducer } from './context-reducible-mixin';
import { ContextReducibleMixin as ContextReducibleMixinSafe } from './context-reducible-mixin-safe'

export type MyContext = {
  name: string;
  tags: string[];
}

export const MyContext = createContext<MyContext>(Symbol('my-context'));

@customElement('my-context-provider')
export class MyContextProvider extends ContextReducibleMixinSafe<typeof LitElement, MyContext>(LitElement, 'my-context-update') {
  // #region Styles
  static styles = css`
    :host {
      display: block;
      padding: 25px;
      color: var(--au5ton-test-text-color, #000);
    }
  `;
  // #endregion

  // #region Static Properties
  // #endregion

  // #region Properties
  @provide({ context: MyContext })
  @property()
  context: MyContext = { name: 'Alice', tags: [] };
  // #endregion

  // #region Render Function
  render() {
    return html`
      <fieldset>
        <legend>Provider</legend>
        <button @click=${this._handleClick}>Replace</button>
        <pre>${JSON.stringify(this.context, null, 2)}</pre>
        <slot ></slot>
      </fieldset>
    `;
  }
  // #endregion

  // #region Event Handlers
  
  /**
   * Test using the conventional context update
   */
  private _handleClick() {
    //this.__controllers
    this.context = {
      ...this.context,
      tags: [
        ...this.context.tags,
        'What is this?'
      ]
    };
  }

  /**
   * Instructions for how the provider is supposed to respond to requests for a context update
   */
  handleReduce(event: CustomEvent<Reducer<MyContext>>) {
    console.log('_handleReduce', this)
    this.context = event.detail(this.context);
    // below is not needed when doing ContextReducibleMixinSafe
    //this.requestUpdate()
  }
  // #endregion
}

declare global {
  interface HTMLElementTagNameMap {
    'my-context-provider': MyContextProvider;
  }
}
