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
      dates: null,
    }
  },

  componentDidMount() {
    var addCommunication = require('../add_communication')
      , { mboxStream } = this.props
      , { mboxParserStream } = this.state
      , communications = Immutable.OrderedMap()
      , dates = Immutable.List()
      , currentDate = null
      , numMessages = 0


    mboxStream.pipe(mboxParserStream);

    // http.get('./public-whatwg-archive.mbox', res => res.pipe(mboxParserStream));

    mboxParserStream.on('data', msg => {
      if (!msg.from) return;

      var { decayStep, msgStreamPause, trendinessThreshhold } = this.state

      communications = addCommunication(communications, msg);

      numMessages += 1;
      currentDate = new Date(msg.headers.date);

      dates = dates.push(currentDate);

      if (numMessages % 1 === 0) {
        mboxParserStream.pause();

        setTimeout(() => {
          if (!this.state.paused) mboxParserStream.resume();
        }, msgStreamPause)

        this.setState({ numMessages, currentDate });
      }

      communications = communications
        .map(countMaps => countMaps.map(counts => (
          counts.update('trend', n => {
            if (n < trendinessThreshhold) return 0;
            if (n > 10) return 5 + 10 / n;
            return n - decayStep;
          })
        )));

      this.setState({ communications, dates });
    });

    mboxParserStream.on('end', () => this.setState({ communications, dates }));
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
    var CountTracker = require('./count_tracker')
      , Timeline = require('./timeline')
      , {
        communications,
        numMessages,
        currentDate,
        paused,

        dates,
        decayStep,
        msgStreamPause
      } = this.state

    return (
      h('div', [
        h('div', [
          h('button', {
            onClick: this.handlePause
          }, paused ? 'Resume' : 'Pause'),

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

        communications && h('div .clearfix', [
          h('div .left .border-box .px1', {
            style: {
              width: '33%'
            },
          }, [
            h('h3 .m0 .mb1', 'Authors'),
            h(CountTracker, {
              countMap: communications.get('author')
            })
          ]),

          h('div .left .border-box .px1', {
            style: {
              width: '33%'
            },
          }, [
            h('h3 .m0 .mb1', 'Subjects'),
            h(CountTracker, {
              countMap: communications.get('subject')
            })
          ]),

          h('div.left.border-box.px1', {
            style: {
              width: '33%'
            },
          }, [
            h('h3 .m0 .mb1', 'Communication pairs'),
            h(CountTracker, {
              countMap: communications.get('pair'),
              renderValue: pair => h('span', [
                pair.toArray()[0],
                ', ',
                pair.toArray()[1] || "(nobody)"
              ])
            })
          ])
        ])
    ])
    )
  }

});
