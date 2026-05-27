import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('ontology travel bridge panel is registered in the full UI', () => {
  const panels = readFileSync('src/config/panels.ts', 'utf8');
  const layout = readFileSync('src/app/panel-layout.ts', 'utf8');
  const barrel = readFileSync('src/components/index.ts', 'utf8');

  assert.match(panels, /'ontology-travel-bridge': \{ name: '01ontology Travel Bridge', enabled: true/);
  assert.match(layout, /OntologyTravelBridgePanel/);
  assert.match(layout, /createPanel\('ontology-travel-bridge', \(\) => new OntologyTravelBridgePanel\(\)\)/);
  assert.match(barrel, /OntologyTravelBridgePanel/);
});

test('ontology travel bridge panel checks the local dev bridge endpoint', () => {
  const panel = readFileSync('src/components/OntologyTravelBridgePanel.ts', 'utf8');
  const viteConfig = readFileSync('vite.config.ts', 'utf8');

  assert.match(panel, /\/api\/ontology\/travel-bridge-status/);
  assert.match(panel, /scripts\/export-travel-snapshot\.mjs --city Munich/);
  assert.match(panel, /scripts\/stage_worldmonitor_travel_snapshot\.py/);
  assert.match(viteConfig, /ontologyTravelBridgeDevPlugin/);
  assert.match(viteConfig, /ONTOLOGY_REPO_ROOT/);
  assert.match(viteConfig, /ontology\/travel\.ttl/);
});
