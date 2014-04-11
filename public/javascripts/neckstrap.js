/*
 * 안전모 jQuery / Ajax script for client browser
 */

var serverUrl = 'http://192.168.1.81:8080';
var socket = io.connect(serverUrl);

$(document).ready(function() {

});

function onReceiveDeveloper(data){
    if(data.type == 'command') {
        console.log(data.data);
    } else if(data.type == 'serialDump') {
        onSerialDump(data.data);
    } else if(data.type == 'serialParsingState') {
        onParsingDump(data.data);
    }
}

/*
 * Serial Debugging Modal
 */

$("#serialDebug").on('show.bs.modal', function() {
    /* events related on socket.io */
    socket.emit('developer', {type: 'command',data: {command:'join', channel:'raw-serial'}});
    socket.on('developer', onReceiveDeveloper);
});

$("#serialDebug").on('hide.bs.modal', function() {
    socket.emit('developer', {type: 'command',data: {command:'leave', channel:'raw-serial'}});
    socket.removeListener('developer', onReceiveDeveloper);
    $("#serialDumpContents").text('');
});

$("#scrollLock").click( function(){
    setScrollLock();
});

function onSerialDump(serial){
    $("#serialDumpContents").append("<li>"+ serial +"</li>");
    setScrollLock();

}

function setScrollLock(){
    if($("#scrollLock").prop('checked')){
        $("#serialDumpContents").scrollTop($("#serialDumpContents")[0].scrollHeight);
    }
}

/*
 * Parsing Debugging Modal
 */

$("#parsingDebug").on('show.bs.modal', function() {
    /* events related on socket.io */
    socket.emit('developer', {type: 'command',data: {command:'join', channel:'parsing-serial'}});
    socket.on('developer', onReceiveDeveloper);
});

$("#parsingDebug").on('hide.bs.modal', function() {
    socket.emit('developer', {type: 'command',data: {command:'leave', channel:'parsing-serial'}});
    socket.removeListener('developer', onReceiveDeveloper);
    $("#parsingDumpContents").text('');
});

$("#scrollLockParsing").click( function(){
    setParsingScrollLock();
});

function onParsingDump(data){
    $("#parsingDumpContents").append("<li> Seq: " + data.sequence + " | Number: " +
        data.number + " | CheckSum: " + data.checksum + "</li>");
    setParsingScrollLock();
}

function setParsingScrollLock(){
    if($("#scrollLockParsing").prop('checked')){
        $("#parsingDumpContents").scrollTop($("#parsingDumpContents")[0].scrollHeight);
    }
}

/*
 * Debug Settings
 */

