<template>
  <div></div>
</template>

<script>
export default {
  name: 'App',
  data: () => ({
      items: [
        { text: 'DashBoard', icon: 'mdi-folder' },
        { text: 'Cases', icon: 'mdi-account-multiple' },
        { text: 'Agents', icon: 'mdi-star' },
        { text: 'Add Agent', icon: 'mdi-star' },
        { text: 'about', icon: 'mdi-history' },
      ],
    }),
  methods: {
    handleClick() {
      alert('Button clicked!');
    },
  },
};
</script>

