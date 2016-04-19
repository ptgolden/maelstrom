"use strict";

var h = require('react-hyperscript')
  , CountTracker = require('./count_tracker')

module.exports = ({ trends, counts }) => (
  h('div .clearfix', [
    h('div .left .border-box .px1', {
      style: {
        width: '33%'
      },
    }, [
      h('h3 .m0 .mb1', 'Authors'),
      h(CountTracker, {
        trendMap: trends.get('author'),
        countMap: counts.get('author')
      })
    ]),

    h('div .left .border-box .px1', {
      style: {
        width: '33%'
      },
    }, [
      h('h3 .m0 .mb1', 'Subjects'),
      h(CountTracker, {
        trendMap: trends.get('subject'),
        countMap: counts.get('subject')
      })
    ]),

    h('div.left.border-box.px1', {
      style: {
        width: '33%'
      },
    }, [
      h('h3 .m0 .mb1', 'Communication pairs'),
      h(CountTracker, {
        trendMap: trends.get('pair'),
        countMap: counts.get('pair'),
        renderValue: pair => h('span', [
          pair.toArray()[0],
          ', ',
          pair.toArray()[1] || "(nobody)"
        ])
      })
    ])
  ])
);
