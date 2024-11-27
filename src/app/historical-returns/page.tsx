'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface HistoricalReturn {
  year: number;
  price: number;
  currentValue: number;
  multiplier: number;
  whatYouCanBuy: string[];
}

interface LuxuryItem {
  name: string;
  price: number;
  image: string;
}

const LUXURY_ITEMS: LuxuryItem[] = [
  { name: 'Lamborghini Aventador', price: 500000, image: '🚗' },
  { name: 'Luxury Yacht', price: 1000000, image: '⛵' },
  { name: 'Private Island', price: 5000000, image: '🏝️' },
  { name: 'Private Jet', price: 20000000, image: '✈️' },
  { name: 'Mansion in Beverly Hills', price: 30000000, image: '🏰' },
  { name: 'Super Yacht', price: 50000000, image: '🛥️' },
];

export default function HistoricalReturns() {
  const [loading, setLoading] = useState(false);
  const [currentBtcPrice, setCurrentBtcPrice] = useState<number>(0);
  const [investment, setInvestment] = useState<number>(1000);
  const [historicalData, setHistoricalData] = useState<HistoricalReturn[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [investment]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Get current BTC price
      const currentPriceResponse = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      const currentPrice = currentPriceResponse.data.bitcoin.usd;
      setCurrentBtcPrice(currentPrice);

      // Get historical data with delay between requests
      const years = Array.from({ length: new Date().getFullYear() - 2009 + 1 }, (_, i) => 2009 + i);
      const historicalPrices = [];

      for (const year of years) {
        try {
          // Add delay between requests to avoid rate limiting
          await delay(1200); // 1.2 second delay between requests

          if (year <= 2010) {
            // Use approximate values for early years
            const price = year === 2009 ? 0.05 : 0.1;
            const btcAmount = investment / price;
            const currentValue = btcAmount * currentPrice;
            const multiplier = currentValue / investment;

            const affordableItems = LUXURY_ITEMS
              .filter(item => currentValue >= item.price)
              .map(item => `${item.image} ${item.name}`);

            historicalPrices.push({
              year,
              price,
              currentValue,
              multiplier,
              whatYouCanBuy: affordableItems,
            });
            continue;
          }

          // Format date as DD-MM-YYYY
          const date = `01-01-${year}`;
          const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${date}&localization=false`
          );

          const price = response.data.market_data?.current_price?.usd;
          if (!price) {
            console.log(`No price data for ${year}, response:`, response.data);
            continue;
          }

          const btcAmount = investment / price;
          const currentValue = btcAmount * currentPrice;
          const multiplier = currentValue / investment;

          const affordableItems = LUXURY_ITEMS
            .filter(item => currentValue >= item.price)
            .map(item => `${item.image} ${item.name}`);

          historicalPrices.push({
            year,
            price,
            currentValue,
            multiplier,
            whatYouCanBuy: affordableItems,
          });
        } catch (error) {
          console.error(`Error fetching data for ${year}:`, error);
          // Continue with next year if there's an error
          continue;
        }
      }

      const validPrices = historicalPrices.reverse();
      if (validPrices.length === 0) {
        setError('No historical data available. Please try again later.');
      } else {
        setHistoricalData(validPrices);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again later. CoinGecko API may be rate limited - please wait a minute and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatLargeNumber = (value: number) => {
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Link 
            href="/"
            className="inline-block text-white hover:text-blue-200 mb-4"
          >
            ← Back to Calculator
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">
            Bitcoin Time Machine
          </h1>
          <p className="text-xl text-blue-200">
            See what your investment would be worth if you bought Bitcoin in previous years
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Investment Amount (USD)
            </label>
            <div className="flex gap-4">
              <input
                type="number"
                value={investment}
                onChange={(e) => setInvestment(Number(e.target.value))}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter investment amount"
                min="1"
              />
              <button
                onClick={() => fetchData()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Calculate'}
              </button>
            </div>
          </div>

          {currentBtcPrice > 0 && (
            <div className="text-center mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-600">Current Bitcoin Price</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(currentBtcPrice)}</p>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-center mb-6">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bitcoin Price
                  </th>
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Value
                  </th>
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return Multiplier
                  </th>
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    What You Could Buy Today
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historicalData.map((data) => (
                  <tr key={data.year} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {data.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(data.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(data.currentValue)}
                      </span>
                      <br />
                      <span className="text-xs text-gray-500">
                        ({formatLargeNumber(data.currentValue)})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-bold text-blue-600">
                        {data.multiplier.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-2">
                        {data.whatYouCanBuy.map((item, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
