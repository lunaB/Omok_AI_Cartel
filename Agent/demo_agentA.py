from Omok import Omok
import random

omok = Omok.instance()
omok.join('http://localhost:5000/')
omok.ready()

play = [[0,0],[1,1],[2,2],[3,3],[4,4],[5,5]]
i = 0

while True:
    game_status = omok.game_wait()
    print(game_status)
    if game_status['gameover']:
        if game_status['is_win'] == True:
            print('승리')
        elif game_status['is_win'] == False:
            print('패배')
        elif game_status['is_draw'] == True:
            print('무승부')

        break

    # x, y = random.randint(0, 9), random.randint(0, 9)
    omok.game_next(play[i][0], play[i][1])
    i += 1
