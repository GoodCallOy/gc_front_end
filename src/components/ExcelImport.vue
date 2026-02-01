<template>
  <v-container>
    <v-card class="pa-6" elevation="2">
      <v-card-title class="text-h5 mb-4">Import Data from Excel</v-card-title>
      
      <v-card-text>
        <v-file-input
          v-model="selectedFile"
          label="Select Excel File (.xlsx)"
          accept=".xlsx,.xls"
          prepend-icon="mdi-file-excel"
          :disabled="isUploading"
          show-size
          @update:model-value="onFileSelected"
        ></v-file-input>

        <v-alert
          v-if="message"
          :type="alertType"
          class="mt-4"
          dismissible
          @click:close="message = ''"
        >
          {{ message }}
        </v-alert>

        <!-- Preview Table -->
        <div v-if="previewData.length > 0" class="mt-6">
          <h3 class="text-h6 mb-3">Preview (first 10 rows)</h3>
          <v-data-table
            :headers="previewHeaders"
            :items="previewData"
            :items-per-page="10"
            class="elevation-1 excel-preview-table"
            max-height="600"
            density="compact"
          ></v-data-table>
          
          <div class="mt-4">
            <p><strong>Total rows to import:</strong> {{ totalRows }}</p>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-btn
          color="primary"
          :disabled="!selectedFile || previewData.length === 0 || isUploading"
          :loading="isUploading"
          @click="uploadData"
        >
          <v-icon left>mdi-upload</v-icon>
          Import to Database
        </v-btn>
        <v-btn
          color="secondary"
          :disabled="isUploading"
          @click="clearData"
        >
          Clear
        </v-btn>
      </v-card-actions>

      <!-- Progress -->
      <v-progress-linear
        v-if="isUploading"
        :value="uploadProgress"
        color="primary"
        class="mt-4"
      ></v-progress-linear>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import axios from 'axios'
import urls from '@/js/config.js'

const selectedFile = ref(null)
const previewData = ref([])
const totalRows = ref(0)
const isUploading = ref(false)
const uploadProgress = ref(0)
const message = ref('')
const alertType = ref('info')

// Finnish to English header mapping
const headerMapping = {
  'Puhelinnumero': 'PhoneNumber',
  'Y-tunnus': 'BusinessID',
  'Yritys': 'Company',
  'Etunimi': 'FirstName',
  'Sukunimi': 'LastName',
  'Osoite': 'Address',
  'Kaupunki': 'City',
  'Sähköposti': 'Email',
  'Verkkosivut': 'Website',
  'Käytetty': 'Used',
  'Tulos': 'Result',
  'Tuloksen päiväys': 'ResultDate',
  'Kommentit': 'Comments',
  'Titteli': 'Title',
  'Toimiala': 'Industry',
  'Henkilökuntaluokka': 'StaffClass',
  'Liikevaihtoluokka': 'RevenueClass',
  'Postinumero': 'PostalCode',
  'Matkapuhelinnumero': 'MobileNumber',
  'Tuonti/viesti': 'ImportMessage',
  'Yrityksen kieli': 'CompanyLanguage'
}

const previewHeaders = computed(() => {
  if (previewData.value.length === 0) return []
  
  // Show only first 6 columns to prevent wrapping
  return Object.keys(previewData.value[0])
    .slice(0, 6)
    .map(key => ({
      title: key,
      key: key,
      sortable: true
    }))
})

