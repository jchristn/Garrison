import { describe, it, expect } from 'vitest';
import { modelPricesConfig } from '../views/resourceConfigs';

const t = (key) => key;
describe('operator model prices', () => {
  it('accepts explicit free rates and nullable fallback rates', () => {
    const form = { ...modelPricesConfig.blank(), name: 'free-model', model: ' exact-model ', cachedInputUsdPerMillion: '', reasoningUsdPerMillion: 0 };
    expect(modelPricesConfig.validate(form, t)).toEqual({});
    const body = modelPricesConfig.toBody(form);
    expect(body.model).toBe('exact-model');
    expect(body.cachedInputUsdPerMillion).toBeNull();
    expect(body.reasoningUsdPerMillion).toBe(0);
    expect(body.inputUsdPerMillion).toBe(0);
  });
  it.each([null, '', -1, Infinity, NaN, 1000000001])('rejects invalid required rate %s', (rate) => {
    const form = { ...modelPricesConfig.blank(), name: 'price', model: 'model', inputUsdPerMillion: rate };
    expect(modelPricesConfig.validate(form, t).inputUsdPerMillion).toBe('resources.modelPrices.errors.rate');
  });
  it('accepts fractional rates and preserves separate token conventions', () => {
    const form = { ...modelPricesConfig.blank(), name: 'price', model: 'model', inputUsdPerMillion: 0.001, inputIncludesCachedTokens: false, outputIncludesReasoningTokens: false };
    expect(modelPricesConfig.validate(form, t)).toEqual({});
    expect(modelPricesConfig.toBody(form).inputIncludesCachedTokens).toBe(false);
    const fields = modelPricesConfig.fields(form, { t });
    expect(fields.find((f) => f.name === 'inputUsdPerMillion').step).toBe('any');
  });
});
