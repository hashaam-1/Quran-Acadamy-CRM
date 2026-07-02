import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/config';

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  updatedAt: string;
}

export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchangeRates'],
    queryFn: async () => {
      const response = await api.get('/exchange-rates');
      return response.data as ExchangeRate[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useConvertToPKR() {
  const { data: exchangeRates } = useExchangeRates();

  const convert = (amount: number, fromCurrency: string): number => {
    if (!amount || fromCurrency === 'PKR') return amount;

    const rate = exchangeRates?.find(
      (r: ExchangeRate) => r.from === fromCurrency && r.to === 'PKR'
    );

    if (rate && rate.rate) {
      return amount * rate.rate;
    }

    // Fallback rates if no exchange rate found
    const fallbackRates: Record<string, number> = {
      USD: 278, // Approximate PKR rate
      EUR: 300,
      GBP: 350,
      AED: 76,
      SAR: 74,
    };

    const fallbackRate = fallbackRates[fromCurrency];
    if (fallbackRate) {
      return amount * fallbackRate;
    }

    return amount; // Return as-is if no conversion possible
  };

  return convert;
}
