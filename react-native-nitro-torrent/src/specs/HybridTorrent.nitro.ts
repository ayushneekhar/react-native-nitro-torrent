import type { HybridObject } from 'react-native-nitro-modules'

export interface Torrent {
  id: string
  name: string
  progress: number
  status: string
}

export interface Libtorrent
  extends HybridObject<{
    android: 'c++'
  }> {
  addMagnetLink(magnetLink: string): void
  pauseTorrent(torrentId: string): void
  resumeTorrent(torrentId: string): void
  cancelTorrent(torrentId: string): void
  deleteTorrent(torrentId: string): void
  getTorrent(torrentId: string): Torrent
}
