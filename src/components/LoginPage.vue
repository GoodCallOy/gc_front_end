<template>
  <div class="login-container">
    <v-card
    :class="['mx-2 my-2', 'cardStyle']"
    :elevation="16"
    >
      <div class="title-box"></div>

      <div class="login-button">
        <GoogleLoginButton />
      </div>
    </v-card>  
  </div>
 
</template>
  
  <script setup>
  import GoogleLoginButton from "@/components/googleLoginButton.vue";
  </script>
  
  <style scoped>
  .login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 85vh;
  }

  .login-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 30vh;
    width: 60%;
  }
  .cardStyle {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 50vh;
    width: 35%;
    padding: 20px;
    text-align: center;
  }
  .title-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
    width: 100%;
    background-image: url("@/assets/Back_v1.jpg");
    background-size: cover;
   
  }
  .full-width-card {
  width: 70%;
  margin: 0;
  padding: 20px;
  text-align: center;
}
  </style>
  