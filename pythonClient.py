import websocket
import pickle
import numpy as np
import json;
try:
    import thread
except ImportError:
    import _thread as thread
import time

filename = 'finalized_fall_model.sav';
model = pickle.load(open(filename,'rb') )


def on_message(ws, message):
    # obj = json.loads(message)
    # x = obj['data']
    # x2 = np.array([x])
    # x2.reshape(-1,1)
    # print(x2)
    # print(model.predict(x2))
    # print('test')
    print(message)


def on_error(ws, error):
    print(error)

def on_close(ws):
    print("### closed ###")

def on_open(ws):
    def run(*args):
        ws.send('{"ready":"true"}')
    thread.start_new_thread(run, ())


if __name__ == "__main__":
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp("ws://10.177.7.176:3006/getGyro",
                              on_message = on_message,
                              on_error = on_error,
                              on_close = on_close)
    ws.on_open = on_open
    ws.run_forever()