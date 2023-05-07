
import { LitElement, ReactiveController } from 'lit'
import type { AbstractConstructor } from './constructor'
import { ContextProvider } from '@lit-labs/context';

export type Reducer<T> = (previous: T) => T;

/**
 * This allows you to MUTATE a contextualized property, from EITHER the provider or ANY of the consumers,
 * and then trigger updates to ALL other consumers.
 * 
 * This was a lot of work just because we don't want to have to deep copy...
 * 
 * I have no idea what other weird side effects this code has. There's a safer version in another file.
 * This "unsafe" version ACTUALLY mutates the property and doesn't replace it, so things like Element references are fair game.
 * However, some hacky business is done to manipulate the LitElement/ContextProvider lifecycle into believing that we've updated the object even though we haven't.
 * No private properties or methods are accessed, so it probably won't break in the future, but it's still kinda ... sketchy.
 */
export function ContextReducibleMixin<T extends AbstractConstructor, Context>(superClass: T, reduceEventName: string) {
  abstract class Mixin extends superClass {
    constructor(...args: any[]) {
      super(...args);
      // @ts-ignore
      if (this.__context_reducible__providers === undefined) {
        this.__context_reducible__providers = new Set();
      }
    }

    // The event we will use to communicate child-to-ancestor
    static _reduceEventName: string = reduceEventName;
    // Allows the host to process the reduction
    abstract handleReduce(event: CustomEvent<Reducer<Context>>): void;
    // The reduction function that descendents will call
    public static reduce(target: LitElement, reducer: Reducer<Context>) {
      const event = new CustomEvent<Reducer<Context>>(Mixin._reduceEventName, {
        bubbles: true,
        composed: true,
        detail: reducer,
      })
      target.dispatchEvent(event);
    }

    // #region "requestUpdate()" hacky workarounds
    /**
     * This is necessary because calling "requestUpdate()" on the host
     * FOR SOME REASON doesn't update the context in the subscribed descendents.
     */
    public __context_reducible__providers: Set<ContextProvider<{__context__: Context}>>;

    /**
     * The `requestUpdate` function should also update any observers
     */
    requestUpdate(...args: any[]): void {
      if (this instanceof LitElement) {
        // @ts-ignore
        super.requestUpdate(...args);
      }
      // Update observers
      this.__context_reducible__providers?.forEach(provider => provider.updateObservers());
    }

    // #region Store references of `ContextProvider` controllers as they're added
    /**
     * We need this in order to keep track of the Context Providers
     * Also, somehow this runs before the constructor is called???
     */
    addController(controller: ReactiveController): void {
      if (this instanceof LitElement) {
        // @ts-ignore
        super.addController(controller);
      }
      console.log('addController', this)
      // store a copy of the controller, if we aren't storing it already
      if (controller instanceof ContextProvider) {
        if (this.__context_reducible__providers === undefined) {
          this.__context_reducible__providers = new Set();
        }
        this.__context_reducible__providers.add(controller);
      }
    }
    removeController(controller: ReactiveController): void {
      if (this instanceof LitElement) {
        // @ts-ignore
        super.removeController(controller);
      }
      console.log('removeController', this)
      // store a copy of the controller
      if (controller instanceof ContextProvider) {
        this.__context_reducible__providers?.delete(controller);
      }
    }
    // #endregion

    // #region Automatically call `_handleReduce` when the event is triggered
    connectedCallback() {
      if (this instanceof LitElement) {
        // @ts-ignore
        super.connectedCallback();
        // 
        this.shadowRoot?.addEventListener(Mixin._reduceEventName, this.handleReduce.bind(this) as EventListener);
      }
    }
    disconnectedCallback() {
      if (this instanceof LitElement) {
        // @ts-ignore
        super.disconnectedCallback();
        // 
        this.shadowRoot?.removeEventListener(Mixin._reduceEventName, this.handleReduce.bind(this) as EventListener);
      }
    }
    // #endregion

    // #endregion
  }

  return Mixin;
}


