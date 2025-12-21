import '@testing-library/jest-dom'

// Mock IndexedDB for tests
const indexedDB = {
  open: () => ({
    onsuccess: null,
    onerror: null,
    result: {
      transaction: () => ({
        objectStore: () => ({
          add: () => ({ success: true }),
          getAll: () => ({ result: [] }),
          clear: () => ({ success: true }),
        }),
      }),
    },
  }),
}

// @ts-ignore
global.indexedDB = indexedDB
