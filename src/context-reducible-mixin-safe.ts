
import { LitElement, ReactiveController } from 'lit'
import type { AbstractConstructor } from './constructor'
import { ContextProvider } from '@lit-labs/context';
import { cloneDeep } from 'lodash-es'

export type Reducer<T> = (previous: T) => T;

/**
 * This allows you to MUTATE a contextualized property, from EITHER the provider or ANY of the consumers,
 * and then trigger updates to ALL other consumers.
 * 
 * This is the safer version of this mixin, where no hacky business is done to manipulate the LitElement/ContextProvider lifecycle.
 * However, the limitation of this is that a deep clone of the context is performed, which is why the normal context process works fine for this.
 * 
 * Quirks of the deep clone process: https://lodash.com/docs/4.17.15#cloneDeep
 */
export function ContextReducibleMixin<T extends AbstractConstructor, Context>(superClass: T, reduceEventName: string) {
  abstract class Mixin extends superClass {
    // The event we will use to communicate child-to-ancestor
    static _reduceEventName: string = reduceEventName;
    // Allows the host to process the reduction
    abstract handleReduce(event: CustomEvent<Reducer<Context>>): void;
    public __handleReduceInternal(event: CustomEvent<Reducer<Context>>): void {
      event.stopPropagation();
      this.handleReduce(event);
    }
    // The reduction function that descendents will call
    public static reduce(target: LitElement, reducer: Reducer<Context>) {
      const event = new CustomEvent<Reducer<Context>>(Mixin._reduceEventName, {
        bubbles: true,
        composed: true,
        // performs a deep clone of whatever the original reducer created
        detail: (previous) => cloneDeep(reducer(previous)),
      })
      target.dispatchEvent(event);
    }

    // #region Automatically call `_handleReduce` when the event is triggered
    connectedCallback() {
      if (this instanceof LitElement) {
        // @ts-ignore
        super.connectedCallback();
        // 
        this.shadowRoot?.addEventListener(Mixin._reduceEventName, this.__handleReduceInternal.bind(this) as EventListener);
      }
    }
    disconnectedCallback() {
      if (this instanceof LitElement) {
        // @ts-ignore
        super.disconnectedCallback();
        // 
        this.shadowRoot?.removeEventListener(Mixin._reduceEventName, this.__handleReduceInternal.bind(this) as EventListener);
      }
    }
    // #endregion
  }

  return Mixin;
}


