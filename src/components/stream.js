"use strict";

const React = require('react')
    , h = require('react-hyperscript')


module.exports = React.createClass({
  displayName: 'Stream',

  propTypes: {
    mboxStream: React.PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      stepSize: 1,
      msgStreamPause: 200,
      paused: false,

      snapshot: null,
    }
  },

  componentDidMount() {
    let currentSnapshot

    const { mboxStream } = this.props
        , updateState = () => this.setState({ snapshot: currentSnapshot })

    mboxStream.on('data', snapshot => {
      const { msgStreamPause, stepSize } = this.state;

      currentSnapshot = snapshot;

      if (snapshot.numMessages % stepSize === 0) {
        mboxStream.pause();

        setTimeout(() => {
          if (!this.state.paused) mboxStream.resume()
        }, msgStreamPause)

        updateState();
      }
    });

    mboxStream.on('end', updateState);
  },

  toggleStream() {
    const { mboxStream } = this.props
        , { paused } = this.state

    if (paused) {
      mboxStream.resume();
      this.setState({ paused: false });
    } else {
      mboxStream.pause();
      this.setState({ paused: true });
    }
  },

  render() {
    const Table = require('./table')
        , Timeline = require('./timeline')
        , { mboxStream } = this.props
        , { paused, stepSize, msgStreamPause, snapshot } = this.state

    return (
      h('div', [
        h('div', [
          h('button', {
            onClick: this.toggleStream
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

        snapshot && h('div .clearfix', [
          h('h2 .left', `${snapshot.numMessages} messages`),
          h('h2 .right', `
            Last message at:
            ${snapshot.currentDate && snapshot.currentDate.toISOString().split('T')[0]}
          `)
        ]),

        h('hr'),

        snapshot && h(Timeline, { snapshot }),

        h('hr'),

        h('div', [
          h('label .ml1', [
            'Rate of decay',
            h('input', {
              type: 'range',
              value: mboxStream.decayStep,
              onChange: e => {
                mboxStream.decayStep = parseFloat(e.target.value)
              },
              min: .02,
              max: 1,
              step: .05
            })
          ])
       ]),

        snapshot && h(Table, { snapshot })
    ])
    )
  }

});
