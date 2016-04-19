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
              h('h1', 'maelstrom'),

              h('p', [
                h('button .btn .btn-primary', {
                  onClick: this.handleClickUpload
                }, 'choose mail archive')
              ]),

              h('p', `
                All processing of mail files is  done on your own computer.
                No files will be uploaded to a remote server.
              `),

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
