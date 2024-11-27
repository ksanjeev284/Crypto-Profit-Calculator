'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import Link from 'next/link';

interface CryptoProfitCalculatorForm {
  cryptocurrency: string;
  investmentType: 'amount' | 'quantity';
  initialInvestment: number;
  quantity?: number;
  targetPrice: number;
}

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  currentPrice: number;
  price_change_24h_percentage?: number;
}

interface ProfitCalculation {
  initialInvestment: number;
  quantity: number;
  buyPrice: number;
  targetPrice: number;
  potentialValue: number;
  profitAmount: number;
  profitPercentage: number;
  breakevenPrice: number;
}

interface CryptoListItem {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank?: number;
}

export default function CryptoProfitCalculator() {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [profitCalc, setProfitCalc] = useState<ProfitCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [cryptoList, setCryptoList] = useState<CryptoListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCryptoList, setLoadingCryptoList] = useState(true);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CryptoProfitCalculatorForm>({
    defaultValues: {
      investmentType: 'amount'
    }
  });

  const watchCrypto = watch('cryptocurrency');
  const watchInvestmentType = watch('investmentType');
  const watchInitialInvestment = watch('initialInvestment');
  const watchQuantity = watch('quantity');

  useEffect(() => {
    if (watchCrypto) {
      fetchCryptoPrice(watchCrypto);
    }
  }, [watchCrypto]);

  useEffect(() => {
    fetchCryptoList();
  }, []);

  const fetchCryptoList = async () => {
    setLoadingCryptoList(true);
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 1000,
            page: 1,
            sparkline: false
          }
        }
      );
      const cryptos = response.data.map((crypto: any) => ({
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.symbol.toUpperCase(),
        market_cap_rank: crypto.market_cap_rank
      }));
      setCryptoList(cryptos);
    } catch (error) {
      console.error('Error fetching crypto list:', error);
    } finally {
      setLoadingCryptoList(false);
    }
  };

  const fetchCryptoPrice = async (cryptoId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd&include_24hr_change=true`
      );
      const price = response.data[cryptoId].usd;
      const priceChange = response.data[cryptoId].usd_24h_change;
      const crypto = cryptoList.find(c => c.id === cryptoId);
      if (crypto) {
        setSelectedCrypto({
          ...crypto,
          currentPrice: price,
          price_change_24h_percentage: priceChange
        });
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCryptoList = useMemo(() => {
    if (!searchQuery) return cryptoList;
    const query = searchQuery.toLowerCase();
    return cryptoList.filter(
      crypto =>
        crypto.name.toLowerCase().includes(query) ||
        crypto.symbol.toLowerCase().includes(query) ||
        crypto.id.toLowerCase().includes(query)
    );
  }, [cryptoList, searchQuery]);

  const calculateProfit = (data: CryptoProfitCalculatorForm) => {
    if (!selectedCrypto) return;

    const investment = parseFloat(data.initialInvestment.toString());
    const quantity = parseFloat((data.quantity || 0).toString());
    const targetPrice = parseFloat(data.targetPrice.toString());
    const buyPrice = investment / quantity;

    const potentialValue = quantity * targetPrice;
    const profitAmount = potentialValue - investment;
    const profitPercentage = (profitAmount / investment) * 100;
    const breakevenPrice = investment / quantity;

    setProfitCalc({
      initialInvestment: investment,
      quantity: quantity,
      buyPrice: buyPrice,
      targetPrice: targetPrice,
      potentialValue: potentialValue,
      profitAmount: profitAmount,
      profitPercentage: profitPercentage,
      breakevenPrice: breakevenPrice
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatCrypto = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(value);
  };

  // Auto-calculate quantity when investment amount changes
  useEffect(() => {
    if (selectedCrypto && watchInvestmentType === 'amount' && watchInitialInvestment > 0) {
      const quantity = watchInitialInvestment / selectedCrypto.currentPrice;
      setValue('quantity', parseFloat(quantity.toFixed(8)));
    }
  }, [watchInvestmentType, watchInitialInvestment, selectedCrypto]);

  // Auto-calculate investment when quantity changes
  useEffect(() => {
    if (selectedCrypto && watchInvestmentType === 'quantity' && watchQuantity > 0) {
      const investment = watchQuantity * selectedCrypto.currentPrice;
      setValue('initialInvestment', parseFloat(investment.toFixed(2)));
    }
  }, [watchInvestmentType, watchQuantity, selectedCrypto]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-3xl font-extrabold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Crypto Profit Calculator
                </h2>
                
                <div className="mb-8 text-center">
                  <Link 
                    href="/historical-returns" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    🚀 Check Historical Bitcoin Returns
                  </Link>
                </div>

                <form onSubmit={handleSubmit(calculateProfit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Cryptocurrency</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search by name or symbol..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Cryptocurrency</label>
                    {loadingCryptoList ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading cryptocurrencies...</p>
                      </div>
                    ) : (
                      <select
                        {...register('cryptocurrency', { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a cryptocurrency</option>
                        {filteredCryptoList.map((crypto) => (
                          <option key={crypto.id} value={crypto.id}>
                            {crypto.market_cap_rank ? `#${crypto.market_cap_rank} ` : ''}{crypto.name} ({crypto.symbol})
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.cryptocurrency && (
                      <span className="text-red-500 text-sm">Please select a cryptocurrency</span>
                    )}
                  </div>

                  {selectedCrypto && (
                    <div className="bg-blue-50 p-4 rounded-md space-y-2">
                      <p className="text-sm text-blue-800">
                        Current {selectedCrypto.name} Price: {formatCurrency(selectedCrypto.currentPrice)}
                      </p>
                      {selectedCrypto.price_change_24h_percentage && (
                        <p className={`text-sm ${selectedCrypto.price_change_24h_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          24h Change: {selectedCrypto.price_change_24h_percentage.toFixed(2)}%
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="amount"
                        {...register('investmentType')}
                        className="mr-2"
                      />
                      Invest Amount
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="quantity"
                        {...register('investmentType')}
                        className="mr-2"
                      />
                      Enter Quantity
                    </label>
                  </div>

                  {watchInvestmentType === 'amount' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Investment Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('initialInvestment', { required: true, min: 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter investment amount"
                      />
                      {errors.initialInvestment && (
                        <span className="text-red-500 text-sm">Please enter a valid amount</span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <input
                        type="number"
                        step="0.000001"
                        {...register('quantity', { required: true, min: 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter quantity"
                      />
                      {errors.quantity && (
                        <span className="text-red-500 text-sm">Please enter a valid quantity</span>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('targetPrice', { required: true, min: 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter target price"
                    />
                    {errors.targetPrice && (
                      <span className="text-red-500 text-sm">Please enter a valid price</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-md hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Calculate Profit'}
                  </button>
                </form>

                {profitCalc && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg space-y-4">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Investment Summary</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Initial Investment</p>
                        <p className="font-semibold">{formatCurrency(profitCalc.initialInvestment)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="font-semibold">{formatCrypto(profitCalc.quantity)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Average Buy Price</p>
                        <p className="font-semibold">{formatCurrency(profitCalc.buyPrice)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Target Price</p>
                        <p className="font-semibold">{formatCurrency(profitCalc.targetPrice)}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="text-lg font-semibold mb-3">Profit Analysis</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Potential Value</p>
                          <p className="font-bold text-lg">{formatCurrency(profitCalc.potentialValue)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Profit/Loss</p>
                          <p className={`font-bold text-lg ${profitCalc.profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(profitCalc.profitAmount)}
                            <span className="text-sm ml-2">
                              ({profitCalc.profitPercentage >= 0 ? '+' : ''}{profitCalc.profitPercentage.toFixed(2)}%)
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Breakeven Price</p>
                          <p className="font-semibold">{formatCurrency(profitCalc.breakevenPrice)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
