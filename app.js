'use strict';
const express = require('express'), 
      http    = require('http'), 
      socket  = require('./routes/socket.js'), 
      app     = express(), 
      server  = http.createServer(app), 
      io      = require('socket.io').listen(server);

app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.set('port', process.env.PORT || 3000);
io.sockets.on('connection', socket);
server.listen(app.get('port'), () => {
  console.log('Express server listening on port %d', app.get('port'));
});
module.exports = app;
