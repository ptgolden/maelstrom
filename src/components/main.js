"use strict";

var React = require('react')
  , h = require('react-hyperscript')

module.exports = React.createClass({
  displayName: 'Main',

  getInitialState() {
    return {
      mboxStream: null
    }
  },

  handleClickUpload() {
    this.refs.upload.dispatchEvent(new MouseEvent('click'));
  },

  handleUploadFile(e) {
    var fileReaderStream = require('filereader-stream')
      , file = e.target.files[0]

    this.setState({ mboxStream: fileReaderStream(file) });
  },

  render() {
    var Stream = require('./stream')
      , { mboxStream } = this.state

    return (
      h('div', [
        mboxStream
          ? h(Stream, { mboxStream })
          : h('div', [
              h('p', [
                h('button .btn .btn-primary', {
                  onClick: this.handleClickUpload
                }, 'choose mail archive')
              ]),

              h('input .absolute', {
                type: 'file',
                ref: 'upload',
                onChange: this.handleUploadFile,
                style: { top: -1000 }
              })
            ])
      ])
    )
  },
});
