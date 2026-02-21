'use client';

import { useState } from 'react';
import { PRICING } from '@myworkouts/shared';
import { SubscriptionPlan } from '@myworkouts/shared';

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="mt-2 text-gray-500">Unlock premium features for your fitness journey</p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <span className={`text-sm ${!annual ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              annual ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                annual ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm ${annual ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
            Annual <span className="text-accent-600">(Save 33%)</span>
          </span>
        </div>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {PRICING.map((tier) => (
          <div
            key={tier.plan}
            className={`rounded-xl border p-8 ${
              tier.plan === SubscriptionPlan.Premium
                ? 'border-primary-500 bg-white shadow-lg ring-1 ring-primary-500'
                : 'border-gray-200 bg-white'
            }`}
          >
            <h2 className="text-xl font-bold text-gray-900">{tier.name}</h2>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">
                ${annual ? (tier.annualPrice / 12).toFixed(0) : tier.monthlyPrice}
              </span>
              <span className="text-gray-500">/month</span>
              {annual && tier.annualPrice > 0 && (
                <p className="mt-1 text-sm text-gray-400">
                  Billed ${tier.annualPrice}/year
                </p>
              )}
            </div>

            <ul className="mt-6 space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 text-accent-500">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`mt-8 w-full rounded-lg py-2.5 text-sm font-semibold ${
                tier.plan === SubscriptionPlan.Premium
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tier.plan === SubscriptionPlan.Free ? 'Current Plan' : 'Upgrade to Premium'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
