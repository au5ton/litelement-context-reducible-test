import { consume } from '@lit-labs/context'
import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MyContext, MyContextProvider } from './my-context-provider'

@customElement('my-context-consumer')
export class MyContextConsumer extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 25px;
      color: var(--au5ton-test-text-color, #000);
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      border: 1px dotted blue;
    }
  `;

  @consume({ context: MyContext, subscribe: true })
  @property()
  context?: MyContext;

  render() {
    return html`
      <fieldset>
        <legend><slot></slot></legend>
        <fluent-button appearance="accent" @click=${this._handleAddTag}>Add tag</fluent-button>
        <p>Tags:</p>
        <div class="tags">
          ${
            this.context?.tags.map(tag => (
              html`
              <fluent-badge appearance="accent">${tag} <span style="cursor: pointer;" @click=${() => this._handleRemoveTag(tag)}>❎</span></fluent-badge>
              `
            ))
          }
          ${
            this.context?.tags.length === 0 ? 'No tags' : ''
          }
        </div>
        <pre>${JSON.stringify(this.context, null, 2)}</pre>
      </fieldset>
    `;
  }

  private _handleAddTag() {
    MyContextProvider.reduce(this, ctx => {
      const insertion = prompt('What new tag should be added?', 'test');
      if (insertion) {
        ctx.tags.push(insertion);
      }
      return ctx;
    })
  }

  private _handleRemoveTag(tag: string) {
    MyContextProvider.reduce(this, ctx => {
      const index = ctx.tags.findIndex(t => t === tag);
      if (index >= 0) {
        ctx.tags.splice(index, 1);
      }
      return ctx;
    })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-context-consumer': MyContextConsumer;
  }
}
