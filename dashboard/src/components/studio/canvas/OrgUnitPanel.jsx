import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from '../../Tooltip';
import { formatNumber } from '../../../i18n/formatters';

const denied = (reason) => (reason ? { 'aria-disabled': 'true', 'data-denied': 'true' } : {});

function Fact({ label, tipText, children, testId }) {
  return (
    <div className="detail-item" data-testid={testId}>
      <div className="detail-item-label" {...tip(tipText)}>
        {label}
      </div>
      <div className="detail-item-value">{children || '-'}</div>
    </div>
  );
}

/**
 * The side panel of the organization canvas (AA7.10). A selected unit shows its parent, lead, and members (each with
 * Remove), an Add member form (agent and title, an AddUnitMember at once), its peer lines (each with Disconnect), and
 * actions to add a unit below it, start a peer line, and remove it. A selected peer line shows its two units and
 * Disconnect. With nothing selected it shows the organization's counts.
 */
export default function OrgUnitPanel({ flow, unit, peer, choices, blocked, onAddMember, onRemoveMember, onDisconnect, onStartPeer, onRemoveUnit, onAddChild }) {
  const { t, i18n } = useTranslation();
  const [agent, setAgent] = useState('');
  const [title, setTitle] = useState('');
  const lng = i18n.language;

  if (peer) {
    return (
      <div className="studio-canvas-props" data-testid="studio-peer-panel" data-peer-panel={peer.id}>
        <h4 className="section-title" {...tip(t('tips.studio.canvas.org.peerTitle'))}>
          {t('components.studio.canvas.org.peerTitle', {
            from: peer.from,
            to: peer.to
          })}
        </h4>
        <p className="field-hint">
          {t('components.studio.canvas.org.peerHint', {
            from: peer.from,
            to: peer.to
          })}
        </p>
        <div>
          <button
            type="button"
            className="button-danger button-sm"
            onClick={() => !blocked && onDisconnect(peer)}
            data-testid="studio-peer-disconnect"
            {...denied(blocked)}
            {...tip(blocked || t('tips.studio.canvas.org.disconnect'))}
          >
            {t('components.studio.canvas.org.disconnect')}
          </button>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="studio-canvas-props" data-testid="studio-org-panel">
        <h4 className="section-title" {...tip(t('tips.studio.canvas.org.orgTitle'))}>
          {t('components.studio.canvas.org.orgTitle', {
            name: flow.organization
          })}
        </h4>
        <div className="detail-grid">
          <Fact label={t('components.studio.canvas.org.units')} tipText={t('tips.studio.canvas.org.units')}>
            {formatNumber(flow.units.length, {}, lng)}
          </Fact>
          <Fact label={t('components.studio.canvas.org.root')} tipText={t('tips.studio.canvas.org.root')}>
            {flow.roots.join(', ')}
          </Fact>
          <Fact label={t('components.studio.canvas.org.peers')} tipText={t('tips.studio.canvas.org.peers')}>
            {formatNumber(flow.peers.length, {}, lng)}
          </Fact>
        </div>
        <p className="field-hint">{flow.deleted ? t('components.studio.canvas.org.deleted') : t('components.studio.canvas.org.orgHint')}</p>
      </div>
    );
  }

  const peers = flow.peers.filter((p) => p.from === unit.name || p.to === unit.name);
  const addMember = async () => {
    if (blocked || !agent.trim()) return;
    if (await onAddMember(unit.name, agent.trim(), title.trim())) {
      setAgent('');
      setTitle('');
    }
  };
  const listId = `studio-unit-agents-${unit.name}`;
  return (
    <div className="studio-canvas-props" data-testid="studio-unit-panel" data-unit-panel={unit.name}>
      <h4 className="section-title" {...tip(t('tips.studio.canvas.org.unitTitle'))}>
        {t('components.studio.canvas.org.unitTitle', { name: unit.name })}
      </h4>
      <div className="detail-grid">
        <Fact label={t('components.studio.canvas.org.reportsTo')} tipText={t('tips.studio.canvas.org.reportsTo')}>
          {unit.parent || t('components.studio.canvas.org.node.root')}
        </Fact>
        <Fact label={t('components.studio.canvas.org.lead')} tipText={t('tips.studio.canvas.org.lead')} testId="studio-unit-lead">
          {unit.lead || t('components.studio.canvas.org.node.noLead')}
        </Fact>
      </div>
      <div className="form-section-title" {...tip(t('tips.studio.canvas.org.members'))}>
        {t('components.studio.canvas.org.members', {
          count: unit.members.length
        })}
      </div>
      {unit.members.length === 0 ? (
        <div className="text-muted">{t('components.studio.canvas.org.noMembers')}</div>
      ) : (
        <ul className="studio-list" data-testid="studio-unit-members">
          {unit.members.map((m) => (
            <li key={m} className="flex gap-sm items-center" data-member={m}>
              <span>{m}</span>
              <button
                type="button"
                className="button-ghost button-sm"
                onClick={() => !blocked && onRemoveMember(unit.name, m)}
                aria-label={`${t('components.studio.canvas.org.removeMember')} ${m}`}
                data-testid={`studio-unit-remove-member-${m}`}
                {...denied(blocked)}
                {...tip(blocked || t('tips.studio.canvas.org.removeMember'))}
              >
                {t('components.studio.canvas.org.removeMember')}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="studio-canvas-row">
        <label htmlFor="studio-unit-member-agent" className="sr-only" {...tip(t('tips.studio.canvas.org.memberAgent'))}>
          {t('components.studio.canvas.org.memberAgent')}
        </label>
        <input
          id="studio-unit-member-agent"
          list={listId}
          value={agent}
          placeholder={t('components.studio.canvas.org.memberAgent')}
          readOnly={!!blocked}
          autoComplete="off"
          onChange={(e) => setAgent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
          data-testid="studio-unit-member-agent"
          {...tip(blocked || t('tips.studio.canvas.org.memberAgent'))}
        />
        <datalist id={listId}>
          {choices
            .filter((c) => c !== unit.lead && !unit.members.includes(c))
            .map((c) => (
              <option key={c} value={c} />
            ))}
        </datalist>
        <label htmlFor="studio-unit-member-title" className="sr-only" {...tip(t('tips.studio.canvas.org.memberTitle'))}>
          {t('components.studio.canvas.org.memberTitle')}
        </label>
        <input
          id="studio-unit-member-title"
          value={title}
          placeholder={t('components.studio.canvas.org.memberTitle')}
          readOnly={!!blocked}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
          data-testid="studio-unit-member-title"
          {...tip(blocked || t('tips.studio.canvas.org.memberTitle'))}
        />
        <button
          type="button"
          className="button-secondary button-sm"
          onClick={addMember}
          data-testid="studio-unit-add-member"
          {...denied(blocked)}
          {...tip(blocked || t('tips.studio.canvas.org.addMember', { unit: unit.name }))}
        >
          {t('components.studio.canvas.org.addMember')}
        </button>
      </div>
      <div className="form-section-title" {...tip(t('tips.studio.canvas.org.peers'))}>
        {t('components.studio.canvas.org.peers')}
      </div>
      {peers.length === 0 ? (
        <div className="text-muted">{t('components.studio.canvas.org.noPeers')}</div>
      ) : (
        <ul className="studio-list">
          {peers.map((p) => {
            const other = p.from === unit.name ? p.to : p.from;
            return (
              <li key={p.id} className="flex gap-sm items-center">
                <span>{other}</span>
                <button
                  type="button"
                  className="button-ghost button-sm"
                  onClick={() => !blocked && onDisconnect(p)}
                  aria-label={`${t('components.studio.canvas.org.disconnect')} ${other}`}
                  data-testid={`studio-unit-disconnect-${other}`}
                  {...denied(blocked)}
                  {...tip(blocked || t('tips.studio.canvas.org.disconnect'))}
                >
                  {t('components.studio.canvas.org.disconnect')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex gap-sm studio-canvas-panel-actions">
        <button
          type="button"
          className="button-secondary button-sm"
          onClick={() => !blocked && onAddChild(unit.name)}
          data-testid="studio-unit-add-child"
          {...denied(blocked)}
          {...tip(blocked || t('tips.studio.canvas.org.addChild'))}
        >
          {t('components.studio.canvas.org.addChild')}
        </button>
        <button
          type="button"
          className="button-secondary button-sm"
          onClick={() => !blocked && onStartPeer(unit.name)}
          data-testid="studio-unit-start-peer"
          {...denied(blocked)}
          {...tip(blocked || t('tips.studio.canvas.org.startPeer'))}
        >
          {t('components.studio.canvas.org.startPeer')}
        </button>
        <button
          type="button"
          className="button-danger button-sm"
          onClick={() => !blocked && onRemoveUnit(unit.name)}
          data-testid="studio-unit-remove"
          {...denied(blocked)}
          {...tip(blocked || t('tips.studio.canvas.org.removeUnit'))}
        >
          {t('components.studio.canvas.org.removeUnit')}
        </button>
      </div>
    </div>
  );
}
