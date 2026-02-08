import type { HybridObject } from 'react-native-nitro-modules'

export interface Torrent {
  id: string
  name: string
  progress: number
  status: string
  savePath: string
  downloadRate: number
  uploadRate: number
  downloadedBytes: number
  totalBytes: number
  peers: number
  seeds: number
  paused: boolean
}

export interface TorrentPeer {
  endpoint: string
  client: string
  progress: number
  downloadRate: number
  uploadRate: number
  flags: string
}

export interface Libtorrent
  extends HybridObject<{
    android: 'c++'
    ios: 'c++'
  }> {
  addMagnetLink(magnetLink: string, downloadPath: string): string
  addTorrentFile(torrentFilePath: string, downloadPath: string): string
  pauseTorrent(torrentId: string): void
  resumeTorrent(torrentId: string): void
  cancelTorrent(torrentId: string): void
  deleteTorrent(torrentId: string): void
  getTorrent(torrentId: string): Torrent
  getTorrents(): Torrent[]
  getTorrentPeers(torrentId: string): TorrentPeer[]
}
