# react-native-nitro-torrent

Nitro Module bridge for using `libtorrent` from React Native through C++/JSI.

## Current status

- Android: implemented and testable from `TorrentExmaple/`.
- iOS: not fully implemented yet.

## Local development setup

This package depends on git submodules for native sources (`libtorrent` + `boost`):

```bash
git submodule update --init --recursive
```

In the example app, keep the dependency linked locally:

```json
"react-native-nitro-torrent": "file:../react-native-nitro-torrent"
```

## JavaScript API

```ts
import { HybridLibtorrent } from 'react-native-nitro-torrent'

const id = HybridLibtorrent.addMagnetLink(magnetLink, downloadPath)
// or
const id2 = HybridLibtorrent.addTorrentFile(torrentFilePath, downloadPath)

const torrents = HybridLibtorrent.getTorrents()
const peers = HybridLibtorrent.getTorrentPeers(id)
HybridLibtorrent.pauseTorrent(id)
HybridLibtorrent.resumeTorrent(id)
HybridLibtorrent.cancelTorrent(id)
HybridLibtorrent.deleteTorrent(id)
```

## Android testing in example app

1. Build:

```bash
cd TorrentExmaple/android
./gradlew :app:assembleDebug
```

2. Run app:

```bash
cd TorrentExmaple
npm run android
```

3. Magnet testing:
- Enter a valid magnet URI.
- Use an app-private download path, for example:
  `/data/user/0/com.torrentexmaple/files/torrents`

4. `.torrent` testing:
- Copy a `.torrent` into app-private storage (example):

```bash
adb push ./sample.torrent /data/local/tmp/sample.torrent
adb shell run-as com.torrentexmaple cp /data/local/tmp/sample.torrent files/sample.torrent
```

- In the app, use:
  `/data/user/0/com.torrentexmaple/files/sample.torrent`

The example UI polls torrents every 2s and selected peer details every 3s.

## Notes

- Progress and peer information are currently polling-based (no event stream yet).
- Session state is currently in-memory (no resume-state persistence yet).
