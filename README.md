# Unique Browser Tab ID
### Persistent IDs for your tabs. Works with duplicated tabs.

## Usage

```
npm i codebling/unique-browser-tab-id#v1.2.0
```

```
import { getUniqueBrowserTabId } from 'unique-browser-tab-id';

const tabId = await getUniqueBrowserTabId();
```

## Why?

I couldn't find an existing library that did this. While generating a unique ID for every tab is not hard, nor is persisting it to [Session Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage), verifying that the ID is not a duplicate is just complicated enough to warrant a separate library. 

## How does it work?

New tabs generate a unique ID. This ID gets stored in Session Storage (which is unique per tab), and if a tab is refreshed or "discarded" or "snoozed", it will still keep the same ID when it loads again. If a tab gets duplicated, the browser copies Session Storage to the new tab, which could cause ID conflicts. Unique Browser Tab ID uses the [Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) to see if any other tabs already have the ID that it found in Session Storage. If yes, it generates a new one. Easy! No conflicts! 

## Fixing Jest issues

If you see `Jest encountered an unexpected token` and `SyntaxError: Cannot use import statement outside a module`, you'll have to adjust your Jest config. 

Jest doesn't support ESM aka ECMAScript Modules (think `import`), only CommonJS (think `require`), because of technicalities with mocking in ESM. So Jest transpiles all files to CommonJS before running. Dependencies often do not need to be transpiled (they may be CommonJS-based or use a solution like ([Dual Publish](https://github.com/ai/dual-publish)), but it seems like `nanoid` forces our hand in this case. You'll need to add a line line this to your `jest.config.ts` or `jest.config.js`:

```
    transformIgnorePatterns: ['/node_modules/(?!(nanoid|unique-browser-tab-id/node_modules/nanoid)/)'],
```

## Why return a Promise? 

We have to wait for responses from the Broadcast Channel to see if this is a duplciate ID or not. There is no sync API and no plans to offer one.
