// Salesforce stays in the existing file/config graph; metadata connections are source-evidenced explicit edges.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { makeProject, run, readJson, readGraph, cleanup, lib } from './helpers.mjs';

const { classify } = await lib('common.mjs');
test('Salesforce Apex, Aura and Visualforce files are code, while XML metadata remains config', () => {
  for (const ext of ['cls', 'trigger']) assert.deepEqual(classify(`src/Example.${ext}`, 20), { category: 'code', lang: 'apex' });
  for (const ext of ['cmp', 'app', 'evt', 'intf', 'design', 'auradoc', 'tokens']) assert.deepEqual(classify(`src/Example.${ext}`, 20), { category: 'code', lang: 'aura' });
  for (const ext of ['page', 'component']) assert.deepEqual(classify(`src/Example.${ext}`, 20), { category: 'code', lang: 'visualforce' });
  assert.deepEqual(classify('force-app/main/default/objects/Order__c/fields/Account__c.field-meta.xml', 20), { category: 'config', lang: 'xml' });
  assert.deepEqual(classify('sfdx-project.json', 20), { category: 'config', lang: 'json' });
  assert.deepEqual(classify('src/server.js', 20), { category: 'code', lang: 'javascript' });
});

test('a local Salesforce project scans, builds and describes with metadata edges in the unchanged schema', () => {
  const base = 'force-app/main/default/';
  const cls = base + 'classes/Orders.cls';
  const field = base + 'objects/Order__c/fields/Account__c.field-meta.xml';
  const object = base + 'objects/Account__c/Account__c.object-meta.xml';
  const files = {
    'sfdx-project.json': JSON.stringify({ packageDirectories: [{ path: 'force-app' }] }),
    [cls]: 'public with sharing class Orders { public static void save() {} }',
    [base + 'triggers/Orders.trigger']: 'trigger Orders on Order__c (before insert) {}',
    [base + 'lwc/orders/orders.js']: "import { LightningElement } from 'lwc'; export default class Orders extends LightningElement {}",
    [base + 'lwc/orders/orders.html']: '<template>Orders</template>',
    [base + 'aura/Orders/Orders.cmp']: '<aura:component>Orders</aura:component>',
    [base + 'pages/Orders.page']: '<apex:page controller="Orders">Orders</apex:page>',
    [base + 'applications/Orders.app-meta.xml']: '<CustomApplication><tabs>Order__c</tabs></CustomApplication>',
    [base + 'flexipages/Orders.flexipage-meta.xml']: '<FlexiPage><masterLabel>Orders</masterLabel></FlexiPage>',
    [object]: '<CustomObject><label>Account</label></CustomObject>',
    [field]: '<CustomField><type>Lookup</type><referenceTo>Account__c</referenceTo></CustomField>',
    [base + 'objects/Order__c/validationRules/Required.validationRule-meta.xml']: '<ValidationRule><active>true</active><errorConditionFormula>Amount__c &lt; 0</errorConditionFormula></ValidationRule>',
    [base + 'flows/Orders.flow-meta.xml']: '<Flow><status>Draft</status></Flow>',
    [base + 'permissionsets/Orders.permissionset-meta.xml']: '<PermissionSet><label>Order access</label></PermissionSet>',
    [base + 'sharingRules/Order__c.sharingRules-meta.xml']: '<SharingRules/>',
    [base + 'namedCredentials/Billing.namedCredential-meta.xml']: '<NamedCredential><label>Billing</label></NamedCredential>',
  };
  const arch = {
    $schema: 'floorplan/architecture@1', project: { name: 'Local orders', summary: 'Source declarations only; org behavior unverified.' },
    include: ['code', 'config'],
    nodes: [{ id: 'orders', label: 'Orders', kind: 'feature', summary: 'Helps staff manage orders.', paths: ['**'] }],
    edges: [{ from: field, to: object, kind: 'data', label: 'Declared lookup', description: `${field}: referenceTo names Account__c; deployment unverified.` }],
  };
  const root = makeProject(files, { arch });
  try {
    run('scan.mjs', root);
    const scan = readJson(path.join(root, 'floorplan/.cache/scan.json'));
    assert.equal(scan.files.find((f) => f.path === cls).category, 'code');
    assert.deepEqual(scan.files.find((f) => f.path === cls).routes || [], [], 'Apex methods are not invented HTTP endpoints');
    run('build.mjs', root, '--no-claude-md');
    const graph = readGraph(root);
    assert.deepEqual(graph.files.map((f) => f.p).sort(), Object.keys(files).sort());
    assert.ok(graph.links.some((l) => l.a === `f:${field}` && l.b === `f:${object}` && l.k === 'data'));
    run('describe.mjs', root);
    const descriptions = readJson(path.join(root, 'floorplan/descriptions/orders.json'));
    assert.ok(JSON.stringify(descriptions).includes(cls));
    assert.ok(JSON.stringify(descriptions).includes(field));
  } finally { cleanup(root); }
});
