'use client';

import { GENERAL_ERROR_MESSAGES } from '@/lib/error.messages';
import { useState } from 'react';

type WeatherResponse = {
  city: string;
  temp: number;
  weather: string;
};

// プリセットの都市リスト
const cities = [
  { key: 'Tokyo', label: '東京' },
  { key: 'Osaka', label: '大阪' },
  { key: 'London', label: 'ロンドン' },
  { key: 'New York', label: 'ニューヨーク' },
  { key: 'Paris', label: 'パリ' },
];

export default function WeatherPage() {
  const [city, setCity] = useState(cities[0].key);
  const [result, setResult] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `https://x6pdjwc3a8.execute-api.ap-northeast-1.amazonaws.com/weather?city=${encodeURIComponent(city)}`
      );

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data: WeatherResponse = await res.json();
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || GENERAL_ERROR_MESSAGES.unknown);
      } else {
        setError(GENERAL_ERROR_MESSAGES.unknown);
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h1 className="text-2xl font-bold">🌤️ 天気検索</h1>

      <select value={city} onChange={(e) => setCity(e.target.value)} className="border rounded px-3 py-2">
        {cities.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </select>

      <button
        onClick={fetchWeather}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? '検索中...' : '検索'}
      </button>

      {error && <p className="text-red-600">❌ {error}</p>}

      {result && (
        <div className="mt-4 text-lg">
          <p>都市: {result.city}</p>
          <p>気温: {result.temp}℃</p>
          <p>天気: {result.weather}</p>
        </div>
      )}
    </div>
  );
}
