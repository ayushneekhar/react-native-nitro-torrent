import { NitroModules } from 'react-native-nitro-modules'
import type { Libtorrent } from './specs/HybridTorrent.nitro'

export const HybridLibtorrent =
  NitroModules.createHybridObject<Libtorrent>('Libtorrent')

export type {
  Libtorrent as LibtorrentModule,
  Torrent,
  TorrentPeer,
} from './specs/HybridTorrent.nitro'
