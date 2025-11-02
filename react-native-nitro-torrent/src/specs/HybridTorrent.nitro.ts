import type { HybridObject } from 'react-native-nitro-modules'

export interface HybridTorrent
  extends HybridObject<{
    android: 'c++'
  }> {
  download(url: string): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  cancel(): Promise<void>
  getProgress(): Promise<number>
  getStatus(): Promise<string>
  getDownloadedSize(): Promise<number>
  getTotalSize(): Promise<number>
  getSpeed(): Promise<number>
  getETA(): Promise<number>
}
