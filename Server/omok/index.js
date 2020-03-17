// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var bodyParser = require('body-parser')

app.set('port', 5000);
app.use(bodyParser.json());
app.use('/static', express.static(__dirname + '/static')); // Routing


app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
}); // Starts the server.

app.get('/agent_test', function (request, response) {
    response.sendFile(path.join(__dirname, 'index_test.html'));
}); // Starts the server.


server.listen(5000, function () {
    console.log('Starting server on port 5000');
});

var agents = {} 
var observers = {}

// 현재 게임상태 (2인용으로 만듬 확장할 예정)
var game = {
    is_start : false,
    agentA : null,
    agentB : null,
    board : [],
    version : uuidv4(),
    gameover : false
}


// x*x크기의 오목판 생성
function map_create(x){
    // 빈칸 : 0
    // 흑돌 : 1
    // 백돌 : 2
    var mtmp = []
    for(var i=0;i<x;i++){
        var t = []
        for(var j=0;j<x;j++){
            t.push(0)
        }
        mtmp.push(t)
    }
    console.log(x+'x'+x+' 오목판 생성')
    return mtmp
}

// 올바른 작동을 위한 버전 코드생성
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Agent 클래스
function Agent() {
    this.name = '';
    this.ab = ''
}
// Observer 클래스
function Observer() {
    
}

// observer 통신
var observe = io
    .of('/observe')
    .on('connection', function (socket) {
        console.log('observer의 접속', socket.id)
        observers[socket.id] = new Observer()
        
        var game_status = {
            is_start: game.is_start,
            board: game.board,
            version: game.version,
            gameover: game.gameover
        }
        
        // 현재상태 전송으로 초기화
        socket.emit('observer_init', game_status)
    })

// agent 통신
var agent = io
    .of('/agent')
    .on('connection', function (socket) {
        console.log('agent의 접속 '+ socket.id)
        agents[socket.id] = new Agent()
        
        socket.on('ready', function(data){
            if(game.agentA === null){
                game.agentA = socket.id
                console.log('흑돌 접속'+ socket.id)
            }
            else if(game.agentB === null){
                game.agentB = socket.id
                console.log('백돌 접속'+ socket.id)
                console.log('게임시작')
                
                game.is_start = true
                game.board = map_create(10)
                
                var game_status = {
                    is_start: game.is_start,
                    board: game.board,
                    version: game.version,
                    gameover: false
                }
                
                observe.emit('update', game_status)
                agent.to(`${game.agentA}`).emit('game_wait', game_status)
            }
            else{
                console.log('접속자 초과! (2/2)')
                socket.disconnect()
            }
        })
        
        socket.on('game_next', function (data) {
            console.log(data)
            
            var ab = ''
            if (game.agentA == socket.id) {ab = 'A'}
            else if (game.agentB == socket.id) {ab = 'B'}
            else {console.log('비정상 접근', socket.id)} 
            
            if (game.gameover) {
                console.log('이미 종료된 게임')
                return
            }
            
            if (data.version == game.version){
                if (validation(data.x, data.y)) {
                    var chack = gameover_chack(game.board) // 게임상태 체크
                    console.log(chack)
                    game.version = uuidv4()
                    
                    if (chack == 'N') { // 게임 진행
                        game.board[data.y][data.x] = (ab == 'A' ? 1 : 2)
                        var game_status = {
                            is_start: game.is_start,
                            board: game.board,
                            version: game.version,
                            gameover: game.gameover
                        }

                        observe.emit('update', game_status)

                        var next_agent = (ab == 'A' ? game.agentB : game.agentA)
                        agent.to(`${next_agent}`).emit('game_wait', game_status)
                    }
                    else if (chack == 'D') { // 무승부
                        console.log('무승부')
                        
                        game.gameover = true
                        
                        var game_status = {
                            is_start: true,
                            board: game.board,
                            version: game.version,
                            gameover: game.gameover,
                            is_draw: null
                        }
                        agent.emit('game_wait', game_status)
                        
                        
                        var gameover_status = {
                            board: game.board,
                            version: game.version,
                            gameover: chack
                        }
                        // 로그와 분석을 보내줄 예정
                        observe.emit('gameover', gameover_status)
                    }
                    else {
                        console.log('게임오버 : Agent-'+chack+' 승리')
                        
                        game.gameover = true
                        
                        var game_status = {
                            is_start: true,
                            board: game.board,
                            version: game.version,
                            gameover: game.gameover,
                            is_win: null
                        }
                        
                        var win_agnet = (chack == 'A' ? game.agentA : game.agentB)
                        game_status.is_win = true
                        agent.to(`${win_agnet}`).emit('game_wait', game_status)
                        
                        
                        var lose_agent = (chack == 'A' ? game.agentB : game.agentA)
                        game_status.is_win = false
                        agent.to(`${lose_agent}`).emit('game_wait', game_status)
                        
                        
                        var gameover_status = {
                            board: game.board,
                            version: game.version,
                            gameover: chack
                        }
                        // 로그와 분석을 보내줄 예정
                        observe.emit('gameover', gameover_status)
                    }
                }
                else {console.log('Agent-'+ab+' 유효한 명령이 아님')}
            }
            else {console.log('Agent-'+ab+' 버전 맞지않음')}
            
        })
        
        socket.on('disconnect', function() {
            console.log('접속 해제 '+ socket.id)
            if (game.agentA == socket.id) {
                game.agentA = null
            }else if (game.agentB == socket.id) {
                game.agentB = null
            }
            
            // 둘다 연결이 끊킬시 초기화
            if (game.agentA == null && game.agentB == null) {
                game.gameover = false
                console.log('게임 초기화')
            }
            delete agents[socket.id]
            delete observers[socket.id]
        });
        
    });

// 유효성 체크
function validation(x, y) {
    return true
}
// 게임오버 감지
function gameover_chack(board) {
    if (iswin(10, board, 1)){
        return 'A'
    }else if (iswin(10, board, 2)){
        return 'B'
    }else if (isdraw(10, board)){
        return 'D'
    }
    return 'N'
}
// 무승부감지
// board_width, board
function isdraw (bw, board) {
    
    for (var i=0; i<bw; i++) {
        for (var j=0;j<bw;j++) {
            if (board[i][j] == 0){
                return false;
            }
        }
    }
    return true
}
// 승리 감지
// board_width, board, player_label
function iswin (bw, board, pl) {
    // -
    for (var y=0;y<bw;y++) {
        for (var x=0;x<bw-4;x++) {
            if (board[y][x] == pl && board[y][x+1] == pl && board[y][x+2] == pl && board[y][x+3] == pl && board[y][x+4] == pl) {
                return true
            }
        }   
    }
    
    // |
    for (var y=0;y<bw-4;y++) {
        for (var x=0;x<bw;x++) {
            if (board[y][x] == pl && board[y+1][x] == pl && board[y+2][x] == pl && board[y+3][x] == pl && board[y+4][x] == pl) {
                return true
            }
        }   
    }
    
    // /
    for (var y=0;y<bw-4;y++) {
        for (var x=0;x<bw-4;x++) {
            if (board[y+4][x] == pl && board[y+3][x+1] == pl && board[y+2][x+2] == pl && board[y+1][x+3] == pl && board[y][x+4] == pl) {
                return true
            }
        }   
    }
    
    // \
    for (var y=0;y<bw-4;y++) {
        for (var x=0;x<bw-4;x++) {
            if (board[y][x] == pl && board[y+1][x+1] == pl && board[y+2][x+2] == pl && board[y+3][x+3] == pl && board[y+4][x+4] == pl) {
                return true
            }
        }   
    }
    
    
    return false;
}