/*
 * 안전모 jQuery / Ajax script for client browser
 */

var serverUrl = ':8080';
var socket = io.connect(serverUrl);

var memberList = [];

/*
 * View mode = ALL, A, B, C
 */
var viewMode = 'ALL';

function modeChange(mode) {
    viewMode = mode;
    $('#memberListTable').html("");
    printMemberList(memberList, mode);

    switch(viewMode){
        case 'ALL': $("#pageTitle").html("전부 보기");
            break;
        case 'A': $("#pageTitle").html("건설현장 A");
            break;
        case 'B': $("#pageTitle").html("건설현장 B");
            break;
        case 'C': $("#pageTitle").html("건설현장 C");
            break;
    }
}

$(document).ready(function() {
    socket.emit('monitoring', {type:'command', data:'REQ'});
    socket.on('monitoring', onReceiveMonitoring);
});

function onReceiveMonitoring(data){
    if(data.type == 'data') {
        if(data.data == 'SOT') {
            /*
             * refresh 전송 시
             * 리스트를 초기화 한다.
             */
            memberList = [];
        } else if(data.data == 'EOT'){
            /*
             * End of Table
             * 테이블을 새로 갱신한다.
             */
            $('#memberListTable').html("");
            printMemberList(memberList, viewMode);
        } else {
            /*
             * Member 데이터 수신
             * Array에 push
             */
            memberList.push(data.data);
        }
    }
}

function printMemberList(memberList, mode){
    if(mode == 'ALL'){
        for(var i in memberList){
            printEachMember(memberList[i]);
        }
    } else {
        for(var i in memberList){
            if(mode == getMemberLocation(memberList[i].srcNode)) {
                printEachMember(memberList[i]);
            }
        }
    }
}

function printEachMember(aMember){
    $('#memberListTable').append("<tr>" +
        "<td>" + aMember.number + "</td>" +
        "<td>" + getMemberName(aMember.number) + "</td>" +
        "<td>" + setDecorationMemberLocation(getMemberLocation(aMember.srcNode)) + "</td>" +
        "<td>" + setDecorationNeckStrap(aMember.neckStrap) + "</td>" +
        "<td>" + setDecorationLastUpdate(aMember.lastUpdated) + "</td>" +
        "</tr>");
}

function getMemberName(number) {
    if(number == '05') return '조종식';
    else if(number == '06') return '서영광';
    else if(number == '07') return '홍건수';
    else if(number == '08') return '박상현';
    else if(number == '09') return '유인숙';
    else return 'Unknown';
}

function getMemberLocation(srcNode) {
    if(srcNode == '02') return 'A';
    if(srcNode == '03') return 'B';
    if(srcNode == '04') return 'C';
    if(srcNode == 255) return 255;
}

function setDecorationMemberLocation(srcNode){
    if(srcNode == 'A') return '<span style="color:green;">A</span>';
    if(srcNode == 'B') return '<span style="color:blue;">B</span>';
    if(srcNode == 'C') return '<span style="color:cadetblue;">C</span>';
    if(srcNode == 255) return '<span style="color:red;">Unknown</span>';
}

function setDecorationLastUpdate(lastUpdated) {
    var lastUpdatedDeco = new Date(lastUpdated);
    var currntTime = new Date();
    var warningLevel = '<span style="color:black;">';
    if (currntTime-lastUpdatedDeco > 30 * 1000) {
        warningLevel = '<span style="color:red;">';
    } else if (currntTime-lastUpdatedDeco > 15 * 1000) {
        warningLevel = '<span style="color:darkred;">';
    }

    return warningLevel +
        lastUpdatedDeco.toISOString().replace(/T/, ' ').replace(/\..+/, '') +
        "</span>";

}

function setDecorationNeckStrap(neckStrap) {
    if (neckStrap == '01') {
        return '<span class="glyphicon glyphicon-ok strap-yes"></span>'
    } else if (neckStrap == '00'){
        return '<span class="glyphicon glyphicon-remove strap-no"></span>'
    } else {
        return '<span class="glyphicon glyphicon-question-sign strap-no"></span>'
    }
}

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
        data.number + " | CheckSum: " + data.checksum + " | From : " + data.srcNode +
        " | RSSI : " + data.srcRssi + "</li>");
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

