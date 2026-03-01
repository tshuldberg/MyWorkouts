'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FollowersPage() {
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following');

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/social"
        className="text-sm text-indigo-500 hover:text-indigo-700 mb-4 inline-block"
      >
        &larr; Back to feed
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Connections</h1>

      {/* Tab switcher */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('following')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'following'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Following
        </button>
        <button
          onClick={() => setActiveTab('followers')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'followers'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Followers
        </button>
      </div>

      {/* Placeholder for local mode */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8 text-indigo-400"
            >
              <path d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" />
              <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-2">
            {activeTab === 'following'
              ? 'You are not following anyone yet.'
              : 'No one is following you yet.'}
          </p>
          <p className="text-xs text-gray-400">
            Social features will be fully available when connected to the cloud.
            In local mode, you can still share workouts and view your own posts.
          </p>
        </div>

        {/* Search placeholder */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Find People</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name or email..."
              disabled
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <button
              disabled
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
            >
              Search
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Available with cloud sync enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
