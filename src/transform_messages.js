"use strict";

const through = require('through2')
    , Immutable = require('immutable')
    , { StreamState } = require('./records')


const REPLY_PATTERN = /re:\s+/i

const increment = n => n + 1


/* Functions for gathering message metadata */
const messageAuthor = msg => msg.from[0].name || msg.from[0].address

const messageMeasurements = ({ authorsByMsgID }, msg) => {
  const author = authorsByMsgID.get(msg.messageId)
      , repliedMessageID = (msg.inReplyTo || [])[0]
      , threadTitle = (msg.subject || 'no subject').replace(REPLY_PATTERN, '')

  const pair = repliedMessageID
    ? Immutable.Set([author, authorsByMsgID[repliedMessageID]]).sort()
    : Immutable.Set([author])

  return { pair, author, threadTitle }
}


/* Functions for updating the state */
const updateCounts = measurements => counts =>
  counts.map((countMap, attr) =>
    countMap.update(measurements[attr], 0, increment))

const decayTrendMap = ({ decayStep, lowerLimit }) => trends =>
  trends.map(trendMap =>
    trendMap
      .map(n =>
        n < lowerLimit
          ? 0
          : n < 10
            ? n - decayStep
            : 5 + 10 / n)
      .filter(n => n)
      .sort((a, b) => a === b ? 0 : b > a ? 1 : -1))

const updateStreamState = (_state, msg) => _state.withMutations(state =>
  state
    .update('authorsByMsgID', map => map.set(msg.messageId, messageAuthor(msg)))
    .update('snapshot', snapshot => {
      const measurements = messageMeasurements(state, msg)
          , currentDate = new Date(msg.headers.date)

      return snapshot
        .set('currentDate', currentDate)
        .update('numMessages', increment)
        .update('dates', dates => dates.push(currentDate))
        .update('counts', updateCounts(measurements))
        .update('trends', updateCounts(measurements))
        .update('trends', decayTrendMap(state))
    }))


module.exports = function () {
  let streamState = new StreamState();

  const stream = through.obj(function write(msg, enc, next) {
    if (msg.from) {
      streamState = updateStreamState(streamState, msg);

      // Only expose the snapshot to the stream consumer, even though we keep
      // more local state than that.
      this.push(streamState.snapshot);
    }

    next();
  });

  Object.defineProperty(stream, 'decayStep', {
    get: () => streamState.decayStep,
    set: value => {
      streamState = streamState.set('decayStep', value);
      return streamState.decayStep;
    }
  });

  return stream;
}
