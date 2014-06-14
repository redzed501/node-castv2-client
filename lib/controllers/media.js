var util                      = require('util');
var debug                     = require('debug')('castv2-client');
var RequestResponseController = require('./request-response');

function MediaController(client, sourceId, destinationId) {
  RequestResponseController.call(this, client, sourceId, destinationId, 'urn:x-cast:com.google.cast.media');

  this.currentSession = null;

  this.on('message', onmessage);
  this.once('close', onclose);

  var self = this;

  function onmessage(data, broadcast) {
    if(data.type === 'MEDIA_STATUS' && broadcast) {
      var status = data.status[0];
      self.currentSession = status;
      self.emit('status', status);
    }
  }

  function onclose() {
    self.removeListener('message', onmessage);
    self.stop();
  }

}

util.inherits(MediaController, RequestResponseController);

MediaController.prototype.getStatus = function(callback) {
  var self = this;

  this.request({ type: 'GET_STATUS' }, function(err, response) {
    if(err) return callback(err);
    var status = response.status[0];
    self.currentSession = status;
    callback(null, status);
  });
};

MediaController.prototype.load = function(media, options, callback) {
  if(typeof options === 'function' || typeof options === 'undefined') {
    callback = options;
    options = {};
  }

  var data = { type: 'LOAD' };

  data.autoplay = (typeof options.autoplay !== 'undefined')
    ? options.autoplay
    : false;

  data.currentTime = (typeof options.currentTime !== 'undefined')
    ? options.currentTime
    : 0;

  data.media = media;

  this.request(data, function(err, response) {
    if(err) return callback(err);
    if(response.type === 'LOAD_FAILED') {
      return callback(new Error('Load failed'));
    }
    var status = response.status[0];
    callback(null, status);
  });
};

MediaController.prototype.sessionRequest = function(data, callback) {
  data.mediaSessionId = this.currentSession.mediaSessionId;

  this.request(data, function(err, response) {
    if(err) return callback(err);
    var status = response.status[0];
    callback(null, status);
  });
};

MediaController.prototype.play = function(callback) {
  this.sessionRequest({ type: 'PLAY' }, callback);
};

MediaController.prototype.pause = function(callback) {
  this.sessionRequest({ type: 'PAUSE' }, callback);
};

MediaController.prototype.stop = function(callback) {
  this.sessionRequest({ type: 'STOP' }, callback);
};

module.exports = MediaController;