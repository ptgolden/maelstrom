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
      msgStreamPause: 200,

      numMessages: 0,
      currentDate: null,
      communications: null,
    }
  },

  componentDidMount() {
    var addCommunication = require('../add_communication')
      , { mboxStream } = this.props
      , { mboxParserStream } = this.state
      , communications = Immutable.OrderedMap()
      , currentDate = null
      , numMessages = 0


    mboxStream.pipe(mboxParserStream);

    // http.get('./public-whatwg-archive.mbox', res => res.pipe(mboxParserStream));

    mboxParserStream.on('data', msg => {
      if (!msg.from) return;

      var { decayStep, msgStreamPause, trendinessThreshhold } = this.state

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
      , {
        communications,
        numMessages,
        currentDate,
        paused,

        decayStep,
        msgStreamPause
      } = this.state

    return (
      <div>
        <div>
          <button onClick={this.handlePause}>
            { paused ? 'Resume' : 'Pause' }
          </button>

          <label className="ml1">
            Rate of decay
            <input
                type="range"
                value={decayStep}
                onChange={ e => this.setState({ decayStep: e.target.value })}
                min=".02"
                max="1"
                step=".05" />
          </label>

          <label className="ml1">
            Speed
            <input
                type="range"
                value={420 - msgStreamPause}
                onChange={ e => this.setState({ msgStreamPause: 420 - parseInt(e.target.value) })}
                min="0"
                max="420"
                />
          </label>

        </div>

        <hr />

        <div className="clearfix">
          <h2 className="left">{ numMessages } messages</h2>
          <h2 className="right">Last message at: { currentDate && currentDate.toISOString().split('T')[0] }</h2>
        </div>

        <hr />

        {
          communications && (
            <div className="clearfix">
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
