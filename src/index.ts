import { compile } from './compiler'
import { VueFile } from './vue/vue-file'

export function transform (content: string, fileName: string): string {
  const vueFile = new VueFile(fileName, content)
  return compile(vueFile).toString()
}
