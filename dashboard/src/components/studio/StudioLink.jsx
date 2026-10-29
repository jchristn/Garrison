import { useNavigate } from 'react-router-dom';
import { tip } from '../Tooltip';

/** A link to another dashboard page that navigates in place (a new tab still works from the context menu). */
export default function StudioLink({ to, tipText, testId, children, className }) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      className={className}
      data-testid={testId}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...tip(tipText)}
    >
      {children}
    </a>
  );
}
