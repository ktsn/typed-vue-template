import * as assert from 'power-assert'
import { VueFile } from '../src/vue/vue-file'
import { compile } from '../src/compiler'

describe('Compiler', () => {
  it('compiles template and inject it into script', () => {
    const v = new VueFile('test.ts', `
    <template>
      <p>Hi</p>
    </template>
    <script lang="ts">
    import Vue from 'vue'
    import Component from 'vue-class-component'
    export default class MyComp extends Vue {}
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
      '  render () { var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c(\'p\',[_vm._v("Hi")]) }',
      '}',
      '',
      'inject(MyComp, []);'
    ].join('\n'))
  })
})
