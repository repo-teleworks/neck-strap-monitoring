
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var path = require('path');
var SerialPort = require('serialport').SerialPort;
var app = express();
var http = require('http').createServer(app);
var socket = require('socket.io').listen(http);

/*
SerialPort.list(function (err, ports) {
    ports.forEach(function(port) {
        console.log(port.comName);
    });
});
*/

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);


http.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

socket.sockets.on('connection', function(socket){
    socket.on('developer', function(data){
        if(data.type == 'command'){
            if(data.data.command == 'join') {
                socket.emit('developer', {type: 'command', data: 'ACK'});
                socket.join(data.data.channel);
            } else if (data.data.command == 'leave'){
                socket.emit('developer', {type: 'command', data: 'ACK'});
                socket.leave(data.data.channel);
            }
        }
    });
});

var serialPort = new SerialPort("/dev/tty.SLAB_USBtoUART", {
    baudrate : 115200
}, false);

serialPort.open(function () {
    console.log('open');


    serialPort.on('data', function(data) {
        // Dump raw serial ...
        socket.sockets.in('raw-serial').emit('developer', {type: 'serialDump', data: data.toString()});

        // Serial Data parsing
        var serialInput = data.toString();
        var protocolMatch = serialInput.match(/^BB.AA.(\w*).(\w*).00.FF.FF.00.00.00.00.00.(\w*).CC.DD/);

        var payload = {
            sequence: protocolMatch[1],
            number: protocolMatch[2],
            checksum: protocolMatch[3]
        };

        // Dump parsed data info.
        socket.sockets.in('parsing-serial').emit('developer', {type: 'serialParsingState', data: payload});
        //console.log(payload);
    });
});