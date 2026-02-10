const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    flag: '🇬🇧'
  },
  st: {
    code: 'st',
    name: 'Sesotho',
    flag: '🇱🇸'
  }
};

const TRANSLATIONS = {
  en: {
    // Common
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Try Again',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    clear: 'Clear',
    submit: 'Submit',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    confirm: 'Confirm',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',

    // Auth
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember Me',
    username: 'Username',
    isLandlord: 'I am a Landlord',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: 'Don\'t have an account?',

    // Property
    properties: 'Properties',
    property: 'Property',
    addProperty: 'Add Property',
    editProperty: 'Edit Property',
    deleteProperty: 'Delete Property',
    propertyDetails: 'Property Details',
    area: 'Area',
    district: 'District',
    rentalAmount: 'Rental Amount',
    status: 'Status',
    description: 'Description',
    image: 'Image',
    vacant: 'Vacant',
    occupied: 'Occupied',
    favorite: 'Favorite',
    unfavorite: 'Unfavorite',
    contactOwner: 'Contact Owner',
    viewDetails: 'View Details',
    noProperties: 'No properties found',
    propertyAdded: 'Property added successfully',
    propertyUpdated: 'Property updated successfully',
    propertyDeleted: 'Property deleted successfully',
    confirmDelete: 'Are you sure you want to delete this property?',

    // Filters
    filterByStatus: 'Filter by Status',
    filterByDistrict: 'Filter by District',
    filterByPrice: 'Filter by Price',
    sortBy: 'Sort By',
    newest: 'Newest First',
    oldest: 'Oldest First',
    priceAsc: 'Price: Low to High',
    priceDesc: 'Price: High to Low',
    nameAsc: 'Name: A to Z',
    nameDesc: 'Name: Z to A',

    // Contact
    contactForm: 'Contact Form',
    name: 'Name',
    message: 'Message',
    send: 'Send',
    messageSent: 'Message sent successfully',
    messageError: 'Failed to send message',

    // Dashboard
    dashboard: 'Dashboard',
    myProperties: 'My Properties',
    messages: 'Messages',
    statistics: 'Statistics',
    totalProperties: 'Total Properties',
    vacantProperties: 'Vacant Properties',
    occupiedProperties: 'Occupied Properties',
    recentMessages: 'Recent Messages',
    noMessages: 'No messages yet',
    markAsRead: 'Mark as Read',
    markAsUnread: 'Mark as Unread',
    deleteMessage: 'Delete Message',
    confirmDeleteMessage: 'Are you sure you want to delete this message?'
  },
  st: {
    // Common
    loading: 'E ntse e tsoela pele...',
    error: 'Ho hlahetse phoso',
    retry: 'Le ka leka hape',
    save: 'Boloka',
    cancel: 'Hlakola',
    delete: 'Hlakola',
    edit: 'Fetola',
    view: 'Bona',
    search: 'Batla',
    filter: 'Sefa',
    sort: 'Hlophisa',
    clear: 'Hlakola',
    submit: 'Romela',
    back: 'Morao',
    next: 'E tlang',
    previous: 'E fetileng',
    confirm: 'Netefatsa',
    success: 'Katleho',
    warning: 'Tlhokahisiso',
    info: 'Tsebo',

    // Auth
    login: 'Kena',
    register: 'Ngolisa',
    logout: 'Tsoa',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Netefatsa Password',
    forgotPassword: 'U lebetse Password?',
    rememberMe: 'Nkhopole',
    username: 'Lebitso la Mosebedisi',
    isLandlord: 'Ke Mong\'a Ntlo',
    alreadyHaveAccount: 'U se u na le akhaonto?',
    dontHaveAccount: 'Ha u na akhaonto?',

    // Property
    properties: 'Matlo',
    property: 'Ntlo',
    addProperty: 'Kenya Ntlo',
    editProperty: 'Fetola Ntlo',
    deleteProperty: 'Hlakola Ntlo',
    propertyDetails: 'Lintlha tsa Ntlo',
    area: 'Sebaka',
    district: 'Setereke',
    rentalAmount: 'Tefo ea Khoeli le Khoeli',
    status: 'Boemo',
    description: 'Tlhaloso',
    image: 'Setšoantšo',
    vacant: 'E sa lulwang',
    occupied: 'E lulwang',
    favorite: 'Boloka',
    unfavorite: 'Hlakola',
    contactOwner: 'Bua le Mong\'a Ntlo',
    viewDetails: 'Bona Lintlha',
    noProperties: 'Ha ho matlo a fumanoeng',
    propertyAdded: 'Ntlo e kentsoe ka katleho',
    propertyUpdated: 'Ntlo e ntlafalitsoe ka katleho',
    propertyDeleted: 'Ntlo e hlakotsoe ka katleho',
    confirmDelete: 'U na le bonnete ba hore u batla ho hlakola ntlo ena?',

    // Filters
    filterByStatus: 'Sefa ka Boemo',
    filterByDistrict: 'Sefa ka Setereke',
    filterByPrice: 'Sefa ka Tefo',
    sortBy: 'Hlophisa ka',
    newest: 'E ncha pele',
    oldest: 'E khale pele',
    priceAsc: 'Tefo: Tlase ho hodimo',
    priceDesc: 'Tefo: Hodimo ho tlase',
    nameAsc: 'Lebitso: A ho Z',
    nameDesc: 'Lebitso: Z ho A',

    // Contact
    contactForm: 'Foromo ea Puisano',
    name: 'Lebitso',
    message: 'Molaetsa',
    send: 'Romela',
    messageSent: 'Molaetsa o rometsoe ka katleho',
    messageError: 'Ho hlolehile ho romela molaetsa',

    // Dashboard
    dashboard: 'Dashboard',
    myProperties: 'Matlo a Ka',
    messages: 'Melaetsa',
    statistics: 'Lipalo',
    totalProperties: 'Kakaretso ea Matlo',
    vacantProperties: 'Matlo a sa Lulwang',
    occupiedProperties: 'Matlo a Lulwang',
    recentMessages: 'Melaetsa e Masha',
    noMessages: 'Ha ho na melaetsa',
    markAsRead: 'Maka e le e Balehileng',
    markAsUnread: 'Maka e le e sa Balehileng',
    deleteMessage: 'Hlakola Molaetsa',
    confirmDeleteMessage: 'U na le bonnete ba hore u batla ho hlakola molaetsa ona?'
  }
};

export const getLanguage = () => {
  const savedLang = localStorage.getItem('language');
  return LANGUAGES[savedLang] ? savedLang : 'en';
};

export const setLanguage = (lang) => {
  if (LANGUAGES[lang]) {
    localStorage.setItem('language', lang);
    window.location.reload();
  }
};

export const t = (key) => {
  const lang = getLanguage();
  const translations = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return translations[key] || TRANSLATIONS.en[key] || key;
};

export const getAvailableLanguages = () => {
  return Object.values(LANGUAGES);
};

export const getCurrentLanguage = () => {
  const lang = getLanguage();
  return LANGUAGES[lang] || LANGUAGES.en;
};