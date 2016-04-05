"use strict";

var React = require('react')
  , Immutable = require('immutable')

module.exports = React.createClass({
  displayName: 'Main',

  propTypes: {
  },

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
    var Stream = require('./stream.jsx')
      , { mboxStream } = this.state

    return (
      <div>
        <h1>maelstrom</h1>

        {
          !mboxStream && (
            <div>
              <p>
                <button
                    className="btn btn-primary"
                    onClick={this.handleClickUpload}>
                  upload mail archive
                </button>
              </p>

              <input
                  type="file"
                  ref="upload"
                  onChange={this.handleUploadFile}
                  style={{ position: 'absolute', top: -1000 }} />
            </div>
          )
        }

        {
          mboxStream && (
            <Stream mboxStream={mboxStream} />
          )
        }
      </div>
    )
  }
});
