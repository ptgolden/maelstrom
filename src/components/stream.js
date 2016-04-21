"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , h = require('react-hyperscript')
  , { MailParser } = require('mbox-stream/node_modules/mailparser')


module.exports = React.createClass({
  displayName: 'Stream',

  propTypes: {
    // mboxStream: React.PropTypes
  },

  getInitialState() {
    return {
      paused: true,
      mboxParserStream: require('mbox-stream')({
        mailparser: new MailParser({ streamAttachments: true })
      }),
      mboxConsumed: false,

      decayStep: .16,
      trendinessThreshhold: .5,
      msgStreamPause: 200,
      stepSize: 1,

      numMessages: 0,
      currentDate: null,
      communications: null,
      dates: null,
    }
  },

  componentDidMount() {
    var processMessage = require('../process_message')
      , { mboxStream } = this.props
      , { mboxParserStream } = this.state
      , counts = Immutable.OrderedMap()
      , trends = Immutable.OrderedMap()
      , dates = Immutable.List()
      , currentDate = null
      , numMessages = 0

    const internalState = () => ({
      numMessages,
      currentDate,
      counts,
      trends,
      dates
    });

    ['pair', 'author', 'subject'].forEach(attr => {
      counts = counts.set(attr, Immutable.Map());
      trends = trends.set(attr, Immutable.OrderedMap());
    });

    const increment = n => n + 1;

    mboxStream.pipe(mboxParserStream);

    mboxParserStream.pause();

    mboxParserStream.on('data', msg => {
      if (!msg.from) return;

      const data = processMessage(msg);

      const { msgStreamPause, stepSize } = this.state;

      ['pair', 'author', 'subject'].forEach(attr => {
        const val = data[attr];

        counts = counts.updateIn([attr, val], 0, increment);
        trends = trends.updateIn([attr, val], 0, increment);
      });

      numMessages += 1;

      currentDate = new Date(msg.headers.date);
      dates = dates.push(currentDate);

      // Decay the trend map, remove now-empty entries, and re-sort
      trends = trends.map(this.decayTrendMap);

      if (numMessages % stepSize === 0) {
        mboxParserStream.pause();

        setTimeout(() => {
          if (!this.state.paused) mboxParserStream.resume();
        }, msgStreamPause)

        this.setState(internalState());
      }
    });

    mboxParserStream.on('end', () => this.setState(internalState()));
  },

  decayTrendMap(trendMap) {
    const { decayStep, trendinessThreshhold } = this.state

    return trendMap
      .map(n =>
        n < trendinessThreshhold
          ? 0
          : n < 10
            ? n - decayStep
            : 5 + 10 / n
      )
      .filter(n => n)
      .sort((a, b) => a === b ? 0 : b > a ? 1 : -1)
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
    var Table = require('./table')
      , Timeline = require('./timeline')
      , {
        trends,
        counts,
        numMessages,
        currentDate,
        paused,

        dates,
        decayStep,
        stepSize,
        msgStreamPause
      } = this.state

    return (
      h('div', [
        h('div', [
          h('button', {
            onClick: this.handlePause
          }, paused ? 'Resume' : 'Pause'),

          h('label .ml1', [
            'Step size ',
            h('input', {
              type: 'number',
              value: stepSize,
              onChange: e => this.setState({ stepSize: e.target.value }),
              min: 1,
              max: 25
            })
          ]),

          h('label .ml1', [
            'Rate of decay',
            h('input', {
              type: 'range',
              value: decayStep,
              onChange: e => this.setState({ decayStep: e.target.value }),
              min: .02,
              max: 1,
              step: .05
            })
          ]),

          h('label .ml1', [
            'Speed',
            h('input', {
              type: 'range',
              value: 420 - msgStreamPause,
              onChange: e => this.setState({ msgStreamPause: 420 - parseInt(e.target.value) }),
              min: 0,
              max: 420
            })
          ])
        ]),

        h('hr'),

        h('div .clearfix', [
          h('h2 .left', `${numMessages} messages`),
          h('h2 .right', `
            Last message at:
            ${currentDate && currentDate.toISOString().split('T')[0]}
          `)
        ]),

        h('hr'),

        dates && h(Timeline, { dates }),

        h('hr'),

        numMessages && h(Table, { trends, counts })
    ])
    )
  }

});
