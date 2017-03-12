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
    assert.equal(res.script!.content.trim(), [
      'import Vue from \'vue\'',
      'import Component from \'vue-class-component\'',
      'export default class MyComp extends Vue {',
      '  message = \'Hi\'',
      '}',
      '',
      'import { inject } from "typed-vue-template/lib/vue/runtime";',
      'inject(',
      '  MyComp,',
      '  function(this:MyComp){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c(\'div\',[_c(\'p\',[_vm._v(_vm._s(_vm.message))]),_vm._v(" "),_vm._m(0)])},',
      '  [function(this:MyComp){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c(\'div\',[_c(\'p\',[_vm._v("This is static")])])}]',
      ');'
    ].join('\n'))
  })

  it('adds declaration of component props', () => {
    const v = new VueFile('test.ts', `
    <script lang="ts">
    import Vue from 'vue'
    import Component from 'vue-class-component'
    import ChildComp from './ChildComp'

    @Component({
      components: {
        ChildComp,
        AnotherComp: {
          components: {
            FooBar: 'should not be collected'
          }
        }
      }
    })
    export default class MyComp extends Vue {}
    </script>
    `)

    const res = compile(v)

    assert.equal(res.script!.content.trim(), [
      'import { ReservedTag } from "typed-vue-template/lib/vue/runtime";',
      '',
      'import Vue from \'vue\'',
      'import Component from \'vue-class-component\'',
      'import ChildComp from \'./ChildComp\'',
      '',
      '@Component({',
      '  components: {',
      '    ChildComp,',
      '    AnotherComp: {',
      '      components: {',
      '        FooBar: \'should not be collected\'',
      '      }',
      '    }',
      '  }',
      '})',
      'export default class MyComp extends Vue {',
      '_c: {',
      '(name: "child-comp", data?: any, children?: any): any',
      '(name: "another-comp", data?: any, children?: any): any',
      '(name: ReservedTag, data?: any, children?: any): any',
      '}',
      '}'
    ].join('\n'))
  })
})
