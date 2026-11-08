'use strict';

// 'create-window' asks the caller to open the window now.
// null is the same absent reference BrowserWindow 'closed' and activate already use.
function windowRefAfterPermission(granted) {
  if (granted) return 'create-window';
  return null;
}

module.exports = {
  windowRefAfterPermission: windowRefAfterPermission
};
