import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '../api/applications';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const INSTITUTION_TYPES = [
  'Commercial Bank',
  'Microfinance Institution',
  'Savings and Credit Cooperative',
  'Development Bank',
  'Investment Bank',
  'Insurance Company',
  'Payment Service Provider',
  'Other',
];

export default function NewApplicationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    institution_name: '',
    institution_type: '',
    description: '',
    registered_address: '',
    registration_number: '',
  });

  const mutation = useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: (app) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application created as draft');
      navigate(`/applications/${app.id}`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create application';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="p-8 max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">New Application</h1>
      <p className="text-gray-500 text-sm mb-8">
        Fill in the details below. You can save as draft and upload documents before submitting.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-500">
            Institution Details
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Institution Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.institution_name}
              onChange={(e) => update('institution_name', e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Kigali Commercial Bank Ltd"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Institution Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.institution_type}
              onChange={(e) => update('institution_type', e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select type...</option>
              {INSTITUTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Briefly describe your institution and its purpose..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Registered Address
            </label>
            <input
              value={form.registered_address}
              onChange={(e) => update('registered_address', e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. KG 7 Ave, Kigali"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Company Registration Number
            </label>
            <input
              value={form.registration_number}
              onChange={(e) => update('registration_number', e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. RCA/COM/2024/001"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {mutation.isPending ? 'Creating...' : 'Create Draft'}
          </button>
        </div>
      </form>
    </div>
  );
}
