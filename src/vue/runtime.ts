import Vue from 'vue'
import { ReservedTag } from './built-in'

export { ReservedTag }

export function inject (
  Ctor: any /* typeof Vue */,
  render: Function,
  staticRenderFns: Function[]
) {
  Ctor.options.render = render
  Ctor.options.staticRenderFns = staticRenderFns
}

declare module 'vue/types/vue' {
  interface Vue {
    // All internal render helpers should not be checked except _c
    _o: Function
    _n: Function
    _s: Function
    _l: Function
    _t: Function
    _q: Function
    _i: Function
    _m: Function
    _f: Function
    _k: Function
    _b: Function
    _v: Function
    _e: Function
    _u: Function
    _self: this

    // Allow reserved tag names
    _c: {
      (name: ReservedTag, data?: any, children?: any): any
    }
  }
}
