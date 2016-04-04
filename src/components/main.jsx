"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , http = require('http')

const AUTHORS_BY_MSG_ID = {}

function addCommunication(communicationsMap, msg) {
  let author = msg.from[0].name
    , inReplyTo = (msg.inReplyTo || [{}])[0]
    , pair

  AUTHORS_BY_MSG_ID[msg.messageId] = author;

  if (!inReplyTo) {
    pair = Immutable.Set([author]);
  } else {
    pair = Immutable.Set([author, AUTHORS_BY_MSG_ID[inReplyTo]]).sort();
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
      paused: false,
      mboxParserStream: require('mbox-stream')(),
      mboxConsumed: false,

      numMessages: 0,
      currentDate: null,
      communications: null,
    }
  },

  componentDidMount() {
    var { mboxParserStream } = this.state
      , communications = Immutable.OrderedMap()
      , currentDate = null
      , numMessages = 0


    http.get('./public-whatwg-archive.mbox', res => res.pipe(mboxParserStream));

    mboxParserStream.on('data', msg => {
      if (!msg.from) return;

      communications = addCommunication(communications, msg);

      numMessages += 1;
      currentDate = msg.headers.date;

      if (numMessages % 1 === 0) {
        mboxParserStream.pause();

        setTimeout(() => {
          if (!this.state.paused) mboxParserStream.resume();
        }, 25)

        this.setState({
          numMessages,
          currentDate: new Date(currentDate)
        });
      }

      communications = communications.map(counts => (
        counts.update('trend', n => {
          if (n < .8) return 0;
          if (n > 10) return 5 + 10 / n;
          return n - .03;
        })
      ));

      this.setState({ communications });
    });

    mboxParserStream.on('end', () => this.setState({ communications }));
  },

  handlePause() {
    var { paused, mboxParserStream } = this.state

    if (paused) {
      mboxParserStream.resume();
      this.setState({ paused: false });
    } else {
      mboxParserStream.pause();
      this.setState({ paused: true });
    }
  },

  render() {
    var { numMessages, communications, currentDate, paused } = this.state
      , sortedCommunications

    sortedCommunications = (communications || Immutable.OrderedMap())
      .sort((a, b) => {
        a = a.get('trend');
        b = b.get('trend');

        return a === b ? 0 : b > a ? 1 : -1
      })
      .toKeyedSeq()
      .filter(ct => ct.get('trend') > 0)
      .map((ct, pair) => (
        <div key={ pair.hashCode() } className="px1" style={{
          background: `rgba(255, 40, 40, ${ct.get('trend') / 8})`
        }}>
          <span className="inline-block bold border-box" style={{
            width: 42,
            textAlign: 'right',
            paddingRight: 8
          }}>{ ct.get('total') }</span>
          { pair.toArray()[0] }
          {", "}
          { pair.toArray()[1] || "(nobody)" }
        </div>
      ))

    return (
      <div>
        <p>
          <button onClick={this.handlePause}>
            { paused ? 'Resume' : 'Pause' }
          </button>
        </p>
        <h2>{ numMessages } messages</h2>
        <h2>{ currentDate && currentDate.toISOString().split('T')[0] }</h2>
          <div
              className="left border-box px1"
              style={{ width: '33%' }}>
            { sortedCommunications.take(25).toArray() }
          </div>
      </div>
    )
  }
});
