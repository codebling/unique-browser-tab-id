import { nanoid } from 'nanoid';

// There are several levels at which information can be shared:
//   * closures - singleton when a script is loaded from the same source
//   * window object - singleton for the tab, even when script is loaded from different sources
//   * SessionStorage - browser API that is unique per tab, but gets copied to new tabs when the tab is duplicated
//   * BroadcastChannel - shares info across tabs (one message per BroadcastChannel object on the same channel)
//
// We mostly use `window` object here rather than closures, so that if the script is loaded multiple times from different URLs,
// each 'instance' of the script will report the same tab id

const CHANNEL_AND_STORAGE_NAME = "unique-browser-tab-id";
const IN_FLIGHT_PROMISE_NAME = `${CHANNEL_AND_STORAGE_NAME}-in-flight-promise`;
const CONFIRMED_UNIQUE_ID_NAME = `${CHANNEL_AND_STORAGE_NAME}-confirmed-unique-id`;

const storeInSessionStorage = (id: string): void => {
  sessionStorage.setItem(CHANNEL_AND_STORAGE_NAME, id);
}

const getFromSessionStorage = (): string | null => {
  return sessionStorage.getItem(CHANNEL_AND_STORAGE_NAME);
}

export const getUniqueBrowserTabId = async (): Promise<string> => {
  if (window[CONFIRMED_UNIQUE_ID_NAME] != null) {
    return window[CONFIRMED_UNIQUE_ID_NAME];
  }

  if (window[IN_FLIGHT_PROMISE_NAME] != null) {
    const inFlightPromise = window[IN_FLIGHT_PROMISE_NAME];
    await inFlightPromise;
    const newBrowserTabId = await getUniqueBrowserTabId();
    return newBrowserTabId;
  }
  
  const broadcastChannel = window[CHANNEL_AND_STORAGE_NAME] ?? new BroadcastChannel(CHANNEL_AND_STORAGE_NAME);
  //Save channel to window so it is shared between instances of this script within the same tab. 
  //This prevents instances on the same tab from receiving messages from each other.
  window[CHANNEL_AND_STORAGE_NAME] = broadcastChannel;

  const sessionId = getFromSessionStorage();
  let id: string;
  if (sessionId == null) {
    //new tab - create new id
    id = nanoid(4); //580 IDs needed for 1% probability of one or more collisions https://zelark.github.io/nano-id-cc/
    storeInSessionStorage(id);
  } else {
    //page was either refreshed or duplicated
    id = sessionId;

    const isDupPromise = checkIfIsDup(id, broadcastChannel);
    window[IN_FLIGHT_PROMISE_NAME] = isDupPromise;
    const isDup = await isDupPromise;
    window[IN_FLIGHT_PROMISE_NAME] = null;

    if (isDup) {
      //tab was duplicated, create new id
      id = nanoid(4);
      storeInSessionStorage(id);
    } else {
      //page was refreshed, everything is ok, keep non-duplicate id
    }
  }

  window[CONFIRMED_UNIQUE_ID_NAME] = id;
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
