import * as vueCompiler from 'vue-template-compiler'

export interface Attribute {
  name: string
  value: string | boolean
}

export interface SFCBlock {
  type: string
  content: string
  lang?: string
  scoped?: boolean
  module?: string | boolean
  src?: string
}

export interface SFCCustomBlock {
  type: string
  content: string
  src?: string
  attrs: {
    [key: string]: string
  }
}

interface NormalizedBlock {
  type: string
  content: string
  attrs: Attribute[]
}

export class VueFile {
  template: SFCBlock | null
  script: SFCBlock | null
  styles: SFCBlock[]
  customBlocks: SFCCustomBlock[]

  constructor (public fileName: string, src: string) {
    const { template, script, styles, customBlocks } = vueCompiler.parseComponent(src)

    this.template = template || null
    this.script = script || null
    this.styles = styles
    this.customBlocks = customBlocks
  }

  hasTsScript (): boolean {
    return this.script !== null && this.script.lang === 'ts'
  }

  toString (): string {
    const blocks = [] as NormalizedBlock[]

    if (this.template) {
      blocks.push(normalize(this.template))
    }

    if (this.script) {
      blocks.push(normalize(this.script))
    }

    this.styles.concat(this.customBlocks)
      .map(normalize)
      .forEach(block => blocks.push(block))

    return blocks.map(toSource).join('\n')
  }
}

function normalize (block: SFCBlock | SFCCustomBlock): NormalizedBlock {
  const res = {
    type: block.type,
    content: block.content,
    attrs: [] as Attribute[]
  }

  if (isCustomBlock(block)) {
    Object.keys(block.attrs).forEach(name => {
      res.attrs.push({ name, value: block.attrs[name] })
    })
  } else {
    ['lang', 'scoped', 'module', 'src'].forEach(name => {
      if ((block as any)[name]) {
        res.attrs.push({ name, value: (block as any)[name] })
      }
    })
  }

  return res
}

function toSource (block: NormalizedBlock): string {
  const attrs = block.attrs
    .map(attr => {
      if (typeof attr.value === 'boolean') {
        return attr.value ? attr.name : null
      }
      return `${attr.name}="${attr.value}"`
    })
    .filter(x => x !== null)
    .join(' ')

  let buf = `<${block.type}`
  if (attrs !== '') {
    buf += ` ${attrs}`
  }
  buf += '>'
  buf += block.content
  buf += `</${block.type}>`

  return buf
}

function isCustomBlock (block: SFCBlock | SFCCustomBlock): block is SFCCustomBlock {
  return 'attrs' in block
}
