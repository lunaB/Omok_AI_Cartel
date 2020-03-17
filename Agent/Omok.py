import socketio

sio = socketio.Client()

class OmokBase():

    def __init__(self):
        print('Omok Agent : v0.1')
        self.game_status = {
            'version': '',
            'board': [],
            'gameover': False,
            'is_win': None,
            'is_draw': None
        }
        self.update = False

    def join(self, url='http://localhost:5000/'):
        print('join ...', end='')
        sio.connect(url, namespaces=['/agent'])
        print('ok')

    def ready(self):
        print('ready ...', end='')
        sio.emit('ready', {}, namespace='/agent')
        print('ok')

    def game_wait(self):
        while not self.update:
            print('응답 기다리는 중...')
            sio.sleep(5)
        self.update = False
        return self.game_status

    def game_next(self, x, y):
        data = {'version': self.game_status['version'], 'x': x, 'y': y}
        sio.emit('game_next', data, namespace='/agent')


class SingletonInstane:
    __instance = None

    @classmethod
    def __getInstance(cls):
        return cls.__instance

    @classmethod
    def instance(cls, *args, **kargs):
        cls.__instance = cls(*args, **kargs)
        cls.instance = cls.__getInstance
        return cls.__instance


class Omok(OmokBase, SingletonInstane):
    pass


omok_instance = Omok.instance()


@sio.event(namespace='/chat')
def connect():
    print('connect!')


@sio.event(namespace='/agent')
def game_wait(data):
    print(data)
    omok_instance.game_status['version'] = data['version']
    omok_instance.game_status['board'] = data['board']
    omok_instance.game_status['gameover'] = data['gameover']
    if 'is_win' in data:
        omok_instance.game_status['is_win'] = data['is_win']
    elif 'is_draw' in data:
        omok_instance.game_status['is_draw'] = data['is_draw']
    omok_instance.update = True


@sio.event(namespace='/agent')
def disconnect():
    print('disconnect!')
