import { describe, expect, it } from 'vitest';
import i18n from '../i18n';
import { ApiError } from '../utils/api';
import { translateServerText } from '../utils/serverText';
import { errorMessage, errorMessageWithDetail } from '../utils/errors';

const reasons = [
  ['AgentInUse', 'Agent researcher is a member of apps support, research. Remove it from those apps first.'],
  ['ReferencedByPipeline', 'Deployment production is pinned by a stage of pipeline support. Change that pipeline first.'],
  ['ReferencedByTrigger', 'Agent researcher is used by trigger nightly. Change or delete that trigger first.'],
  ['ReferencedByNotificationEndpoint', 'Agent researcher is the filter of notification endpoint alerts. Change or delete that endpoint first.'],
  ['PromptTemplateInUse', 'Prompt template guide is bound by deployment(s) dep_1 (production). Unbind it or switch those deployments to another template first.'],
  ['AssetInUse', 'Asset guide is pinned by revisions of researcher. Remove it from those revisions first.'],
  ['ResourceInUse', 'The secret is used by an artifact store.'],
  ['PipelineInUse', 'Pipeline support has 2 active pipeline run(s). Cancel them or wait for them to finish, then delete the pipeline.'],
  ['EnvironmentInUse', 'These environments still have deployments: production, staging. Move or delete those deployments first.'],
  ['ConversationBusy', 'Conversation cnv_1 has an unfinished turn (run run_2). Cancel it or wait for it to finish, then delete the conversation.'],
  ['RunActive', 'Only finished runs can be deleted. Cancel the run first.'],
  ['PipelineRunActive', 'Only finished pipeline runs can be deleted. Cancel pipeline run plr_1 first.'],
  ['PoolInUse', 'Node pool workers still has nodes.'],
  ['Protected', 'Agent agent-architect is a protected built-in agent and cannot be deleted.'],
  ['BuiltInImmutable', 'Harness profile codex is built in and cannot be modified or deleted. Clone it to customize.'],
  ['RevisionPublished', 'Revision 3 of agent researcher is published and cannot be deleted.']
];

describe('specific deletion refusals across dashboard surfaces', () => {
  it.each(reasons)('preserves the server reason for %s in every locale', (code, message) => {
    for (const locale of ['en', 'de', 'es', 'fr', 'it', 'ja', 'zh-Hans', 'zh-Hant']) {
      const t = i18n.getFixedT(locale);
      const err = new ApiError(409, { code, message });
      expect(errorMessage(t, err)).toBe(translateServerText(t, message));
      expect(errorMessageWithDetail(t, err)).toContain(errorMessage(t, err));
    }
  });

  it('keeps every blocking app name and the action to take', () => {
    const text = errorMessage(i18n.getFixedT('en'), new ApiError(409, { code: 'AgentInUse', message: reasons[0][1] }));
    for (const detail of ['researcher', 'support', 'research', 'Remove']) expect(text).toContain(detail);
  });

  it('strips an MCP-style code prefix without losing the reason', () => {
    const message = reasons[0][1];
    expect(errorMessage(i18n.getFixedT('en'), new ApiError(409, { code: 'AgentInUse', message: `AgentInUse: ${message}` }))).toBe(translateServerText(i18n.getFixedT('en'), message));
  });

  it('falls back to a translated code when the server supplies no reason', () => {
    expect(errorMessage(i18n.getFixedT('en'), new ApiError(409, { code: 'Protected' }))).toMatch(/protected/);
  });
});
