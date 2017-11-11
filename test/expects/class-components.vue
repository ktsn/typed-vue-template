<script lang="ts">import { ReservedTag } from "typed-vue-template/lib/vue/runtime";

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
export default class MyComp extends Vue {
_c: {
(name: "child-comp", data?: any, children?: any): any
(name: "another-comp", data?: any, children?: any): any
(name: ReservedTag, data?: any, children?: any): any
}
}
</script>