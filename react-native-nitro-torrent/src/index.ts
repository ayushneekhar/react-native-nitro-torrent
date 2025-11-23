import { NitroModules } from 'react-native-nitro-modules'
import type { Libtorrent } from './specs/HybridTorrent.nitro'

export const HybridLibtorrent =
  NitroModules.createHybridObject<Libtorrent>('Libtorrent')
