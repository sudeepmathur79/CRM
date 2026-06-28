import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../services/api';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Event', 'Other'];
const LEAD_TYPES = ['VC', 'Startup', 'Partner', 'Other'];
const FUNDING_STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'IPO'];
const TARGET_MARKETS = ['B2B SaaS', 'FinTech', 'HealthTech', 'EdTech', 'DeepTech', 'Consumer', 'Marketplace', 'Other'];

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

export default function LeadForm({ onSubmit, defaultValues = {}, loading }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues });
  const { data: users = [] } = useQuery({ queryKey: ['users', 'assignable'], queryFn: () => usersApi.list({ assignable: 'true' }).then(r => r.data) });

  const email = watch('email');
  const phone = watch('phone');
  const leadType = watch('leadType');
  const isVCOrStartup = leadType === 'VC' || leadType === 'Startup';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Deal name */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deal name <span className="text-red-400">*</span>
          </label>
          <input
            {...register('name', { required: 'Deal name is required' })}
            placeholder="e.g. Apex Roofing — New Install Q3"
            className={inputCls}
          />
          <p className="text-xs text-gray-400 mt-1">Use format: Company — Intent. Same company can have multiple deals.</p>
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company / Account</label>
          <input {...register('company')} placeholder="e.g. Apex Roofing Ltd" className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact name</label>
          <input {...register('contactName')} placeholder="e.g. James O'Brien" className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email {!phone && <span className="text-red-400">*</span>}
          </label>
          <input type="email" {...register('email', {
            validate: (val, formValues) => !!(val || formValues.phone) || 'Email or phone is required'
          })} className={inputCls} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone {!email && <span className="text-red-400">*</span>}
          </label>
          <input {...register('phone', {
            validate: (val, formValues) => !!(val || formValues.email) || 'Email or phone is required'
          })} className={inputCls} />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <div className="col-span-2 -mt-2">
          <p className="text-xs text-gray-400">At least one of email or phone is required.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select {...register('status')} className={inputCls}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
          <select {...register('source')} className={inputCls}>
            <option value="">— Select —</option>
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lead type</label>
          <select {...register('leadType')} className={inputCls}>
            <option value="">— None —</option>
            {LEAD_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
          <select {...register('assignedToId')} className={inputCls}>
            <option value="">— Unassigned —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deal Value ($)</label>
          <input type="number" min="0" step="0.01" placeholder="0.00" {...register('value')} className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Follow-up</label>
          <input type="date" {...register('nextFollowUp')} className={inputCls} />
        </div>

        {/* VC / Startup conditional fields */}
        {isVCOrStartup && (
          <>
            <div className="col-span-2">
              <div className={`rounded-xl border px-4 py-3 mb-2 ${leadType === 'VC' ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${leadType === 'VC' ? 'text-violet-600 dark:text-violet-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {leadType === 'VC' ? '🏦 Venture Capital fields' : '🚀 Startup fields'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Funding stage</label>
              <select {...register('fundingStage')} className={inputCls}>
                <option value="">— Select —</option>
                {FUNDING_STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {leadType === 'VC' ? 'Cheque / investment size ($)' : 'Valuation ($)'}
              </label>
              <input
                type="number" min="0" step="1000" placeholder="0"
                {...register(leadType === 'VC' ? 'investmentSize' : 'valuation')}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target market</label>
              <select {...register('targetMarket')} className={inputCls}>
                <option value="">— Select —</option>
                {TARGET_MARKETS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {leadType === 'VC' ? 'Partners involved' : 'Founder names'}
              </label>
              <input
                {...register('founderNames')}
                placeholder={leadType === 'VC' ? 'e.g. Sarah Chen, Mark Rivers' : 'e.g. Alice Tan, Bob Nguyen'}
                className={inputCls}
              />
            </div>
          </>
        )}

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
          <textarea rows={3} {...register('notes')} className={`${inputCls} resize-none`} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors">
          {loading ? 'Saving...' : 'Save Deal'}
        </button>
      </div>
    </form>
  );
}
