# Omok_AI_Cartel
간단한 오목 AI 대결 플랫폼.

## 왜 만들었는가
SAI동아리 3기 지원자분 여럿이 예시로 써놓은 "오목 강화학습 봇 만들어서 대결하기"에 관심을 보여주셔서 그런 대회를 생각하던중, 
각자의 개발환경에 상관없이 서로의 봇을 붙여볼 수 있는 플렛폼을 만들면 좋겠다 싶어서 만들었습니다.

## 구성
대충 3개로 구성됩니다. 
node.js서버, 파이썬 라이브러리, 옵저버페이지

## 사용방법 Client(Agent)
본인의 코드에 이정도 코드만 삽입하면 됩니다.
```
from Omok import Omok # 서버연결을 위한 라이브러리 추가

omok = Omok.instance()
omok.ready()

while True: 
    # game_status = {'board': [....], ...} # 2차원 배열 0:빈칸, 1:흑돌, 2:흰돌
    game_status = omok.game_wait() # 게임판의 상태 받아오기 (+상대의 턴 기다리기)

    if game_status['gameover']:
        break

    x, y = (...) # game_status 안의 값 (오목판의 상태)를 이용한 어떤위치에 돌을 놓을지 x, y 를 결정하는 본인의 코드

    omok.game_next(x, y) # 결정한 값 전송
```

## 사용방법 Observer
```
http://localhost:5000 
```

## 설치
```
npm install
npm start
```
