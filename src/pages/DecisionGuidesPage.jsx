import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

function DecisionGuidesPage() {
  const { slug } = useParams();
  const [trees, setTrees] = useState(null);
  const [tree, setTree] = useState(null);
  const [nodeId, setNodeId] = useState(null);
  const [path, setPath] = useState([]);
  const [error, setError] = useState('');
  const [stepKey, setStepKey] = useState(0);

  useEffect(() => {
    if (!slug) {
      api
        .trees()
        .then((d) => setTrees(d.trees))
        .catch((err) => setError(err.message));
      return;
    }
    api
      .tree(slug)
      .then((d) => {
        setTree(d.tree);
        setNodeId(d.tree.rootNodeId);
        setPath([]);
        setStepKey((k) => k + 1);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) {
    return (
      <div className="page">
        <div className="callout callout--danger">{error}</div>
      </div>
    );
  }

  if (!slug) {
    if (!trees) {
      return (
        <div className="page">
          <Skeleton rows={4} />
        </div>
      );
    }
    return (
      <div className="page">
        <PageHeader
          eyebrow="Decision Guides"
          title="Interactive procedures"
          lede="Step through decisions — what to check, what not to do, when to escalate."
        />
        {trees.length ? (
          <div className="card-grid">
            {trees.map((t) => (
              <Link
                key={t.id}
                className={`ops-card ops-card--tone-${t.category || 'default'}`}
                to={`/decision-guides/${t.slug}`}
              >
                <StatusBadge status={t.category}>{t.category}</StatusBadge>
                <h2>{t.title}</h2>
                <p>{t.description}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No decision guides yet"
            description="Guides appear here once published for your role."
            actionLabel="Browse operations"
            actionTo="/operations"
          />
        )}
      </div>
    );
  }

  if (!tree || !nodeId) {
    return (
      <div className="page">
        <Skeleton rows={4} />
      </div>
    );
  }

  const node = tree.nodes[nodeId];
  if (!node) {
    return (
      <div className="page">
        <div className="callout callout--danger">Broken decision tree node.</div>
      </div>
    );
  }

  function choose(nextId, label) {
    setPath((p) => [...p, { from: nodeId, label }]);
    setNodeId(nextId);
    setStepKey((k) => k + 1);
  }

  function restart() {
    setNodeId(tree.rootNodeId);
    setPath([]);
    setStepKey((k) => k + 1);
  }

  const isOutcome = node.type === 'outcome';

  return (
    <div className="page">
      <p>
        <Link to="/decision-guides">← Decision Guides</Link>
      </p>
      <PageHeader
        eyebrow={`Decision guide · v${tree.version}`}
        title={tree.title}
        lede="Answer each step. Use the guidance panels before you choose."
      />

      {path.length ? (
        <ol className="path-crumbs" aria-label="Path so far">
          {path.map((step, i) => (
            <li key={`${step.from}-${i}`}>{step.label}</li>
          ))}
        </ol>
      ) : null}

      <div className="decision-canvas" key={stepKey}>
        <section className={`decision-step${isOutcome ? ' decision-step--outcome' : ''}`}>
          {isOutcome ? (
            <>
              <StatusBadge status={node.escalate ? 'IMPORTANT' : 'PASSED'}>
                {node.escalate ? 'Escalate' : 'Outcome'}
              </StatusBadge>
              <h2>{node.title}</h2>
              <p className="lede">{node.action}</p>
              {node.escalate ? (
                <div className="callout callout--warn">Escalate this case before closing.</div>
              ) : (
                <div className="callout">You can complete this path without escalation.</div>
              )}
              <button type="button" className="btn btn--primary btn--lg" onClick={restart}>
                Start over
              </button>
            </>
          ) : (
            <>
              <h2>{node.prompt}</h2>
              <dl className="decision-meta">
                <div>
                  <dt>What to check</dt>
                  <dd>{node.whatToCheck}</dd>
                </div>
                <div>
                  <dt>Why it matters</dt>
                  <dd>{node.whyItMatters}</dd>
                </div>
                <div>
                  <dt>What NOT to do</dt>
                  <dd>{node.whatNotToDo}</dd>
                </div>
                <div>
                  <dt>Escalate when</dt>
                  <dd>{node.escalateWhen}</dd>
                </div>
              </dl>
              <div className="choice-row">
                {(node.options || []).map((opt) => (
                  <button
                    key={opt.next + opt.label}
                    type="button"
                    className="btn btn--primary"
                    onClick={() => choose(opt.next, opt.label)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default DecisionGuidesPage;