function onFileSelected(file) {
  if (!file) {
    clearData()
    return
  }

  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      
      // Get first sheet
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null })
      
      if (jsonData.length === 0) {
        message.value = 'Excel file is empty or has no data rows'
        alertType.value = 'warning'
        return
      }

      // Transform data: map Finnish headers to English
      const transformedData = jsonData.map(row => {
        const newRow = {}
        
        // Map each Finnish header to English
        Object.keys(headerMapping).forEach(finnishHeader => {
          const englishHeader = headerMapping[finnishHeader]
          // Handle case-insensitive matching and variations
          const originalKey = Object.keys(row).find(
            key => key.trim() === finnishHeader.trim()
          )
          
          if (originalKey !== undefined) {
            newRow[englishHeader] = row[originalKey]
          }
        })
        
        // Also preserve any unmapped columns (in case there are extras)
        Object.keys(row).forEach(key => {
          if (!Object.keys(headerMapping).includes(key.trim())) {
            // Keep unmapped columns as-is
            newRow[key] = row[key]
          }
        })
        
        return newRow
      })

      totalRows.value = transformedData.length
      previewData.value = transformedData.slice(0, 10) // Show first 10 rows
      
      message.value = `Successfully loaded ${transformedData.length} rows from Excel file`
      alertType.value = 'success'
      
      // Store full data for upload
      fullData.value = transformedData
      
    } catch (error) {
      console.error('Error reading Excel file:', error)
      message.value = `Error reading Excel file: ${error.message}`
      alertType.value = 'error'
      previewData.value = []
      totalRows.value = 0
    }
  }
  
  reader.onerror = () => {
    message.value = 'Error reading file'
    alertType.value = 'error'
  }
  
  reader.readAsArrayBuffer(file)
}

const fullData = ref([])

async function uploadData() {
  if (fullData.value.length === 0) {
    message.value = 'No data to upload'
    alertType.value = 'warning'
    return
  }

  isUploading.value = true
  uploadProgress.value = 0
  message.value = ''

  try {
    // Send data to backend in batches to avoid overwhelming the server
    const batchSize = 100
    const batches = []
    
    for (let i = 0; i < fullData.value.length; i += batchSize) {
      batches.push(fullData.value.slice(i, i + batchSize))
    }

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      
      try {
        const response = await axios.post(
          `${urls.backEndURL}/openSys/import`,
          { data: batch },
          { withCredentials: true }
        )
        
        successCount += batch.length
        uploadProgress.value = ((i + 1) / batches.length) * 100
        
        // Update message during upload
        message.value = `Uploading... ${successCount}/${fullData.value.length} rows processed`
        alertType.value = 'info'
        
      } catch (error) {
        console.error(`Error uploading batch ${i + 1}:`, error)
        errorCount += batch.length
        
        // Continue with next batch even if one fails
        if (error.response?.data?.message) {
          message.value = `Error in batch ${i + 1}: ${error.response.data.message}`
        } else {
          message.value = `Error uploading batch ${i + 1}`
        }
        alertType.value = 'error'
      }
    }

    // Final message
    if (errorCount === 0) {
      message.value = `Successfully imported ${successCount} rows to database!`
      alertType.value = 'success'
    } else {
      message.value = `Import completed: ${successCount} successful, ${errorCount} failed`
      alertType.value = errorCount > successCount ? 'error' : 'warning'
    }

    // Clear preview after successful upload
    if (errorCount === 0) {
      setTimeout(() => {
        clearData()
      }, 3000)
    }

  } catch (error) {
    console.error('Error uploading data:', error)
    message.value = `Upload failed: ${error.response?.data?.message || error.message}`
    alertType.value = 'error'
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

function clearData() {
  selectedFile.value = null
  previewData.value = []
  fullData.value = []
  totalRows.value = 0
  message.value = ''
  uploadProgress.value = 0
}
</script>

<style scoped>
.v-card {
  max-width: 1200px;
  margin: 0 auto;
}

/* Fixed row height for preview table */
.excel-preview-table :deep(.v-data-table__tbody tr) {
  height: 50px !important;
  max-height: 50px !important;
}

.excel-preview-table :deep(.v-data-table__tbody td) {
  height: 50px !important;
  max-height: 50px !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 8px 16px !important;
  vertical-align: middle;
}

.excel-preview-table :deep(.v-data-table__tbody td .v-data-table__td-content) {
  max-height: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}
</style>

