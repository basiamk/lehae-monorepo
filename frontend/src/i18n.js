import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      'Register': 'Register',
      'Username': 'Username',
      'Email': 'Email',
      'Password': 'Password',
      'Confirm Password': 'Confirm Password',
      'Register as a Landlord': 'Register as a Landlord',
      'Registering...': 'Registering...',
      'Passwords do not match': 'Passwords do not match',
      'Registration failed': 'Registration failed',
      'Filter Properties': 'Filter Properties',
      'District': 'District',
      'Area': 'Area',
      'Min Price (M)': 'Min Price (M)',
      'Max Price (M)': 'Max Price (M)',
      'Status': 'Status',
      'Apply Filters': 'Apply Filters',
      'Reset': 'Reset',
      'All Districts': 'All Districts',
      'All Status': 'All Status',
      'Vacant': 'Vacant',
      'Occupied': 'Occupied',
      'Available Properties': 'Available Properties',
      'No properties found matching your criteria': 'No properties found matching your criteria',
      'Posted': 'Posted',
      'Vacant for': 'Vacant for',
      'days': 'days',
      'Failed to load properties': 'Failed to load properties',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 