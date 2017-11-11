import * as assert from 'power-assert'
import * as path from 'path'
import * as fs from 'fs'
import { VueFile } from '../src/vue/vue-file'
import { transform } from '../src/'

const fixtureBase = path.resolve(__dirname, './fixtures')
const expectBase = path.resolve(__dirname, './expects')

function test(filename: string): void {
  it(filename, () => {
    const source = fs.readFileSync(path.join(fixtureBase, filename), 'utf8')
    const expected = fs.readFileSync(path.join(expectBase, filename), 'utf8')
    const res = transform(source, filename)
    assert.equal(res, expected)
  })
}

describe('Compiler', () => {
  [
    'class.vue',
    'class-components.vue',
    'extend.vue'
  ].forEach(test)
})
