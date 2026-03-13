import type { SavedEditorConfig } from '../state';
import demoResult from '../demo-agent-result.json';

export interface AgentMessage {
  role: 'user' | 'agent';
  text: string;
  image?: string;
  timestamp: number;
}

export type AgentEvent =
  | { type: 'status'; text: string }
  | { type: 'question'; text: string }
  | { type: 'result'; config: SavedEditorConfig };

export interface AgentService {
  sendPrompt(text: string, image?: string): AsyncGenerator<AgentEvent, void, unknown>;
}

const STATUS_PHASES = [
  'Analyzing your request...',
  'Understanding layout requirements...',
  'Identifying required components...',
  'Selecting component configurations...',
  'Mapping data flows between components...',
  'Configuring click actions and messaging...',
  'Applying styles and spacing...',
  'Running final validation checks...',
  'Finalizing portal layout...',
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

class DemoAgentService implements AgentService {
  async *sendPrompt(_text: string, _image?: string): AsyncGenerator<AgentEvent, void, unknown> {
    const totalDuration = 90_000 + Math.random() * 30_000;
    const phaseInterval = totalDuration / STATUS_PHASES.length;

    for (const phase of STATUS_PHASES) {
      yield { type: 'status', text: phase };
      await sleep(phaseInterval);
    }

    yield {
      type: 'result',
      config: demoResult as unknown as SavedEditorConfig,
    };
  }
}

export function createAgentService(mode: 'demo' | 'live' = 'demo'): AgentService {
  if (mode === 'live') {
    // Future: return new LiveAgentService(...)
    throw new Error('Live agent not yet implemented');
  }
  return new DemoAgentService();
}
