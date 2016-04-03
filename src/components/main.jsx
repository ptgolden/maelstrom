"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , http = require('http')
  , mboxParser = require('mbox-stream')()

const AUTHORS_BY_MSG_ID = {}

var communications = Immutable.OrderedMap()


var ct = 0;


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

  return communicationsMap.update(pair, 0, v => v + 1)
}

module.exports = React.createClass({
  displayName: 'Main',

  propTypes: {
  },

  getInitialState() {
    return {
      numMessages: 0,
      communications
    }
  },

  componentDidMount() {
    var updateState = () => this.setState({
      communications,
      numMessages: communications.reduce((acc, ct) => acc + ct, 0)
    });

    http.get('./public-whatwg-archive.mbox', res => res.pipe(mboxParser));

    mboxParser.on('data', msg => {
      if (!msg.from) return;

      communications = addCommunication(communications, msg);

      if (communications.size % 5 === 0) {
        mboxParser.pause();
        setTimeout(() => mboxParser.resume(), 40);
        updateState();
      }
    });

    mboxParser.on('end', updateState);
  },

  render() {
    var { numMessages, communications } = this.state
      , sortedCommunications

    sortedCommunications = communications
      .sort((a, b) => a === b ? 0 : b > a ? 1 : -1)
      .toKeyedSeq()
      .map((ct, pair) => (
        <tr key={ pair.hashCode() }>
          <td>{ ct }</td>
          <td>{ pair.getIn([0, 'name']) }</td>
          <td>{ pair.getIn([1, 'name']) || "(nobody)" }</td>
        </tr>
      ))

    return (
      <div>
        <h2>{ numMessages } messages</h2>
        <div className="m3 flex" style={{ justifyContent: "space-between" }}>
          <table>
            <thead>
              <tr>
                <th>Count</th>
                <th>From</th>
                <th>To</th>
              </tr>
            </thead>
            <tbody>
              { sortedCommunications.take(25).toArray() }
            </tbody>
          </table>

          <table className="bg-green">
            <thead>
              <tr>
                <th>Count</th>
                <th>From</th>
                <th>To</th>
              </tr>
            </thead>
            <tbody>
              { sortedCommunications.skip(25).take(25).toArray() }
            </tbody>
          </table>

          <table>
            <thead>
              <tr>
                <th>Count</th>
                <th>From</th>
                <th>To</th>
              </tr>
            </thead>
            <tbody>
              { sortedCommunications.skip(50).take(25).toArray() }
            </tbody>
          </table>

        </div>
      </div>
    )
  }
});
