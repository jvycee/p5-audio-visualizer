const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { windowRefAfterPermission } = require('../shell-state.js');

function applyPermission(granted) {
  const outcome = windowRefAfterPermission(granted);
  if (outcome === 'create-window') return { action: 'create' };
  return { action: 'absent', ref: outcome };
}

// activate creates a window only from the null reference written by 'closed'.
function activate(ref) {
  return ref === null ? 'create' : 'leave';
}

test('a granted prompt still creates the window immediately', function () {
  assert.equal(windowRefAfterPermission(true), 'create-window');
  assert.deepEqual(applyPermission(true), { action: 'create' });
});

test('a denied prompt stores the absent reference activate already reopens', function () {
  assert.equal(windowRefAfterPermission(false), null);
  const denied = applyPermission(false);
  assert.equal(denied.action, 'absent');
  assert.equal(denied.ref, null);
  assert.equal(activate(denied.ref), 'create');
  assert.equal(activate(undefined), 'leave');
});

test('a rejected prompt uses the same absent reference', function () {
  assert.equal(windowRefAfterPermission(false), null);
  assert.equal(activate(windowRefAfterPermission(false)), 'create');
});

test('an open window is not recreated by activate', function () {
  assert.equal(activate({ closed: false }), 'leave');
});

test('main.js wires denial and rejection through the helper and keeps activate on null', function () {
  const main = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(main, /windowRefAfterPermission\(granted\)/);
  assert.match(main, /mainWindow = outcome/);
  assert.match(main, /mainWindow = windowRefAfterPermission\(false\)/);
  assert.match(main, /if \(mainWindow === null\) createWindow\(\)/);
  assert.match(main, /if \(process\.platform !== 'darwin'\) app\.quit\(\)/);
  assert.match(main, /nodeIntegration: true/);
  assert.match(main, /contextIsolation: false/);
  assert.match(main, /\} else \{\s*createWindow\(\);\s*\}/);
});
