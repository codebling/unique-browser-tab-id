import { nanoid } from 'nanoid';

const CHANNEL_AND_STORAGE_NAME = "unique-browser-tab-id";

const storeInSessionStorage = (id: string): void => {
  sessionStorage.setItem(CHANNEL_AND_STORAGE_NAME, id);
}

const getFromSessionStorage = (): string | null => {
  return sessionStorage.getItem(CHANNEL_AND_STORAGE_NAME);
}

export const getUniqueBrowserTabId = async (): Promise<string> => {
  const broadcastChannel = new BroadcastChannel(CHANNEL_AND_STORAGE_NAME);

  const sessionId = getFromSessionStorage();
  let id: string;
  if (sessionId == null) {
    //new tab - create new id
    id = nanoid(4); //580 IDs needed for 1% probability of one or more collisions https://zelark.github.io/nano-id-cc/
    storeInSessionStorage(id);
  } else {
    //page was either refreshed or duplicated
    id = sessionId;
    const isDup = await checkIfIsDup(id, broadcastChannel);
    if (isDup) {
      //tab was duplicated, create new id
      id = nanoid(4);
      storeInSessionStorage(id);
    } else {
      //page was refreshed, everything is ok, keep non-duplicate id
    }
  }

  registerCheckIdListener(id, broadcastChannel);

  return id;
}

const registerCheckIdListener = (id: string, broadcastChannel: BroadcastChannel): void => {

  const respondToCheckMessageHandler = ({ data }: MessageEvent<Message>) => {
    if (isCheck(data) && data.id === id) {
      broadcastChannel.postMessage({ type: "checkResponse", id, exists: true });
    }
  };
  broadcastChannel.addEventListener("message", respondToCheckMessageHandler);
};

export const checkIfIsDup = (id: string, broadcastChannel: BroadcastChannel) => new Promise<boolean>((resolve, reject) => {
  const timerId = setTimeout(
    () => {
      resolve(false); // If no response after a while, assume not a duplicate
    }, 
    200, //response time on 2 cores at 800 MHz loaded to 80% in Firefox was usually 20-30 ms, one at 40 and one took over 100ms
          //with 12 cores @4.6GHz and < 10% load, avg response was ~3ms
  );

  const messageErrorHandler = (error: MessageEvent<any>): void => {
    cancelTimerAndUnregisterListeners();
    reject(error)
  };

  const respondToCheckResponseMessageHandler = ({ data }: MessageEvent<Message>) => {
    if (data.id == id && isCheckResponse(data)) {
      cancelTimerAndUnregisterListeners();
      resolve(true);
    }
  };

  const cancelTimerAndUnregisterListeners = () => {
    clearTimeout(timerId);
    broadcastChannel.removeEventListener("message", respondToCheckResponseMessageHandler);
    broadcastChannel.removeEventListener("messageerror", messageErrorHandler);
  };

  broadcastChannel.addEventListener("message", respondToCheckResponseMessageHandler, { once: true });
  broadcastChannel.addEventListener("messageerror", messageErrorHandler, { once: true });

  broadcastChannel.postMessage({ type: "check", id });

});

type Message = Check | CheckResponse;
type Check = {
  type: "check";
  id: string;
};

type CheckResponse = {
  type: "checkResponse";
  id: string;
  exists: true;
};

const isCheck = (message: Message): message is Check => {
  return message.type === "check";
}

const isCheckResponse = (message: Message): message is CheckResponse => {
  return message.type === "checkResponse";
}
