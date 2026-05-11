import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { BRILinkBank } from '@/types';
import { normalizeBankName } from '../utils/account';

interface SearchableBankSelectProps {
  id: string;
  label: string;
  banks: BRILinkBank[];
  value: string;
  required?: boolean;
  onChange: (bankName: string) => void;
}

export function SearchableBankSelect({
  id,
  label,
  banks,
  value,
  required = false,
  onChange,
}: Readonly<SearchableBankSelectProps>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedBankName = normalizeBankName(value);

  const bankOptions = useMemo(() => {
    const bankMap = new Map<string, BRILinkBank>();

    banks.forEach((bank) => {
      const bankName = normalizeBankName(bank.name);
      if (bankName) {
        bankMap.set(bankName, { ...bank, name: bankName });
      }
    });

    if (selectedBankName && !bankMap.has(selectedBankName)) {
      bankMap.set(selectedBankName, {
        id: `selected-${selectedBankName}`,
        name: selectedBankName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return Array.from(bankMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [banks, selectedBankName]);

  const filteredBanks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return bankOptions;
    return bankOptions.filter((bank) => bank.name.toLowerCase().includes(term));
  }, [bankOptions, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectBank = (bankName: string) => {
    onChange(normalizeBankName(bankName));
    setSearchTerm('');
    setIsOpen(false);
  };

  const clearBank = () => {
    onChange('');
    setSearchTerm('');
    setIsOpen(true);
  };

  return (
    <div className="form-group" ref={containerRef}>
      <label className={`form-label ${required ? 'form-label-required' : ''}`} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        {selectedBankName && !isOpen ? (
          <div className="form-input flex items-center justify-between gap-2 bg-gray-50 h-10">
            <button
              type="button"
              className="min-w-0 flex-1 bg-transparent p-0 text-left"
              onClick={() => setIsOpen(true)}
            >
              <span className="block truncate">{selectedBankName}</span>
            </button>
            <button
              type="button"
              className="flex shrink-0 items-center rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onClick={clearBank}
              aria-label="Kosongkan bank"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              id={id}
              type="text"
              className="form-input pl-10"
              placeholder={bankOptions.length === 0 ? 'Belum ada data bank' : 'Cari bank...'}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onFocus={() => setIsOpen(true)}
              autoComplete="off"
            />
          </div>
        )}

        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {filteredBanks.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                Tidak ada hasil
              </div>
            ) : (
              filteredBanks.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  className="block w-full border-b border-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => selectBank(bank.name)}
                >
                  {bank.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {bankOptions.length === 0 && (
        <div className="text-xs text-warning-600 mt-1">
          Tambahkan data bank terlebih dahulu.
        </div>
      )}
    </div>
  );
}
