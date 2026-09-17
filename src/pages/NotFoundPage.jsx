import { Link } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';

function NotFoundPage() {
  return (
    <div className="page">
      <EmptyState
        title="Page not found"
        description="That URL is not part of the agent portal."
        actionLabel="Back to Dashboard"
        actionTo="/dashboard"
      />
    </div>
  );
}

export default NotFoundPage;
