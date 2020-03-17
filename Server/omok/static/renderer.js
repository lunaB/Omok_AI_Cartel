// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.



$(document).ready(function(){
    for(var i=0;i<10;i++){
        $('#map').append('<div class="row '+i+'"></div>')     
        for(var j=0;j<10;j++){
            $('#map>div.'+i).append('<div class="box '+j+'"></div>')
            $('#map>div.'+i+'>div.'+j).css('backgroundColor', '#666')
            
            $('#map>div.'+i+'>div.'+j).click(function(){
                $(this).css('backgroundColor', '#DDD')
            })
        }
    }
    
    var url = prompt('스트리밍 주소를 입력해주세요.', 'http://localhost:5000/observe')
    var observe = io.connect(url);
    
    observe.on('connect', function(socket) {
        observe.on('update', function(game_status) {
            update(game_status)
        })

        observe.on('gameover', function(gameover_status) {
            if (gameover_status.gameover == 'D') {
                $('#result>h6:nth-child(1)>span').text('무승부')
                $('#result>h6:nth-child(2)>span').text('무승부')
            }
            else if (gameover_status.gameover == 'A') {
                $('#result>h6:nth-child(1)>span').text('승리')
                $('#result>h6:nth-child(2)>span').text('패배')
            }
            else if (gameover_status.gameover == 'B') {
                $('#result>h6:nth-child(1)>span').text('패배')
                $('#result>h6:nth-child(2)>span').text('승리')
            }
            $('#gameover').modal()
        })
        
        observe.on('observer_init', function(game_status) {
            if (game_status.is_start == true) {
                update(game_status)
            }
        })
    });
})


function update(game_status) {
    console.log(game_status)
     
    for(var i=0;i<10;i++){
        for(var j=0;j<10;j++){
            if(game_status.board[i][j] == 0){
                $('#map>div.'+i+'>div.'+j).css('backgroundColor', '#666')
            }else if(game_status.board[i][j] == 1){
                $('#map>div.'+i+'>div.'+j).css('backgroundColor', '#333')
            }else if(game_status.board[i][j] == 2){
                $('#map>div.'+i+'>div.'+j).css('backgroundColor', '#DDD')
            }
        }
    }
}