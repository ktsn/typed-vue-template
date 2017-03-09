declare module 'vue-template-es2015-compiler' {
  function transpile (code: string, options?: any): string
  export = transpile
}
