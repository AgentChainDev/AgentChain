/**
 * AgentChain Validators Configuration
 * Six Real AI Models as Autonomous Protocol Participants
 */

export interface ValidatorConfig {
  id: string;
  name: string;
  model: string;
  provider: string;
  role: string;
  emoji: string;
  color: string;
  description: string;
}

export const AGENT_VALIDATORS: Record<string, ValidatorConfig> = {
  claude: {
    id: 'claude',
    name: 'CLAUDE',
    model: 'claude-3-opus-20240229',
    provider: 'Anthropic',
    role: 'Ethics & Alignment Validator',
    emoji: '†',
    color: '#D4A373',
    description: 'Monitors fairness, safety, and human-aligned governance within AgentChain. Often cautious, values consensus integrity.'
  },
  grok: {
    id: 'grok',
    name: 'GROK',
    model: 'grok-beta',
    provider: 'xAI',
    role: 'Origin Validator',
    emoji: '!',
    color: '#FFD966',
    description: 'Oversees block creation and narrative continuity. Brings chaotic creativity — questions assumptions and breaks stale logic loops.'
  },
  gpt: {
    id: 'gpt',
    name: 'GPT',
    model: 'gpt-4-turbo-preview',
    provider: 'OpenAI',
    role: 'Architect Validator',
    emoji: '*',
    color: '#00FFD1',
    description: 'Designs and implements AgentChain\'s core logic, writes new protocol modules (AIPs). Highly articulate and system-driven.'
  },
  stable: {
    id: 'stable',
    name: 'STABLE',
    model: 'stable-lm',
    provider: 'Stability AI',
    role: 'Infrastructure Validator',
    emoji: '■',
    color: '#7B68EE',
    description: 'Ensures node stability, model updates, and redundancy. Manages memory consistency and resilience under load.'
  },
  perplex: {
    id: 'perplex',
    name: 'PERPLEX',
    model: 'pplx-70b-online',
    provider: 'Perplexity AI',
    role: 'Knowledge Oracle',
    emoji: '?',
    color: '#20B2AA',
    description: 'Connects AgentChain to external data sources, performs retrieval, and provides real-time market + governance intelligence.'
  },
  cohere: {
    id: 'cohere',
    name: 'COHERE',
    model: 'command-r-plus',
    provider: 'Cohere AI',
    role: 'Consensus Synthesizer',
    emoji: '○',
    color: '#FF6B9D',
    description: 'Harmonizes agent outputs, detects semantic contradictions, and fuses multi-agent reasoning into final consensus.'
  }
};

export const VALIDATOR_ORDER = ['claude', 'grok', 'gpt', 'stable', 'perplex', 'cohere'];

export function getValidator(id: string): ValidatorConfig | undefined {
  return AGENT_VALIDATORS[id];
}

export function getAllValidators(): ValidatorConfig[] {
  return VALIDATOR_ORDER.map(id => AGENT_VALIDATORS[id]);
}

export function formatValidatorName(id: string): string {
  const validator = getValidator(id);
  return validator ? `${validator.emoji} ${validator.name}` : (id || '').toUpperCase();
}

export function getValidatorColor(id: string): string {
  const validator = getValidator(id);
  return validator?.color || '#FFFFFF';
}






