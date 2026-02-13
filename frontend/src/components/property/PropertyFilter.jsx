import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button.jsx';
import { Search, ChevronDown, X, SlidersHorizontal } from 'lucide-react';

const PropertyFilter = ({ onFilter }) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    area: '',
    district: '',
    status: 'all',
    minPrice: '',
    maxPrice: '',
  });
  const [isOpen, setIsOpen] = useState(false); // For mobile collapsible

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
    setIsOpen(false); // Close on mobile after apply
  };

  const handleClear = () => {
    const cleared = { area: '', district: '', status: 'all', minPrice: '', maxPrice: '' };
    setFilters(cleared);
    onFilter(cleared);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile toggle button - only visible on small screens */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-dark transition-all"
      >
        <SlidersHorizontal className="w-6 h-6" />
      </button>

      {/* Filter Panel */}
      <div
        className={`
          bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden
          ${isOpen ? 'fixed inset-0 z-40 md:static md:inset-auto' : 'hidden md:block'}
        `}
      >
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-5 border-b">
          <h3 className="text-xl font-heading font-bold text-gray-900">{t('Filters')}</h3>
          <button onClick={() => setIsOpen(false)}>
            <X className="w-7 h-7 text-gray-600" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Area */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('Area')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="area"
                  placeholder={t('e.g., Thabong')}
                  value={filters.area}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
            </div>

            {/* District */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('District')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="district"
                  placeholder={t('e.g., Mokhotlong')}
                  value={filters.district}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('Status')}
              </label>
              <div className="relative">
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white appearance-none text-gray-900"
                >
                  <option value="all">{t('All Statuses')}</option>
                  <option value="vacant">{t('Vacant')}</option>
                  <option value="occupied">{t('Occupied')}</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Min Price')} (M)
                </label>
                <input
                  type="number"
                  name="minPrice"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Max Price')} (M)
                </label>
                <input
                  type="number"
                  name="maxPrice"
                  placeholder="10000+"
                  value={filters.maxPrice}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="flex-1 py-4 text-lg bg-primary hover:bg-primary-dark transition-all"
              >
                {t('Apply Filters')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleClear}
                className="flex-1 py-4 text-lg border-gray-300 hover:bg-gray-50 transition-all"
              >
                {t('Clear All')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default PropertyFilter;