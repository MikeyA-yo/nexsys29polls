'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PollResult {
  option: string;
  votes: number;
  percentage: number;
}

interface PollData {
  id: string;
  question: string;
  options: string[];
  results: PollResult[];
  totalVotes: number;
  createdAt: string;
}

export default function PollPage() {
  const params = useParams();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [newOption, setNewOption] = useState('');
  const [editing, setEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPoll();
    checkIfVoted();
  }, [pollId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPoll = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const response = await fetch(`/api/polls/${pollId}`);
      if (response.ok) {
        const data = await response.json();
        setPoll(data);
      } else {
        setError('Poll not found');
      }
    } catch {
      setError('Failed to load poll');
    } finally {
      if (showRefresh) setRefreshing(false);
      setLoading(false);
    }
  };

  const checkIfVoted = () => {
    const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
    if (votedPolls[pollId]) {
      setHasVoted(true);
    }
  };

  const handleVote = async (optionIndex: number) => {
    if (hasVoted || voting) return;

    setVoting(true);
    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionIndex }),
      });

      if (response.ok) {
        const data = await response.json();
        setPoll(prev => prev ? { ...prev, results: data.results, totalVotes: data.totalVotes } : null);

        // Mark as voted in localStorage
        const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
        votedPolls[pollId] = true;
        localStorage.setItem('votedPolls', JSON.stringify(votedPolls));

        setHasVoted(true);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to vote');
      }
    } catch {
      alert('Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  const handleEdit = async (action: 'add' | 'remove', optionIndex?: number) => {
    if (!editPassword) {
      alert('Please enter the password');
      return;
    }

    setEditing(true);
    try {
      const body: { password: string; action: 'add' | 'remove'; option?: string | number } = {
        password: editPassword,
        action
      };
      if (action === 'add') {
        body.option = newOption;
      } else if (action === 'remove' && optionIndex !== undefined) {
        body.option = optionIndex;
      }

      const response = await fetch(`/api/polls/${pollId}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchPoll(true); // Refresh poll data
        setNewOption('');
        setShowEdit(false);
        setEditPassword('');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to edit poll');
      }
    } catch {
      alert('Failed to edit poll');
    } finally {
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading poll...</div>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p>{error || 'Poll not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 relative">
          {refreshing && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <div className="text-sm text-gray-600">Updating poll...</div>
              </div>
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{poll.question}</h1>

          {!hasVoted ? (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Vote for your option:</h2>
              <div className="space-y-3">
                {poll.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleVote(index)}
                    disabled={voting}
                    className="w-full text-left p-4 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-between"
                  >
                    <span>{option}</span>
                    {voting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Results:</h2>
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={poll.results}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="option" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="votes" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {poll.results.map((result, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-medium">{result.option}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full"
                          style={{ width: `${result.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-right">
                        {result.votes} ({result.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-gray-600 mt-4">
                Total votes: {poll.totalVotes}
              </p>
            </div>
          )}

          <div className="border-t pt-6">
            {!showEdit ? (
              <button
                onClick={() => setShowEdit(true)}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Edit Poll
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poll Password
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter password to edit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add New Option
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="New option"
                    />
                    <button
                      onClick={() => handleEdit('add')}
                      disabled={editing || !newOption.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {editing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Adding...
                        </>
                      ) : (
                        'Add'
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remove Options
                  </label>
                  <div className="space-y-2">
                    {poll.options.map((option, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <span>{option}</span>
                        <button
                          onClick={() => handleEdit('remove', index)}
                          disabled={editing}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {editing ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              <span className="text-xs">Removing...</span>
                            </>
                          ) : (
                            'Remove'
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowEdit(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
