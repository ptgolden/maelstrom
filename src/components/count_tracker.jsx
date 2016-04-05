"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , CountTracker

const keyFor = value => (
  value instanceof Immutable.Iterable ?
    value.hashCode() :
    value
);

CountTracker = ({ countMap, renderValue, limit=25 }) => (
  <div>
    {
      countMap
        .toKeyedSeq()
        .filter(counts => counts.get('trend') > 0)
        .map((counts, value) => (
          <div
            key={keyFor(value)}
            className="px1 truncate"
            style={{
              paddingTop: 3,
              paddingBottom: 3,
              background: `rgba(255, 40, 40, ${counts.get('trend') / 8})`
            }}>

            <span className="inline-block bold border-box" style={{
              width: 42,
              textAlign: 'right',
              paddingRight: 8
            }}>{ counts.get('total') }</span>

            { renderValue ? renderValue(value) : value }
          </div>
        ))
        .take(limit)
        .toArray()
    }
  </div>
)

CountTracker.propTypes = {
  countMap: React.PropTypes.instanceOf(Immutable.Map),
  renderValue: React.PropTypes.func,
  limit: React.PropTypes.number
}

module.exports = CountTracker;

