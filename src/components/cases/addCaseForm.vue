<template>
  <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">  

    <h1 class="mb-3 mt-5">{{ isEditMode ? 'Edit case' : 'Add New case' }}</h1>
    <v-form ref="form" @submit.prevent="submitForm">
      <v-text-field
        v-model="gcCase.name"
        label="Case Name"
        :rules="[v => !!v || 'Name is required']"
        required
      />

      <v-text-field
        v-model="gcCase.contactInfo.contactName"
        label="Contact Name"
      />

      <v-text-field
        v-model="gcCase.contactInfo.contactTitle"
        label="Contact Title"
      />

      <v-text-field
        v-model="gcCase.contactInfo.email"
        label="Email"
        :rules="[v => !v || /.+@.+\..+/.test(v) || 'Invalid email']"
      />

      <v-btn type="submit" color="primary">
        {{ isEditMode ? 'Save changes' : 'Add Case' }}
      </v-btn>
      <span class="ml-3" v-if="saveMessage">{{ saveMessage }}</span>
    </v-form>
  </div>  
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from "axios";
import urls from '../../js/config.js';
import { useRoute } from 'vue-router';

const route = useRoute();

const gcCase = ref({
  name: '',
  contactInfo: {
    contactName: '',
    contactTitle: '',
    email: ''
  }
});

const saveMessage = ref('');

const currentCaseId = computed(() => route.query.caseId || null);
const isEditMode = computed(() => !!currentCaseId.value);

const loadCase = async () => {
  if (!currentCaseId.value) return;
  try {
    const response = await axios.get(`${urls.backEndURL}/gcCases/${currentCaseId.value}`);
    const data = response.data || {};
    gcCase.value = {
      name: data.name || '',
      contactInfo: {
        contactName: data.contactInfo?.contactName || '',
        contactTitle: data.contactInfo?.contactTitle || '',
        email: data.contactInfo?.email || ''
      }
    };
  } catch (err) {
    console.error('Failed to load case for editing:', err);
  }
};

const submitForm = async () => {
  try {
    if (isEditMode.value && currentCaseId.value) {
      // Update existing case
      const response = await axios.put(`${urls.backEndURL}/gcCases/${currentCaseId.value}`, {
        name: gcCase.value.name,
        contactInfo: gcCase.value.contactInfo
      });
      console.log('Case updated:', response.data);
      saveMessage.value = 'Case updated successfully.';
    } else {
      // Create new case
      const response = await axios.post(`${urls.backEndURL}/gcCases/`, {
        name: gcCase.value.name,
        contactInfo: gcCase.value.contactInfo
      });
      console.log('Case added:', response.data);
      gcCase.value = {
        name: '',
        contactInfo: {
          contactName: '',
          contactTitle: '',
          email: ''
        }
      };
      saveMessage.value = 'Case added successfully.';
    }
    // Clear message after a short delay
    setTimeout(() => {
      saveMessage.value = '';
    }, 3000);
  } catch (err) {
    console.error('Failed to save case.', err);
  }
};

onMounted(loadCase);
</script>

<style scoped>
  .v-form {
  width: 400px;
  max-width: 100%;
  margin: 0 auto;
}
.v-btn {
  margin-top: 20px;
}
.v-alert {
  margin-top: 20px;
  max-height: 4em;
}
.button-alert-container {
  display: flex;
  align-items: center; /* Align items vertically */
  margin-top: 20px;    /* Add spacing from inputs */
}
.ml-3 {
  margin-left: 12px; /* Space between button and alert */
}
</style>