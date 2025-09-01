'use client';

import { useState } from 'react';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pollUrl, setPollUrl] = useState('');

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || options.some(opt => !opt.trim()) || !password.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          options: options.map(opt => opt.trim()),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPollUrl(`${window.location.origin}/poll/${data.id}`);
        // Reset form
        setQuestion('');
        setOptions(['', '']);
        setPassword('');
      } else {
        alert(data.error || 'Failed to create poll');
      }
    } catch {
      alert('An error occurred while creating the poll');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create a Poll</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Create an anonymous poll and share it with others</p>
        </div>

        {pollUrl && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md">
            <h3 className="text-green-800 dark:text-green-200 font-medium">Poll created successfully!</h3>
            <p className="text-green-700 dark:text-green-300 text-sm mt-1">Share this link:</p>
            <a
              href={pollUrl}
              className="text-blue-600 dark:text-blue-300 hover:text-blue-800 break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {pollUrl}
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Question
            </label>
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:text-gray-100 dark:border-neutral-600"
              placeholder="What's your favorite color?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Options
            </label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:text-gray-100 dark:border-neutral-600"
                  placeholder={`Option ${index + 1}`}
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="px-3 py-2 text-red-700 dark:text-red-300 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="mt-2 px-4 py-2 text-blue-700 dark:text-blue-300 hover:text-blue-800 text-sm font-medium"
            >
              + Add Option
            </button>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Poll Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:text-gray-100 dark:border-neutral-600"
              placeholder="Password to edit this poll"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              You&apos;ll need this password to edit the poll later
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating Poll...
              </>
            ) : (
              'Create Poll'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
