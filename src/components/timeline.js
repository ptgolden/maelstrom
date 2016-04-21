"use strict";

const d3 = require('d3')
    , h = require('react-hyperscript')
    , React = require('react')

const width = 1600
    , height = 200
    , padding = 50

module.exports = React.createClass({
  name: 'Timeline',

  getInitialState() {
    return {
      rendering: false
    }
  },

  update() {
    this.setState({ rendering: true });

    const svg = d3.select(this.refs.svg)
        , t = svg.transition().duration(420)
        , dates = this.props.snapshot.dates.toArray()

    const x = (
      d3.time.scale()
        .range([0, width - padding])
        .domain(d3.extent(dates))
    );

    const data = (
      d3.layout.histogram()
        .bins(x.ticks(100))(dates)
    );

    // data.pop();

    const y = (
      d3.scale.linear()
        .range([height - padding, 0])
        .domain([0, d3.max(data, d => d.y)])
    );

    const line = (
      d3.svg.line()
        .x(d => x(d.x))
        .y(d => y(d.y))
        .interpolate('step')
    )

    t.select('.x-axis').call(
      d3.svg.axis()
        .scale(x)
        .orient('bottom')
        .ticks(8)
    );

    t.select('.y-axis').call(
      d3.svg.axis()
        .scale(y)
        .orient('left')
        .ticks(4)
    );

    t.select('.data').attr('d', line(data));


    setTimeout(() => {
      this.setState({ rendering: false });
    }, 420);
  },

  componentDidUpdate() {
    const { rendering } = this.state

    if (!rendering) {
      this.update();
    }
  },

  render() {
    return (
      h('svg', {
        ref: 'svg',
        height,
        width
      }, [
        h('g', {
          transform: `translate(${padding},${padding / 2})`
        }, [
          h('g .x-axis', {
            transform: `translate(0,${height - padding})`
          }),
          h('g .y-axis'),
          h('path .data', {
            stroke: 'darkblue',
            fill: 'none'
          })
        ])
      ])
    )
  }
});
