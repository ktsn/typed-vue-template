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

  let sourceFile = ts.createSourceFile(
    vueFile.fileName,
    vueFile.script!.content,
    ts.ScriptTarget.ES2017
  )

  ts.forEachChild(sourceFile, visit)

  return vueFile

  function visitClass (node: ts.ClassDeclaration): void {
    if (!isDefaultExport(node)) return

    assert(node.name, 'Component class must be named')

    const className = node.name!.text
    injectRender(className)

    const children = getChildrenNames(sourceFile, node)
    if (children) {
      injectDeclaration(node, className, children)
    }
  }

  function visitAssignment (node: ts.ExportAssignment): void {
    const optionsNode = getOptionsNode(node.expression)
    if (!optionsNode) return

    injectRenderToOptions(optionsNode)
  }

  function visit (node: ts.Node): void {
    switch (node.kind) {
      case ts.SyntaxKind.ClassDeclaration:
        visitClass(node as ts.ClassDeclaration)
        break
      case ts.SyntaxKind.ExportAssignment:
        visitAssignment(node as ts.ExportAssignment)
        break
      default:
        ts.forEachChild(node, visit)
    }
  }

  function injectRender (className: string): void {
    const compiled = compileTemplate(vueFile)
    if (!compiled) return

    // Import runtime module
    const importCode = 'import { inject } from "typed-vue-template/lib/vue/runtime";'

    // Inject render functions
    const renderCode = toFunction(transpileWithWrap(compiled.render), className)
    const staticRenderCode = compiled.staticRenderFns
      .map(transpileWithWrap)
      .map(f => toFunction(f, className))
      .join(',')
    const injectCode = [
      'inject(',
      `  ${className},`,
      `  ${renderCode},`,
      `  [${staticRenderCode}]`,
      ');'
    ].join('\n')

    vueFile.template = null
    vueFile.script!.content = [
      vueFile.script!.content,
      importCode,
      injectCode
    ].join('\n')

    // Ensure consistent with sourceFile
    sourceFile = replace(sourceFile, vueFile.script!.content)
  }

  function injectRenderToOptions(node: ts.ObjectLiteralExpression): void {
    const compiled = compileTemplate(vueFile)
    if (!compiled) return

    const renderCode = toFunction(transpileWithWrap(compiled.render), undefined, 'any')
    const staticRenderCode = compiled.staticRenderFns
      .map(transpileWithWrap)
      .map(f => toFunction(f, undefined, 'any'))
      .join(',')

    const pos = node.pos + 1
    sourceFile = insert(pos, `staticRenderFns:[${staticRenderCode}],`)
    sourceFile = insert(pos, `render:${renderCode},`)

    vueFile.template = null
    vueFile.script!.content = sourceFile.getFullText()
  }

  function injectDeclaration (node: ts.ClassDeclaration, className: string, components: string[]) {
    const importCode = 'import { ReservedTag } from "typed-vue-template/lib/vue/runtime";'

    const methods = components.map(c => {
      return `(name: "${hyphenate(c)}", data?: any, children?: any): any`
    })

    const declaration = [
      '_c: {',
      methods.join('\n'),
      '(name: ReservedTag, data?: any, children?: any): any',
      '}'
    ].join('\n')

    const injectedCode = node.getFullText(sourceFile)
      .replace(/(\}\s*)$/, '\n' + declaration + '\n$1')

    sourceFile = replace(node, injectedCode)
    sourceFile = replace(sourceFile, [
      importCode,
      sourceFile.getFullText()
    ].join('\n'))

    vueFile.script!.content = sourceFile.getFullText()
  }

  function insert (pos: number, text: string): ts.SourceFile {
    const oldText = sourceFile.text
    const newText = oldText.slice(0, pos)
      + text
      + oldText.slice(pos)

    return sourceFile.update(newText, {
      span: { start: pos, length: 0 },
      newLength: text.length
    })
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

function compileTemplate (vueFile: VueFile): { render: string, staticRenderFns: string[] } | undefined {
  if (!vueFile.template) return

  const { render, staticRenderFns, errors } = vueCompiler.compile(vueFile.template.content)
  if (errors.length > 0) {
    errors.forEach(error => {
      console.error(error)
    })
    return
  }

  return { render, staticRenderFns }
}

function isDefaultExport (node: ts.Node): boolean {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.ExportDefault) !== 0
}

function getOptionsNode (node: ts.Expression): ts.ObjectLiteralExpression | undefined {
  if (node.kind !== ts.SyntaxKind.CallExpression) return

  const call = node as ts.CallExpression
  const arg = call.arguments[0]

  if (arg.kind === ts.SyntaxKind.ObjectLiteralExpression) {
    return arg as ts.ObjectLiteralExpression
  }
}

function getChildrenNames (sourceFile: ts.SourceFile, node: ts.ClassDeclaration): string[] | undefined {
  let res

  if (!node.decorators) return

  for (const decorator of node.decorators) {
    if (decorator.expression.kind !== ts.SyntaxKind.CallExpression) continue

    ts.forEachChild(decorator.expression, node => {
      if (node.kind !== ts.SyntaxKind.ObjectLiteralExpression) return

      const obj = node as ts.ObjectLiteralExpression
      for (const prop of obj.properties) {
        if (!prop.name || prop.name.getFullText(sourceFile).trim() !== 'components') continue

        ts.forEachChild(prop, node => {
          if (node.kind !== ts.SyntaxKind.ObjectLiteralExpression) return

          res = (node as ts.ObjectLiteralExpression).properties
            .filter(p => p.name)
            .map(p => {
              return p.name!.getFullText(sourceFile).trim()
            })
        })
      }
    })
  }

  return res
}

function toFunction (code: string, thisName?: string, returnType?: string): string {
  let buf = 'function('

  if (thisName) {
    buf += `this:${thisName}`
  }

  buf += ')'

  if (returnType) {
    buf += `:${returnType}`
  }

  buf += `{${code}}`

  return buf
}

function transpileWithWrap (code: string): string {
  const pre = '(function(){'
  const post = '})()'
  return transpile(pre + code + post)
    .slice(pre.length)
    .slice(0, -post.length)
}

const hyphenateRE = /([^-])([A-Z])/g
function hyphenate (str: string): string {
  return str
    .replace(hyphenateRE, '$1-$2')
    .replace(hyphenateRE, '$1-$2')
    .toLowerCase()
}
