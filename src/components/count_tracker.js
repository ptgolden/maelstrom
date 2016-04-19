"use strict";

var h = require('react-hyperscript')
  , React = require('react')
  , Immutable = require('immutable')
  , CountTracker

const keyFor = value => (
  value instanceof Immutable.Iterable ?
    value.hashCode() :
    value
);

CountTracker = ({ trendMap, countMap, renderValue, limit=25 }) => (
  h('div', (
    trendMap
      .toKeyedSeq()
      .map((trend, value) => (
        h('div .px1 .truncate', {
          key: keyFor(value),
          style: {
            paddingTop: 3,
            paddingBottom: 3,
            background: `rgba(255, 40, 40, ${trend / 8})`
          }
        }, [
          h('span .inline-block .bold .border-box', {
            style: {
              width: 42,
              textAlign: 'right',
              paddingRight: 8
            }
          }, countMap.get(value)),

          renderValue ? renderValue(value) : value
        ])
      ))
      .take(limit)
      .toArray()
  ))
);

CountTracker.propTypes = {
  countMap: React.PropTypes.instanceOf(Immutable.Map),
  renderValue: React.PropTypes.func,
  limit: React.PropTypes.number
}

module.exports = CountTracker;

