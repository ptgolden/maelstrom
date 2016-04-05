"use strict";

var Immutable = require('immutable')

const AUTHORS_BY_MSG_ID = {}

const EMPTY_ITEM_MAP = Immutable.Map({ total: 0, trend: 0 })
    , inc = n => n + 1
    , incCounts = counts => counts.update('total', inc).update('trend', inc)
    , updateMapCounts = val => map => map.update(val, EMPTY_ITEM_MAP, incCounts)

const RE_REGEX = /re:\s+/i


const sortCountMap = map => map.sort((a, b) => {
  a = a.get('trend');
  b = b.get('trend');

  return a === b ? 0 : b > a ? 1 : -1;
})


module.exports = function addCommunication(communications, msg) {
  let author = msg.from[0].name
    , inReplyTo = (msg.inReplyTo || [{}])[0]
    , pair
    , subject

  AUTHORS_BY_MSG_ID[msg.messageId] = author;

  if (!inReplyTo) {
    pair = Immutable.Set([author]);
  } else {
    pair = Immutable.Set([author, AUTHORS_BY_MSG_ID[inReplyTo]]).sort();
  }

  subject = msg.subject.replace(RE_REGEX, '');

  return communications
    .update('pair', Immutable.Map(), updateMapCounts(pair))
    .update('author', Immutable.Map(), updateMapCounts(author))
    .update('subject', Immutable.Map(), updateMapCounts(subject))
    .map(sortCountMap)
}

