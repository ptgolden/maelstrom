"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , { MailParser } = require('mbox-stream/node_modules/mailparser')


module.exports = React.createClass({
  displayName: 'Stream',

  propTypes: {
    // mboxStream: React.PropTypes
  },

  getInitialState() {
    return {
      paused: false,
      mboxParserStream: require('mbox-stream')({
        mailparser: new MailParser({ streamAttachments: true })
      }),
      mboxConsumed: false,

      decayStep: .16,
      trendinessThreshhold: .5,
      msgStreamPause: 50,

      numMessages: 0,
      currentDate: null,
      communications: null,
    }
  },

  componentDidMount() {
    var addCommunication = require('../add_communication')
      , { mboxStream } = this.props
      , { mboxParserStream, decayStep, msgStreamPause, trendinessThreshhold } = this.state
      , communications = Immutable.OrderedMap()
      , currentDate = null
      , numMessages = 0


    mboxStream.pipe(mboxParserStream);

    // http.get('./public-whatwg-archive.mbox', res => res.pipe(mboxParserStream));

    mboxParserStream.on('data', msg => {
      if (!msg.from) return;

      communications = addCommunication(communications, msg);

      numMessages += 1;
      currentDate = msg.headers.date;

      if (numMessages % 1 === 0) {
        mboxParserStream.pause();

        setTimeout(() => {
          if (!this.state.paused) mboxParserStream.resume();
        }, msgStreamPause)

        this.setState({
          numMessages,
          currentDate: new Date(currentDate)
        });
      }

      communications = communications
        .map(countMaps => countMaps.map(counts => (
          counts.update('trend', n => {
            if (n < trendinessThreshhold) return 0;
            if (n > 10) return 5 + 10 / n;
            return n - decayStep;
          })
        )));

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
    var CountTracker = require('./count_tracker.jsx')
      , { numMessages, communications, currentDate, paused } = this.state

    return (
      <div>
        <p>
          <button onClick={this.handlePause}>
            { paused ? 'Resume' : 'Pause' }
          </button>
        </p>
        <h2>{ numMessages } messages</h2>
        <h2>{ currentDate && currentDate.toISOString().split('T')[0] }</h2>

        {
          communications && (
            <div>
              <div className="left border-box px1" style={{ width: '33%' }}>
                <h3 className="m0 mb1">Authors</h3>
                <CountTracker countMap={communications.get('author')} />
              </div>

              <div className="left border-box px1" style={{ width: '33%' }}>
                <h3 className="m0 mb1">Subjects</h3>
                <CountTracker countMap={communications.get('subject')} />
              </div>

              <div className="left border-box px1" style={{ width: '33%' }}>
                <h3 className="m0 mb1">Communication pairs</h3>
                <CountTracker
                    countMap={communications.get('pair')}
                    renderValue={pair => (
                      <span>
                        { pair.toArray()[0] }
                        {", "}
                        { pair.toArray()[1] || "(nobody)" }
                      </span>
                    )} />
              </div>
            </div>
          )
        }
      </div>
    )
  }
});
