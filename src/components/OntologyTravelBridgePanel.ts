import { Panel } from './Panel';
import { h, replaceChildren } from '@/utils/dom-utils';

type BridgeFileStatus = {
  path: string;
  present: boolean;
};

type BridgeStatus = {
  connected: boolean;
  city: string;
  pack: string;
  ontologyRoot: string;
  worldmonitorRoot: string;
  ontologyFiles: BridgeFileStatus[];
  worldmonitorFiles: BridgeFileStatus[];
  commands: {
    exportSnapshot: string;
    stageSnapshot: string;
  };
  boundary: string;
};

const FALLBACK_STATUS: BridgeStatus = {
  connected: false,
  city: 'Munich',
  pack: 'travel',
  ontologyRoot: '../01ontology',
  worldmonitorRoot: '.',
  ontologyFiles: [
    { path: 'ontology/travel.ttl', present: false },
    { path: 'packs/travel/manifest.yaml', present: false },
    { path: 'scripts/stage_worldmonitor_travel_snapshot.py', present: false },
    { path: 'src/onto_kernel/bridge/worldmonitor_travel.py', present: false },
  ],
  worldmonitorFiles: [
    { path: 'scripts/export-travel-snapshot.mjs', present: false },
  ],
  commands: {
    exportSnapshot: 'node scripts/export-travel-snapshot.mjs --city Munich --output /tmp/munich-worldmonitor-snapshot.json',
    stageSnapshot: 'uv run python scripts/stage_worldmonitor_travel_snapshot.py --input /tmp/munich-worldmonitor-snapshot.json --city Munich --tenant-id travel-demo',
  },
  boundary: 'WorldMonitor owns live scraping/cache/export; 01ontology owns raw staging, review, promotion, evidence, and lineage.',
};

export class OntologyTravelBridgePanel extends Panel {
  private status: BridgeStatus | null = null;
  private fetchFailed = false;

  constructor() {
    super({
      id: 'ontology-travel-bridge',
      title: '01ontology Travel Bridge',
      className: 'panel-wide',
      showCount: false,
      infoTooltip: 'Local integration status for the Munich travel snapshot bridge into 01ontology.',
    });
    void this.refresh();
  }

  public async refresh(): Promise<void> {
    this.showLoading('Checking 01ontology bridge...');
    try {
      const response = await fetch('/api/ontology/travel-bridge-status', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5_000),
      });
      const payload = await response.json() as BridgeStatus;
      this.status = payload;
      this.fetchFailed = false;
    } catch {
      this.status = FALLBACK_STATUS;
      this.fetchFailed = true;
    }
    this.render();
  }

  protected render(): void {
    const status = this.status ?? FALLBACK_STATUS;
    const files = [...status.worldmonitorFiles, ...status.ontologyFiles];
    const presentCount = files.filter(file => file.present).length;
    const totalCount = files.length;
    const connected = status.connected && !this.fetchFailed;
    const stateLabel = connected ? 'Connected locally' : 'Local bridge not fully visible';
    const stateClass = connected ? 'otb-status-good' : 'otb-status-warn';

    replaceChildren(this.content,
      h('div', { className: 'ontology-travel-bridge-panel' },
        h('div', { className: 'otb-summary-row' },
          h('div', { className: `otb-status-pill ${stateClass}` }, stateLabel),
          h('div', { className: 'otb-count' }, `${presentCount}/${totalCount} bridge files found`),
        ),
        h('div', { className: 'otb-grid' },
          this.metric('City', status.city),
          this.metric('Ontology pack', status.pack),
          this.metric('Live layer', 'WorldMonitor export'),
          this.metric('Slow layer', '01ontology staging'),
        ),
        h('div', { className: 'otb-boundary' }, status.boundary),
        h('div', { className: 'otb-section' },
          h('div', { className: 'otb-section-title' }, 'Pipeline'),
          h('ol', { className: 'otb-steps' },
            h('li', null, 'Export Munich travel/news/event signals from WorldMonitor.'),
            h('li', null, 'Stage the snapshot into 01ontology raw ingest as reviewable candidates.'),
            h('li', null, 'Promote only curated objects, claims, evidence, and lineage.'),
          ),
        ),
        h('div', { className: 'otb-section' },
          h('div', { className: 'otb-section-title' }, 'Commands'),
          this.commandBlock(status.commands.exportSnapshot),
          this.commandBlock(status.commands.stageSnapshot),
        ),
        h('div', { className: 'otb-section' },
          h('div', { className: 'otb-section-title' }, 'Bridge files'),
          h('div', { className: 'otb-file-list' }, ...files.map(file => this.fileRow(file))),
        ),
        h('button', {
          type: 'button',
          className: 'otb-refresh-btn',
          onClick: () => { void this.refresh(); },
        }, 'Refresh bridge status'),
      ),
    );
  }

  private metric(label: string, value: string): HTMLElement {
    return h('div', { className: 'otb-metric' },
      h('span', { className: 'otb-metric-label' }, label),
      h('span', { className: 'otb-metric-value' }, value),
    );
  }

  private commandBlock(command: string): HTMLElement {
    return h('code', { className: 'otb-command' }, command);
  }

  private fileRow(file: BridgeFileStatus): HTMLElement {
    return h('div', { className: `otb-file-row ${file.present ? 'present' : 'missing'}` },
      h('span', { className: 'otb-file-dot' }, file.present ? 'OK' : '--'),
      h('span', { className: 'otb-file-path' }, file.path),
    );
  }
}
