import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import fi from './locales/fi.json';

const i18n = createI18n({
  locale: 'en', // Default language
  messages: {
    en,
    fi
  }
});

export default i18n;
