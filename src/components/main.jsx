"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , http = require('http')
  , mboxParser = require('mbox-stream')()

const AUTHORS_BY_MSG_ID = {}

function addCommunication(communicationsMap, msg) {
  let author = Immutable.fromJS(msg.from[0])
    , inReplyTo = (msg.inReplyTo || [])[0]
    , pair

  AUTHORS_BY_MSG_ID[msg.messageId] = author;

  if (!inReplyTo) {
    pair = Immutable.List([author, Math.random()]);
  } else {
    pair = Immutable.List([author, AUTHORS_BY_MSG_ID[inReplyTo]]);
  }

  return communicationsMap.update(
    pair,
    Immutable.Map({ total: 0, trend: 0 }),
    v => v.update('total', n => n + 1).update('trend', n => n + 1))
}

module.exports = React.createClass({
  displayName: 'Main',

  propTypes: {
  },

  getInitialState() {
    return {
      numMessages: 0,
      communications: null,
    }
  },

  componentDidMount() {
    var communications = Immutable.OrderedMap()
      , currentDate = null
      , numMessages = 0
      , updateState


    updateState = () => this.setState({
      communications,
      currentDate: new Date(currentDate),
      numMessages
    });

    http.get('./public-whatwg-archive.mbox', res => res.pipe(mboxParser));

    mboxParser.on('data', msg => {
      if (!msg.from) return;

      communications = addCommunication(communications, msg);

      numMessages += 1;
      currentDate = msg.headers.date;

      if (numMessages % 4 === 0) {
        mboxParser.pause();
        setTimeout(() => mboxParser.resume(), 50);
        updateState();
      }

      if (numMessages % 16 === 0) {
        communications = communications.map(counts => (
          counts.update('trend', n => n <= 1 ? 0 : n - 1)
        ));
      }

    });

    mboxParser.on('end', updateState);
  },

  render() {
    var { numMessages, communications, currentDate } = this.state
      , sortedCommunications

    sortedCommunications = (communications || Immutable.OrderedMap())
      .sort((a, b) => {
        a = a.get('total');
        b = b.get('total');

        return a === b ? 0 : b > a ? 1 : -1
      })
      .toKeyedSeq()
      .map((ct, pair) => (
        <div key={ pair.hashCode() } className="px1" style={{
          background: `rgba(40, 255, 40, ${ct.get('trend') / 8})`
        }}>
          <span className="inline-block bold border-box" style={{
            width: 42,
            textAlign: 'right',
            paddingRight: 8
          }}>{ ct.get('total') }</span>
          { pair.getIn([0, 'name']) }
          {" ➝ "}
          { pair.getIn([1, 'name']) || "(nobody)" }
        </div>
      ))

    return (
      <div>
        <h2>{ numMessages } messages</h2>
        <h2>{ currentDate && currentDate.toISOString().split('T')[0] }</h2>
        {
          [0, 25, 50].map(skip =>
            <div
                key={skip}
                className="left border-box px1"
                style={{ width: '33%' }}>
              { sortedCommunications.skip(skip).take(25).toArray() }
            </div>
          )
        }
      </div>
    )
  }
});
