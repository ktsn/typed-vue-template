import * as assert from 'power-assert'
import { VueFile } from '../src/vue/vue-file'
import { compile } from '../src/compiler'

describe('Compiler', () => {
  it('compiles template and inject it into script', () => {
    const v = new VueFile('test.ts', `
    <template>
      <div>
        <p>{{ message }}</p>
        <div>
          <p>This is static</p>
        </div>
      </div>
    </template>
    <script lang="ts">
    import Vue from 'vue'
    import Component from 'vue-class-component'
    export default class MyComp extends Vue {
      message = 'Hi'
    }
    </script>
    `)

    const res = compile(v)

    assert(res.template === null)
    assert.equal(res.script!.content, [
      'import { inject } from "typed-vue-template/lib/vue/runtime";',
      '',
      'import Vue from \'vue\'',
      'import Component from \'vue-class-component\'',
      'export default class MyComp extends Vue {',
      '  message = \'Hi\'',
      '  render () { var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c(\'div\',[_c(\'p\',[_vm._v(_vm._s(_vm.message))]),_vm._v(" "),_vm._m(0)]) }',
      '}',
      '',
      'inject(MyComp, [function(this: any){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c(\'div\',[_c(\'p\',[_vm._v("This is static")])])}]);'
    ].join('\n'))
  })
})
