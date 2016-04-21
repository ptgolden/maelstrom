"use strict";

const Immutable = require('immutable')

const Snapshot = Immutable.Record({
  numMessages: 0,
  currentDate: null,
  dates: Immutable.List(),
  counts: Immutable.fromJS({ pair: {}, author: {}, threadTitle: {} }),
  trends: Immutable.fromJS({ pair: {}, author: {}, threadTitle: {} })
});


const StreamState = Immutable.Record({
  snapshot: new Snapshot(),
  authorsByMsgID: Immutable.Map(),
  decayStep: .16,
  lowerLimit: .5
});

module.exports = { Snapshot, StreamState }
