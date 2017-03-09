declare module 'vue-template-compiler' {
  interface CompilerOptions {

  }

  interface CompileResult {
    render: string
    staticRenderFns: Array<string>
    errors: Array<string>
  }

  interface SFCParserOptions {
    pad?: boolean
  }

  interface SFCBlock {
    type: string
    content: string
    start?: number
    end?: number
    lang?: string
    src?: string
    scoped?: boolean
    module?: string | boolean
  }

  interface SFCCustomBlock {
    type: string
    content: string
    start?: number
    end?: number
    src?: string
    attrs: {
      [key: string]: string
    }
  }

  interface SFCDescriptor {
    template: SFCBlock | null | undefined
    script: SFCBlock | null | undefined
    styles: SFCBlock[]
    customBlocks: SFCCustomBlock[]
  }

  interface TemplateCompiler {
    compile (template: string, options?: CompilerOptions): CompileResult
    parseComponent (file: string, options?: SFCParserOptions): SFCDescriptor
  }

  const compiler: TemplateCompiler
  export = compiler
}
