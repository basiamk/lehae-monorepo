import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button.jsx';
import { Search, ChevronDown } from 'lucide-react';

const PropertyFilter = ({ onFilter }) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    area: '',
    district: '',
    status: 'all',
    minPrice: '',
    maxPrice: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Applying filters:', filters);
    onFilter(filters);
  };

  const handleClear = () => {
    const clearedFilters = {
      area: '',
      district: '',
      status: 'all',
      minPrice: '',
      maxPrice: '',
    };
    setFilters(clearedFilters);
    onFilter(clearedFilters);
  };

  return (
    <div className="bg-white rounded-2xl shadow-neumorphic p-6">
      <h3 className="text-xl font-heading font-bold text-gray-800 mb-4">{t('Filter Properties')}</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <input
            type="text"
            name="area"
            placeholder={t('Area (e.g., Thabong)')}
            value={filters.area}
            onChange={handleChange}
            className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
        </div>
        <div className="relative">
          <input
            type="text"
            name="district"
            placeholder={t('District (e.g., Mokhotlong)')}
            value={filters.district}
            onChange={handleChange}
            className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
        </div>
        <div className="relative">
          <select
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all">{t('All Statuses')}</option>
            <option value="occupied">{t('Occupied')}</option>
            <option value="vacant">{t('Vacant')}</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
        </div>
        <div className="relative">
          <input
            type="number"
            name="minPrice"
            placeholder={t('Min Price')}
            value={filters.minPrice}
            onChange={handleChange}
            className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <input
            type="number"
            name="maxPrice"
            placeholder={t('Max Price')}
            value={filters.maxPrice}
            onChange={handleChange}
            className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex space-x-4">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="w-full bg-blue-500 text-white hover:bg-red-500 hover:text-gray-800"
          >
            {t('Apply Filters')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClear}
            className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            {t('Clear Filters')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PropertyFilter;