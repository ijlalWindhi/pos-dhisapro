import type { SavedBRILinkAccount } from '@/types';

export const DUPLICATE_SAVED_ACCOUNT_MESSAGE = 'Nama dan nomor rekening yang sama sudah tersimpan.';

export const sanitizeAccountNameInput = (value: string) => value.replace(/[0-9]/g, '').toUpperCase();

export const normalizeAccountName = (value: string) => sanitizeAccountNameInput(value).trim();

export const normalizeAccountNumber = (value: string) => value.replaceAll(/\D/g, '');

export const normalizeBankName = (value: string) => value.trim().toUpperCase();

export const findDuplicateSavedAccount = (
  accounts: SavedBRILinkAccount[],
  data: { accountName: string; accountNumber: string },
  excludeId?: string
) => {
  const accountName = normalizeAccountName(data.accountName);
  const accountNumber = normalizeAccountNumber(data.accountNumber);

  return accounts.find((account) =>
    account.id !== excludeId &&
    normalizeAccountName(account.accountName) === accountName &&
    normalizeAccountNumber(account.accountNumber) === accountNumber
  );
};
