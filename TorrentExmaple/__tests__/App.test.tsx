/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native-nitro-torrent', () => ({
  HybridLibtorrent: {
    addMagnetLink: jest.fn(() => 'mock-torrent-id'),
    addTorrentFile: jest.fn(() => 'mock-torrent-id'),
    pauseTorrent: jest.fn(),
    resumeTorrent: jest.fn(),
    cancelTorrent: jest.fn(),
    deleteTorrent: jest.fn(),
    getTorrent: jest.fn(() => null),
    getTorrents: jest.fn(() => []),
    getTorrentPeers: jest.fn(() => []),
  },
}));

jest.mock('@react-native-documents/picker', () => ({
  errorCodes: {
    OPERATION_CANCELED: 'OPERATION_CANCELED',
  },
  isErrorWithCode: jest.fn(() => false),
  keepLocalCopy: jest.fn(),
  pick: jest.fn(),
  types: {
    allFiles: '*/*',
  },
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
