/* MotionAstra CEP transport v2.8.1.
 * Host files load by absolute path; all replies are tagged and request-correlated.
 * Empty callbacks recover the stored reply, NEVER replay the host mutation.
 */
(function (root) {
  'use strict';
  const VERSION = '2.8.1';
  const BUILD = '2.8.1';
  const PREFIX = 'MAFX1:';
  const ERROR_PREFIX = 'MAFX1E:';
  const available = !!root.__adobe_cep__;
  let client = null;
  let ready = false;
  let serial = 0;
  let queue = Promise.resolve();

  function error(message) { return new Error('MotionAstra: ' + message); }
  function decode(raw) {
    if (typeof raw !== 'string' || !raw.trim() || /^(undefined|null)$/i.test(raw.trim())) {
      throw error('AE returned an empty reply.');
    }
    if (raw.indexOf(ERROR_PREFIX) === 0) {
      throw error(decodeURIComponent(raw.slice(ERROR_PREFIX.length)));
    }
    if (raw.indexOf(PREFIX) !== 0) {
      throw error('Invalid CEP reply: ' + raw.slice(0, 160));
    }
    let response;
    try { response = JSON.parse(decodeURIComponent(raw.slice(PREFIX.length))); }
    catch (_) { throw error('AE returned a damaged reply. Restart AE and reopen this panel.'); }
    if (!response || typeof response !== 'object' || typeof response.ok !== 'boolean') {
      throw error('AE returned an invalid response object.');
    }
    if (!response.ok) throw error(response.message || 'Host operation failed.');
    return response;
  }

  function evaluate(source) {
    return new Promise((resolve, reject) => {
      try { client.evalScript(source, resolve); }
      catch (e) { reject(error('CEP could not evaluate the host script: ' + e.message)); }
    });
  }

  function wrap(body, requestId) {
    // The final return is deliberately OUTSIDE try/catch/finally for ExtendScript.
    return '(function(){var wire;try{' + body +
      'if(typeof output!=="string"||!output.length)throw Error("Host dispatcher returned no response.");' +
      'wire="MAFX1:"+encodeURIComponent(output);' +
      '}catch(e){wire="MAFX1E:"+encodeURIComponent(String(e)+" (line "+e.line+")");}' +
      '$.global.__MotionAstraLastReply={id:' + JSON.stringify(requestId) + ',wire:wire};' +
      'return wire;}())';
  }

  async function send(body) {
    const id = 'ma_' + Date.now() + '_' + (++serial);
    let raw = await evaluate(wrap(body, id));
    // If CEP lost the completion value, read the reply already stored in the host.
    // A single queue keeps this slot from being overwritten by our status polling.
    if (typeof raw !== 'string' || !raw.trim() || /^(undefined|null|EvalScript error\.)$/i.test(raw.trim())) {
      const stored = await evaluate(
        '(function(){var r=$.global.__MotionAstraLastReply;return r&&r.id===' +
        JSON.stringify(id) + '?r.wire:"MAFX_MISSING_REPLY";}())'
      );
      if (typeof stored !== 'string' || stored.indexOf('MAFX1') !== 0) {
        throw error('No confirmed response from AE. The action was not retried. Check the timeline before applying again; restart AE if needed.');
      }
      raw = stored;
    }
    return decode(raw);
  }

  async function initialize() {
    if (ready) return;
    if (!available) throw error('Browser preview only. Open this panel inside After Effects.');
    if (!client) {
      try { client = new root.CSInterface(); }
      catch (e) { throw error('CEP initialization failed. Restart AE and reopen the panel. ' + e.message); }
    }
    let path;
    try { path = client.getSystemPath(root.SystemPath.EXTENSION); }
    catch (e) { throw error('Cannot resolve the installed extension folder: ' + e.message); }
    if (typeof path !== 'string' || !path) throw error('The installed extension folder is empty.');
    path = path.replace(/\\/g, '/').replace(/\/$/, '');
    const version = JSON.stringify(VERSION);
    await send(
      'var host=$.global.MotionAstra;' +
      'if(!host||host.version!==' + version + '||host.build!==' + JSON.stringify(BUILD) + '||typeof host.dispatch!=="function"){' +
      'var data=File(' + JSON.stringify(path + '/jsx/presets-data.jsx') + ');' +
      'var script=File(' + JSON.stringify(path + '/jsx/hostscript.jsx') + ');' +
      'if(!data.exists)throw Error("Missing presets-data.jsx. Install the complete folder.");' +
      'if(!script.exists)throw Error("Missing host.jsx. Install the complete folder.");' +
      '$.evalFile(data);$.evalFile(script);host=$.global.MotionAstra;' +
      'if(!host||host.version!==' + version + '||host.build!==' + JSON.stringify(BUILD) + '||typeof host.dispatch!=="function")' +
      'throw Error("Host initialization failed or an old host is still installed.");}' +
      'var output=host.dispatch(' + JSON.stringify(encodeURIComponent('{"action":"status"}')) + ');'
    );
    ready = true;
  }

  function call(payload) {
    // Every call, including selection polling, shares this queue.
    const task = queue.then(async () => {
      await initialize();
      const argument = JSON.stringify(encodeURIComponent(JSON.stringify(payload)));
      return send('if(!$.global.MotionAstra)throw Error("Host is not loaded. Restart the panel.");' +
        'var output=$.global.MotionAstra.dispatch(' + argument + ');');
    });
    queue = task.catch(() => {});
    return task;
  }

  root.MotionAstraBridge = { call, isAvailable: () => available, isReady: () => ready, version: VERSION };
}(window));
