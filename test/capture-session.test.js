const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const sessionApi = require('../capture-session.js');

const { createCaptureSession, takeSilentDisplay } = sessionApi;

function fakeStream(kinds) {
  const tracks = kinds.map(function (kind) {
    return {
      kind: kind,
      stopped: false,
      stop: function () { this.stopped = true; }
    };
  });
  return {
    tracks: tracks,
    getTracks: function () { return this.tracks; },
    getAudioTracks: function () { return this.tracks.filter(function (track) { return track.kind === 'audio'; }); },
    getVideoTracks: function () { return this.tracks.filter(function (track) { return track.kind === 'video'; }); }
  };
}

function audioStopped(stream) {
  return stream.getAudioTracks().every(function (track) { return track.stopped; });
}

test('a second start while a capture is in flight does not take ownership', function () {
  const session = createCaptureSession();
  const first = session.begin({ replaceLive: false });
  const second = session.begin({ replaceLive: false });
  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'busy');

  const stream = fakeStream(['audio', 'video']);
  assert.equal(session.adopt(first.token, { enabled: true, stream: stream }), true);
  assert.equal(audioStopped(stream), false);
  assert.equal(session.current().stream, stream);

  const rejected = fakeStream(['audio']);
  assert.equal(session.adopt(999, { enabled: true, stream: rejected }), false);
  assert.equal(audioStopped(rejected), true);
  assert.equal(session.current().stream, stream);
});

test('start leaves a live capture running', function () {
  const session = createCaptureSession();
  const begun = session.begin({ replaceLive: false });
  const stream = fakeStream(['audio', 'video']);
  session.adopt(begun.token, { enabled: true, stream: stream });
  session.finish(begun.token);

  const again = session.begin({ replaceLive: false });
  assert.equal(again.ok, false);
  assert.equal(again.reason, 'live');
  assert.equal(audioStopped(stream), false);
  assert.equal(session.current().stream, stream);
});

test('replacing a live capture stops the previous audio tracks and keeps the new ones', function () {
  const session = createCaptureSession();
  const first = session.begin({ replaceLive: false });
  const previous = fakeStream(['audio', 'video']);
  session.adopt(first.token, { enabled: true, stream: previous });
  session.finish(first.token);

  const replacement = session.begin({ replaceLive: true });
  assert.equal(replacement.ok, true);
  assert.equal(session.current().stream, previous);
  assert.equal(audioStopped(previous), false);

  const next = fakeStream(['audio', 'video']);
  assert.equal(session.adopt(replacement.token, { enabled: true, stream: next }), true);
  assert.equal(audioStopped(previous), true);
  assert.equal(previous.getVideoTracks()[0].stopped, true);
  assert.equal(audioStopped(next), false);
  assert.equal(session.current().stream, next);
});

test('cancelling a replacement leaves the previous capture running', function () {
  const session = createCaptureSession();
  const first = session.begin({ replaceLive: false });
  const previous = fakeStream(['audio']);
  session.adopt(first.token, { enabled: true, stream: previous });
  session.finish(first.token);

  const replacement = session.begin({ replaceLive: true });
  session.finish(replacement.token);
  assert.equal(session.current().stream, previous);
  assert.equal(audioStopped(previous), false);

  const retry = session.begin({ replaceLive: false });
  assert.equal(retry.ok, false);
  assert.equal(retry.reason, 'live');
});

test('a failed capture can be retried and a stale failure cannot clear the retry', function () {
  const session = createCaptureSession();
  const failedAttempt = session.begin({ replaceLive: false });
  const failedStream = fakeStream(['audio']);
  const failed = {
    enabled: false,
    stream: failedStream,
    stop: function () { sessionApi.stopStream(this.stream); }
  };
  session.adopt(failedAttempt.token, failed);
  assert.equal(session.drop(failedAttempt.token), true);
  session.finish(failedAttempt.token);
  assert.equal(session.current(), null);
  assert.equal(audioStopped(failedStream), true);

  const retry = session.begin({ replaceLive: false });
  assert.equal(retry.ok, true);
  assert.notEqual(retry.token, failedAttempt.token);
  const live = fakeStream(['audio']);
  session.adopt(retry.token, { enabled: true, stream: live });
  assert.equal(session.drop(failedAttempt.token), false);
  assert.equal(session.current().stream, live);
  assert.equal(audioStopped(live), false);
});

test('a stale finish does not release the capture that replaced it', function () {
  const session = createCaptureSession();
  const first = session.begin({ replaceLive: false });
  session.finish(first.token);
  const second = session.begin({ replaceLive: false });
  session.finish(first.token);
  const third = session.begin({ replaceLive: false });
  assert.equal(third.ok, false);
  assert.equal(third.reason, 'busy');
  assert.equal(second.ok, true);
});

test('a display stream with no audio track is stopped, including video', function () {
  const silent = fakeStream(['video']);
  assert.equal(takeSilentDisplay(silent), true);
  assert.equal(silent.getVideoTracks()[0].stopped, true);

  const audible = fakeStream(['audio', 'video']);
  assert.equal(takeSilentDisplay(audible), false);
  assert.equal(audioStopped(audible), false);
  assert.equal(audible.getVideoTracks()[0].stopped, false);
});

test('sketch and index wire the session around start and test', function () {
  const root = path.join(__dirname, '..');
  const sketch = fs.readFileSync(path.join(root, 'sketch.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  assert.match(sketch, /capture\.begin\(\{ replaceLive: false \}\)/);
  assert.match(sketch, /capture\.begin\(\{ replaceLive: true \}\)/);
  assert.match(sketch, /CaptureSession\.takeSilentDisplay/);
  assert.match(sketch, /capture\.drop\(token\)/);
  assert.match(sketch, /next\.start\([\s\S]*settle\(true\)/);
  assert.doesNotMatch(sketch, /if\s*\(\s*!mic\s*\)/);

  const sessionAt = html.indexOf('src="capture-session.js"');
  const sketchAt = html.indexOf('src="sketch.js"');
  assert.ok(sessionAt !== -1 && sketchAt !== -1 && sessionAt < sketchAt);
});
