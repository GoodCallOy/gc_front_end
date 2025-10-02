<template>
  <v-container class="login-container" fluid>
    <v-row class="fill-height login-row" align="center" justify="center">
      <v-col cols="12" sm="10" md="12" lg="12" xl="5">
        <v-card :class="['mx-2 my-2', 'cardStyle']" :elevation="16">
          <div class="title-box"></div>
          <div class="login-button">
            <GoogleLoginButton />
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
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
    width: 100%;
  }
  .login-row {
    width: 40%;
  }

  .login-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 15vh;
    width: 60%;
  }
  .cardStyle {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: auto;
    width: 100%;
    padding: 20px;
    text-align: center;
    height: 80%;
  }
  .title-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 32vh;
    width: 100%;
    background-image: url("@/assets/Back_v1.jpg");
    background-size: cover;
   
  }
  .full-width-card {
  width: 70%;
  margin: 0;
  padding: 20px;
  text-align: center;
  background-color: #f0f0be;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .login-container {
    height: 100vh;
    width: 100%;
   
  }
  .login-row {
    width: 100%;
  }

  .cardStyle {
    width: 100%;
    height: auto;
    min-height: 320px;
    padding: 16px;
  }

  .title-box {
    height: 24vh;
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(3, 169, 244, 0.2));
    background-position: center;
    background-size: cover;
  }

  .login-button {
    width: 100%;
    height: auto;
    margin-top: 16px;
  }
}
  </style>
  