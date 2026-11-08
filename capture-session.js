(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.CaptureSession = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function stopStream(stream) {
    if (!stream || typeof stream.getTracks !== 'function') return;
    let tracks;
    try {
      tracks = stream.getTracks();
    } catch (err) {
      return;
    }
    if (!tracks || typeof tracks.forEach !== 'function') return;
    tracks.forEach(function (track) {
      if (track && typeof track.stop === 'function') {
        try {
          track.stop();
        } catch (err) {
          // An ended track can throw. Later tracks on this stream still need stop().
        }
      }
    });
  }

  function releaseHandle(handle) {
    if (!handle) return;
    if (typeof handle.stop === 'function') {
      try {
        handle.stop();
      } catch (err) {
        // p5.AudioIn.stop is best-effort when its graph was never connected.
      }
    }
    if (handle.stream) stopStream(handle.stream);
  }

  // True when the display stream cannot feed the visualizer. Stops every track,
  // including video, so a silent share is not left running.
  function takeSilentDisplay(stream) {
    let audio = null;
    try {
      if (stream && typeof stream.getAudioTracks === 'function') {
        audio = stream.getAudioTracks();
      }
    } catch (err) {
      audio = null;
    }
    if (!audio || typeof audio.length !== 'number' || audio.length === 0) {
      stopStream(stream);
      return true;
    }
    return false;
  }

  function createCaptureSession() {
    let token = 0;
    let busy = false;
    let handle = null;

    function begin(options) {
      const replaceLive = Boolean(options && options.replaceLive);
      if (busy) return { ok: false, reason: 'busy' };
      const live = Boolean(handle && handle.enabled);
      if (live && !replaceLive) return { ok: false, reason: 'live' };
      token += 1;
      busy = true;
      if (!live) {
        const previous = handle;
        handle = null;
        releaseHandle(previous);
      }
      return { ok: true, token: token };
    }

    function isCurrent(claimed) {
      return claimed === token;
    }

    function current() {
      return handle;
    }

    function adopt(claimed, next) {
      if (claimed !== token) {
        releaseHandle(next);
        return false;
      }
      const previous = handle;
      handle = next;
      if (previous && previous !== next && (!next || previous.stream !== next.stream)) {
        releaseHandle(previous);
      }
      return true;
    }

    function drop(claimed) {
      if (claimed !== token) return false;
      const previous = handle;
      handle = null;
      releaseHandle(previous);
      return true;
    }

    function finish(claimed) {
      if (claimed === token) busy = false;
    }

    return {
      begin: begin,
      isCurrent: isCurrent,
      current: current,
      adopt: adopt,
      drop: drop,
      finish: finish
    };
  }

  return {
    createCaptureSession: createCaptureSession,
    stopStream: stopStream,
    releaseHandle: releaseHandle,
    takeSilentDisplay: takeSilentDisplay
  };
});
