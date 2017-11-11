<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
export default class MyComp extends Vue {
  message = 'Hi'
}

import { inject } from "typed-vue-template/lib/vue/runtime";
inject(
  MyComp,
  function(this:MyComp){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('p',[_vm._v(_vm._s(_vm.message))]),_vm._v(" "),_vm._m(0)])},
  [function(this:MyComp){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('p',[_vm._v("This is static")])])}]
);</script>