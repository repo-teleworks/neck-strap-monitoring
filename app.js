
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

setInterval(sendParcel, 1000);

http.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

socket.sockets.on('connection', function(socket){
    //socket.join(data.data.channel);
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
    socket.on('monitoring', function(data){
        if(data.type == 'command'){
            socket.emit('monitoring', {type: 'command', data: 'ACK'});
            console.log('monitoring client is connected.');
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
        var protocolMatch = serialInput.match(/^BB.AA.(\w*).(\w*).00.FF.FF.(\w*).(\w*).(\w*).00.(\w*).(\w*).CC.DD/);

        var payload = {
            sequence: protocolMatch[1],
            number: protocolMatch[2],
            sosSignal: protocolMatch[3],
            strapSignal: protocolMatch[4],
            srcNode: protocolMatch[5],
            srcRssi: protocolMatch[6],
            checksum: protocolMatch[7]
        };

        // Dump parsed data info.
        socket.sockets.in('parsing-serial').emit('developer', {type: 'serialParsingState', data: payload});

        if(!persons[payload.number]) persons[payload.number] = new aPerson(payload.number);
        persons[payload.number].newData(payload);
    });
});

function sendParcel() {
    /*
     * SOT - Start of Table
     * EOT - End   of Table
     */
    socket.sockets.emit('monitoring', {type: 'data', data: 'SOT'});
    for(var i in persons){
        socket.sockets.emit('monitoring', {type: 'data', data: persons[i]});
    }
    socket.sockets.emit('monitoring', {type: 'data', data: 'EOT'});

    console.log('periodic transfer : person list and status are transferred.');
}

/*
 * 전체 그룹 리스트
 */
var persons = new Array();

/*
 * 사람 한 명당 object
 *
 * - number : 고유 식별번호
 * - srcNode : 현재 속해 있는 중계기 번호
 * - srcRssi : 현재 속해 있는 중계기로부터 마지막으로 받은 RSSI Indicator
 *
 * - methode :
 *   - newData(payload) : 새로운 payload 입력에 대한 처리
 */
function aPerson(index) {
    this.number = index;
    this.srcNode = 0xFF;
    this.srcRssi = 0xFF;
    this.neckStrap = 0xFF;
    this.lastUpdated = new Date().getTime() + 32400000; // add + 9:00 (KST)
}

aPerson.prototype.newData = function(payload){
    //this.number = payload.number;
    if(payload.srcNode != 0) {
        if(this.srcRssi > payload.srcRssi) {
            /*
             * 장소 변경 발생 시,
             * RSSI 최신으로 업데이트
             * 현재 소속 중계기를 변경
             */
            this.srcRssi = payload.srcRssi;
            this.srcNode = payload.srcNode;
        } else {
            /*
             * 장소 변경이 없을 경우,
             * 현재 노드의 RSSI만을 업데이트
             */
            this.srcRssi = payload.srcRssi;
        }
        this.lastUpdated = new Date().getTime() + 32400000; // add + 9:00 (KST)
    }
    this.neckStrap = payload.strapSignal;
};