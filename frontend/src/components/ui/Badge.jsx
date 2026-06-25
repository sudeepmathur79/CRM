const STATUS_COLORS = {
  'New': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Contacted': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Qualified': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Proposal': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'Closed Won': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Closed Lost': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}`}>
    {status}
  </span>
);

export const TagBadge = ({ tag }) => (
  <span
    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
    style={{ backgroundColor: tag.color || '#6366f1' }}
  >
    {tag.name}
  </span>
);
