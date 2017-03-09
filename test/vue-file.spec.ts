import * as assert from 'power-assert'
import { VueFile } from '../src/vue/vue-file'

describe('VueFile', () => {
  it('parses vue sfc', () => {
    const v = new VueFile('test.ts', `
    <template>
      <p>{{ msg }}</p>
    </template>

    <script lang="ts">
    export default {
      data () {
        return { msg: 'Hello' }
      }
    }
    </script>

    <style scoped>
    p {
      color: red;
    }
    </style>

    <style module="test">
    .foo {
      color: blue;
    }
    </style>
    `)

    // template
    assert(v.template!.content.trim() === '<p>{{ msg }}</p>')

    // script
    assert(v.script!.lang === 'ts')
    assert.equal(v.script!.content.trim(), [
      'export default {',
      '  data () {',
      '    return { msg: \'Hello\' }',
      '  }',
      '}'
    ].join('\n'))

    // styles
    assert(v.styles[0].scoped === true)
    assert.equal(v.styles[0].content.trim(), [
      'p {',
      '  color: red;',
      '}'
    ].join('\n'))

    assert(v.styles[1].module === 'test')
    assert.equal(v.styles[1].content.trim(), [
      '.foo {',
      '  color: blue;',
      '}'
    ].join('\n'))
  })

  it('constructs source string', () => {
    const v = new VueFile('test.ts', `
    <template>
      <p>{{ msg }}</p>
    </template>

    <script lang="ts">
    export default {}
    </script>

    <style scoped>
    p {
      color: red;
    }
    </style>

    <custom src="/path/to/foo" foo="test" bar baz="">
    foo
    </custom>
    `)

    assert.equal(v.toString(), [
      '<template>',
      '<p>{{ msg }}</p>',
      '</template>',
      '<script lang="ts">',
      'export default {}',
      '</script>',
      '<style scoped>',
      'p {',
      '  color: red;',
      '}',
      '</style>',
      '<custom src="/path/to/foo" foo="test" bar baz>',
      'foo',
      '</custom>'
    ].join('\n'))
  })
})

