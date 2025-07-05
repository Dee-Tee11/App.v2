import { useState, useEffect, useMemo } from 'react';
import type { ProcessedReceipt } from '@/src/features/receipts/service/receiptService';

export function useReceiptsFilter(receipts: ProcessedReceipt[]) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReceipts = useMemo(() => {
    if (!searchQuery.trim()) {
      return receipts;
    }

    const searchLower = searchQuery.toLowerCase();
    return receipts.filter((receipt) => {
      return (
        receipt.extractedText.toLowerCase().includes(searchLower) ||
        receipt.merchantName?.toLowerCase().includes(searchLower) ||
        receipt.categoria?.toLowerCase().includes(searchLower) ||
        receipt.totalValue?.toString().includes(searchLower) ||
        receipt.dateDetected?.includes(searchQuery)
      );
    });
  }, [receipts, searchQuery]);

  return {
    filteredReceipts,
    searchQuery,
    setSearchQuery,
  };
}
