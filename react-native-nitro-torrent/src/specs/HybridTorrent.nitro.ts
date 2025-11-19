import type { HybridObject } from 'react-native-nitro-modules'

export interface Libtorrent
  extends HybridObject<{
    android: 'c++'
  }> {
  add(a: number, b: number): number
}
