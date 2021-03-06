// Copyright 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Custom binding for the Display Source API.

var binding = require('binding').Binding.create('displaySource');
var chrome = requireNative('chrome').GetChrome();
var lastError = require('lastError');
var natives = requireNative('display_source');
var logging = requireNative('logging');

var callbacksInfo = {};

function callbackWrapper(callback, method, message) {
  if (callback == undefined)
    return;

  try {
    if (message !== null)
      lastError.set(method, message, null, chrome);
    callback();
  } finally {
    lastError.clear(chrome);
  }
}

function callCompletionCallback(callbackId, error_message) {
  try {
    var callbackInfo = callbacksInfo[callbackId];
    logging.DCHECK(callbackInfo != null);
    callbackWrapper(callbackInfo.callback, callbackInfo.method, error_message);
  } finally {
    delete callbacksInfo[callbackId];
  }
}

binding.registerCustomHook(function(bindingsAPI, extensionId) {
  var apiFunctions = bindingsAPI.apiFunctions;
  apiFunctions.setHandleRequest(
      'startSession', function(sessionInfo, callback) {
        try {
          var callId = natives.StartSession(sessionInfo);
          callbacksInfo[callId] = {
            callback: callback,
            method: 'displaySource.startSession'
          };
        } catch (e) {
          callbackWrapper(callback, 'displaySource.startSession', e.message);
        }
      });
  apiFunctions.setHandleRequest(
      'terminateSession', function(sink_id, callback) {
        try {
          var callId = natives.TerminateSession(sink_id);
          callbacksInfo[callId] = {
            callback: callback,
            method: 'displaySource.terminateSession'
          };
        } catch (e) {
          callbackWrapper(
              callback, 'displaySource.terminateSession', e.message);
        }
      });
});

exports.$set('binding', binding.generate());
// Called by C++.
exports.$set('callCompletionCallback', callCompletionCallback);
