'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';

type FormData = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export default function InquiryForm({
  projectId,
  neighborhoodId,
  source = 'inquiry',
  projectName,
}: {
  projectId?: string;
  neighborhoodId?: string;
  source?: string;
  projectName?: string;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const onSubmit = async (data: FormData) => {
    setStatus('loading');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, projectId, neighborhoodId, source }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      reset();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <h3 className="text-green-800 font-semibold text-lg mb-2">Thank you!</h3>
        <p className="text-green-700 text-sm">We&apos;ve received your inquiry and will be in touch shortly.</p>
        <button onClick={() => setStatus('idle')} className="mt-4 text-sm text-green-600 underline">
          Send another inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h3 className="font-display text-xl font-semibold text-navy">
        {projectName ? `Inquire About ${projectName}` : 'Get More Information'}
      </h3>
      <p className="text-sm text-gray-500">Fill out the form below and we&apos;ll get back to you within 24 hours.</p>

      <div>
        <input
          {...register('name', { required: 'Name is required' })}
          placeholder="Full Name *"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold outline-none"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <input
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
          })}
          type="email"
          placeholder="Email Address *"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold outline-none"
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <input
          {...register('phone')}
          type="tel"
          placeholder="Phone Number"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold outline-none"
        />
      </div>

      <div>
        <textarea
          {...register('message')}
          placeholder="Message (optional)"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-gold w-full disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending...' : 'Send Inquiry'}
      </button>

      {status === 'error' && (
        <p className="text-red-500 text-sm text-center">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
