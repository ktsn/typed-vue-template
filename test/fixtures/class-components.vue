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