/**
 * Compile .vue file to a new .vue file
 * that its template is compiled to render function
 * and it is injected to compiler code.
 *
 * The script part also has a type declaration of `vm._c`,
 * so that the compiler can type check component props.
 */

import * as assert from 'assert'
import * as ts from 'typescript'
import * as transpile from 'vue-template-es2015-compiler'
import * as vueCompiler from 'vue-template-compiler'
import { VueFile } from './vue/vue-file'

export function compile (vueFile: VueFile): VueFile {
  if (!vueFile.hasTsScript()) return vueFile

  if (!vueFile.template) return vueFile

  const { render, staticRenderFns, errors } = vueCompiler.compile(vueFile.template.content)
  if (errors.length > 0) {
    errors.forEach(error => {
      console.log(error)
    })
    return vueFile
  }

  const sourceFile = ts.createSourceFile(
    vueFile.fileName,
    vueFile.script!.content,
    ts.ScriptTarget.ES2017
  )

  ts.forEachChild(sourceFile, visit)

  return vueFile

  function visitClass (node: ts.ClassDeclaration): void {
    let isExport = false
    let isDefault = false

    if (node.modifiers) {
      node.modifiers.forEach(m => {
        switch (m.kind) {
          case ts.SyntaxKind.ExportKeyword:
            isExport = true
            break
          case ts.SyntaxKind.DefaultKeyword:
            isDefault = true
            break
          default:
        }
      })
    }

    if (isExport && isDefault) {
      injectRender(node)
    }
  }

  function visit (node: ts.Node): void {
    switch (node.kind) {
      case ts.SyntaxKind.ClassDeclaration:
        visitClass(node as ts.ClassDeclaration)
        break
      default:
        ts.forEachChild(node, visit)
    }
  }

  function injectRender (node: ts.ClassDeclaration): void {
    assert(node.name, 'Component class must be named')

    const className = node.name!.text

    // Import runtime module
    const importCode = 'import { inject } from "typed-vue-template/lib/vue/runtime";'

    // Inject staticRenderFns
    const staticFnsCode = `inject(${className}, `
      + transpile('[' + staticRenderFns.map(toFunction).join(',') + ']')
      + ');'

    // Inject render function
    const injectedCode = replace(
      node,
      node.getFullText(sourceFile).replace(/\}\s*$/, '\n' + [
        '  render () { ' + transpileWithWrap(render) + ' }',
        '}'
      ].join('\n'))
    ).text

    vueFile.template = null
    vueFile.script!.content = [
      importCode,
      injectedCode,
      staticFnsCode
    ].join('\n')
  }

  function replace (node: ts.Node, text: string): ts.SourceFile {
    const start = node.getFullStart()
    const end = node.getEnd()

    const oldText = sourceFile.text
    const newText = oldText.slice(0, start)
      + text
      + oldText.slice(end)

    return sourceFile.update(newText, {
      span: { start, length: end - start },
      newLength: text.length
    })
  }
}

function toFunction (code: string): string {
  return `function(){${code}}`
}

function transpileWithWrap (code: string): string {
  const pre = '(function(){'
  const post = '})()'
  return transpile(pre + code + post)
    .slice(pre.length)
    .slice(0, -post.length)
}
