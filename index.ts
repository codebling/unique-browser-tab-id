import { nanoid } from 'nanoid';

const STORAGE_ID = "unique-browser-tab-id";

const storeInSpan = (id: string): void => {
  let span = document.getElementById(STORAGE_ID);
  if (span == null) {
    span = document.createElement("span");
    span.id = STORAGE_ID;
    span.style.display = "none";
    document.head.prepend(span);
  }
  span.innerHTML = id;
};

const storeInSessionStorage = (id: string): void => {
  sessionStorage.setItem(STORAGE_ID, id);
}

const getFromSessionStorage = (): string | null => {
  return sessionStorage.getItem(STORAGE_ID);
}

export const getUniqueBrowserTabId = (): string => {
  const sessionId = getFromSessionStorage();
  let id: string;
  if (sessionId == null) {
    //new tab - create new id
    id = nanoid(4); //580 IDs needed for 1% probability of one or more collisions https://zelark.github.io/nano-id-cc/
    storeInSessionStorage(id);
  } else {
    //page was refreshed or duplicated
    id = sessionId;
  }

  return id;
}

export const checkIfIsDup = async (id: string) => {
  const broadcastChannel = new BroadcastChannel(STORAGE_ID);
  broadcastChannel.addEventListener("message", (event: MessageEvent<Message>) => {
    const { data } = event;
    if (isCheck(data) && data.id === id) {
      broadcastChannel.postMessage({ type: "checkResponse", id, exists: true });
    }
  });
  const isDup = await new Promise<boolean>((resolve, reject) => {
    const start = new Date();
    broadcastChannel.addEventListener("message", (event: MessageEvent<Message>) => {
      const { data } = event;
      if (data.id == id) {
        if (isCheckResponse(data)) {
          const end = new Date();
          console.log(`resolved in ${end.getTime() - start.getTime()} ms`);
          resolve(true);
        }
      }
    });
    broadcastChannel.onmessageerror = (error) => {
      reject(error);
    };
    broadcastChannel.postMessage({ type: "check", id });

    setTimeout(() => {
      resolve(false); // If no response after a while, assume not a duplicate
    }, 100);
  });

  // broadcastChannel.close();
  return isDup;
}

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

export const getId = async () => {
  const id = 'abcd';
  const isDup = await checkIfIsDup(id);
  
  console.log(isDup ? "This is a duplicate tab." : "This is a unique tab.");
  return isDup;
};