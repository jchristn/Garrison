import { useNavigate } from 'react-router-dom';
import { tip } from './Tooltip';

/** One labelled value of an evaluation detail grid (AA9.15). label and tipText are translated text. */
export function EvalDetail({ name, label, tipText, span = false, children }) {
  return (
    <div className={`detail-item ${span ? 'detail-item-span' : ''}`} data-eval-field={name}>
      <div className="detail-item-label" {...tip(tipText)}>
        {label}
      </div>
      <div className="detail-item-value">{children ?? '-'}</div>
    </div>
  );
}

/** An in-app link that navigates without a reload, keeping modifier clicks for new tabs. */
export function EvalLink({ to, tipText, children, testId }) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      data-testid={testId}
      {...tip(tipText)}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

/** A titled panel of an evaluation page. */
export function EvalSection({ id, title, tipText, actions, children, testId }) {
  return (
    <section className="panel" aria-labelledby={`eval-${id}-title`} data-testid={testId}>
      <div className="eval-section-head">
        <h2 id={`eval-${id}-title`} className="section-title" {...tip(tipText)}>
          {title}
        </h2>
        {actions && <div className="flex gap-sm items-center">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
