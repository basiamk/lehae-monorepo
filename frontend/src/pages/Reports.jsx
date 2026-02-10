import React from 'react';
import { useTranslation } from 'react-i18next';

const Reports = () => {
  const { t } = useTranslation();
  return <div className="container mx-auto px-4 py-8"><h1 className="text-3xl font-bold">{t('Reports')}</h1><p>{t('Coming soon')}</p></div>;
};

export default Reports;