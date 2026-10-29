import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon } from '../../Icons';
import { tip } from '../../Tooltip';

const disabledProps = (reason) => (reason ? { 'aria-disabled': 'true', 'data-denied': 'true' } : {});

/**
 * The canvas toolbar (AD8.2): add an agent (typed or picked from the tenant's agents and the draft's), start a
 * connection from the selected agent, set the entry agent, remove a member, disconnect the selected call, and fit
 * the view. While a connection is open, a bar names the caller and offers the callee as a list, so a connection
 * never needs a pointer. A short list of keyboard shortcuts sits underneath. `blocked` is the reason editing is off.
 */
export default function CanvasToolbar({
  app,
  choices,
  members,
  entry,
  selectedNode,
  selectedEdge,
  connectFrom,
  blocked,
  addInputRef,
  onAdd,
  onStartConnect,
  onConnect,
  onCancelConnect,
  onSetEntry,
  onRemove,
  onDisconnect,
  onFitView
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [target, setTarget] = useState('');
  const [fanOut, setFanOut] = useState(true);
  const listId = `studio-canvas-agents-${app}`;
  const targets = members.filter((m) => m !== connectFrom);
  const chosenTarget = targets.includes(target) ? target : targets[0] || '';
  const needNode = t('tips.studio.canvas.needAgent');

  const add = async () => {
    if (blocked || !name.trim()) return;
    if (await onAdd(name, role)) {
      setName('');
      setRole('');
    }
  };

  const nodeReason = blocked || (selectedNode ? '' : needNode);
  const entryReason = nodeReason || (selectedNode && selectedNode.id === entry ? t('tips.studio.canvas.alreadyEntry', { name: entry }) : '');
  const edgeReason = blocked || (selectedEdge ? '' : t('tips.studio.canvas.needCall'));

  return (
    <div className="studio-canvas-toolbar" data-testid="studio-canvas-toolbar">
      <div className="studio-canvas-tools" role="group" aria-label={t('components.studio.canvas.toolbar.label')}>
        <div className="studio-canvas-add">
          <label htmlFor="studio-canvas-add-agent" {...tip(t('tips.studio.canvas.addAgent'))}>
            {t('components.studio.canvas.toolbar.addAgent')}
          </label>
          <input
            id="studio-canvas-add-agent"
            ref={addInputRef}
            list={listId}
            value={name}
            placeholder={t('components.studio.canvas.toolbar.addPlaceholder')}
            readOnly={!!blocked}
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            data-testid="studio-canvas-add-agent"
            {...tip(blocked || t('tips.studio.canvas.addAgent'))}
          />
          <datalist id={listId}>
            {choices.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <label htmlFor="studio-canvas-add-role" className="sr-only" {...tip(t('tips.studio.canvas.role'))}>
            {t('components.studio.canvas.toolbar.role')}
          </label>
          <input
            id="studio-canvas-add-role"
            value={role}
            placeholder={t('components.studio.canvas.toolbar.rolePlaceholder')}
            readOnly={!!blocked}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            data-testid="studio-canvas-add-role"
            {...tip(blocked || t('tips.studio.canvas.role'))}
          />
          <button type="button" className="button-primary button-sm" onClick={add} data-testid="studio-canvas-add" {...disabledProps(blocked)} {...tip(blocked || t('tips.studio.canvas.add', { app }))}>
            <PlusIcon size={14} /> {t('components.studio.canvas.toolbar.add')}
          </button>
        </div>
        <div className="studio-canvas-actions">
          <button
            type="button"
            className="button-secondary button-sm"
            onClick={() => !nodeReason && onStartConnect(selectedNode.id)}
            data-testid="studio-canvas-connect"
            {...disabledProps(nodeReason)}
            {...tip(nodeReason || t('tips.studio.canvas.connect', { name: selectedNode?.id || '' }))}
          >
            {t('components.studio.canvas.toolbar.connect')}
          </button>
          <button type="button" className="button-secondary button-sm" onClick={() => !entryReason && onSetEntry(selectedNode.id)} data-testid="studio-canvas-set-entry" {...disabledProps(entryReason)} {...tip(entryReason || t('tips.studio.canvas.setEntry'))}>
            {t('components.studio.canvas.toolbar.setEntry')}
          </button>
          <button type="button" className="button-secondary button-sm" onClick={() => !nodeReason && onRemove(selectedNode.id)} data-testid="studio-canvas-remove" {...disabledProps(nodeReason)} {...tip(nodeReason || t('tips.studio.canvas.remove'))}>
            {t('components.studio.canvas.toolbar.remove')}
          </button>
          <button type="button" className="button-secondary button-sm" onClick={() => !edgeReason && onDisconnect(selectedEdge.id)} data-testid="studio-canvas-disconnect" {...disabledProps(edgeReason)} {...tip(edgeReason || t('tips.studio.canvas.disconnect'))}>
            {t('components.studio.canvas.toolbar.disconnect')}
          </button>
          <button type="button" className="button-ghost button-sm" onClick={onFitView} data-testid="studio-canvas-fit" {...tip(t('tips.studio.canvas.fit'))}>
            {t('components.studio.canvas.toolbar.fit')}
          </button>
        </div>
      </div>
      {connectFrom && (
        <div className="info-banner studio-canvas-connect" data-testid="studio-canvas-connect-bar">
          <span role="status">{t('components.studio.canvas.connectBar.message', { name: connectFrom })}</span>
          <label htmlFor="studio-canvas-connect-to" {...tip(t('tips.studio.canvas.connectTo'))}>
            {t('components.studio.canvas.connectBar.to')}
          </label>
          <select id="studio-canvas-connect-to" value={chosenTarget} onChange={(e) => setTarget(e.target.value)} data-testid="studio-canvas-connect-to" {...tip(t('tips.studio.canvas.connectTo'))}>
            {targets.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <label className="checkbox-label" {...tip(t('tips.studio.canvas.fanOut'))}>
            <input type="checkbox" checked={fanOut} onChange={(e) => setFanOut(e.target.checked)} data-testid="studio-canvas-connect-fanout" {...tip(t('tips.studio.canvas.fanOut'))} />
            {t('components.studio.canvas.connectBar.fanOut')}
          </label>
          <button
            type="button"
            className="button-primary button-sm"
            onClick={() => chosenTarget && onConnect(connectFrom, chosenTarget, fanOut)}
            data-testid="studio-canvas-connect-confirm"
            {...disabledProps(chosenTarget ? '' : 'none')}
            {...tip(chosenTarget ? t('tips.studio.canvas.connectConfirm', { from: connectFrom, to: chosenTarget }) : t('tips.studio.canvas.connectNoTarget'))}
          >
            {t('components.studio.canvas.connectBar.confirm')}
          </button>
          <button type="button" className="button-ghost button-sm" onClick={onCancelConnect} data-testid="studio-canvas-connect-cancel" {...tip(t('tips.studio.canvas.connectCancel'))}>
            {t('common.actions.cancel')}
          </button>
        </div>
      )}
      <details className="studio-canvas-keys">
        <summary {...tip(t('tips.studio.canvas.keys'))}>{t('components.studio.canvas.keys.title')}</summary>
        <ul className="studio-list">
          {['tab', 'select', 'connect', 'entry', 'remove', 'move', 'add', 'calls', 'escape'].map((k) => (
            <li key={k}>{t(`components.studio.canvas.keys.${k}`)}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
