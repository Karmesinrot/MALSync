<template>
  <div class="inputButton">

    <div class="group">
      <input v-model="inputString" :type="type" required>
      <span class="bar"></span>
      <label>{{label}}</label>
    </div>

    <button v-if="inputString !== state" @click="click">Update</button>
  </div>
</template>

<script type="text/javascript">
  export default {
    data: function(){
      return {
        inputString: ''
      }
    },
    props: {
      state: {
        type: String|Number,
        default: ''
      },
      type: {
        type: String,
        default: ''
      },
      label: {
        type: String,
        default: ''
      },
    },
    mounted: function(){
      this.inputString = this.state;
    },
    watch: {
      state: function(type){
        this.inputString = this.state;
      },
      inputString: function(val){
        this.$emit('change', this.inputString);
      }
    },
    methods: {
      lang: api.storage.lang,
      click: function() {
        this.$emit('clicked', this.inputString);
      }
    }
  }
</script>
