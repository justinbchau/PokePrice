'use client';

import { useState, useEffect } from 'react';

export default function ApiKeyInput() {
  const [apiKey, setApiKey] = useState<string>('');
  const [isStored, setIsStored] = useState(false);

  useEffect(() => {
    const storedKey = sessionStorage.getItem('openai_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setIsStored(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      sessionStorage.setItem('openai_api_key', apiKey.trim());
      setApiKey('');
      window.dispatchEvent(new Event('apiKeyChange'));
    }
  };

  const handleClear = () => {
    sessionStorage.removeItem('openai_api_key');
    setApiKey('');
    setIsStored(false);
    window.dispatchEvent(new Event('apiKeyChange'));
  };

  return (
    <div className="w-full max-w-md mx-auto mb-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 text-sm">
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter OpenAI API key..."
          className="flex-1 p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
          disabled={isStored}
        />
        {!isStored ? (
          <button
            type="submit"
            disabled={!apiKey}
            className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        ) : (
          <button
            type="button"
            onClick={handleClear}
            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Clear
          </button>
        )}
        {isStored && (
          <span className="text-xs text-green-600 dark:text-green-400">✓</span>
        )}
      </form>
    </div>
  );
}