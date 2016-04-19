"use strict";

const Immutable = require('immutable')

const AUTHORS_BY_MSG_ID = {}
    , RE_REGEX = /re:\s+/i

module.exports = msg => {
  const author = msg.from[0].name || msg.from[0].address
      , inReplyTo = (msg.inReplyTo || [{}])[0]
      , subject = (msg.subject || '(no_subject)').replace(RE_REGEX, '')

  AUTHORS_BY_MSG_ID[msg.messageId] = author

  const pair = inReplyTo
    ? Immutable.Set([author, AUTHORS_BY_MSG_ID[inReplyTo]]).sort()
    : Immutable.Set([author])

  return { pair, author, subject }
}
