import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native'
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker'
import {
  HybridLibtorrent,
  type Torrent,
  type TorrentPeer,
} from 'react-native-nitro-torrent'
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'

const FALLBACK_DOWNLOAD_PATH = '/data/user/0/com.torrentexmaple/files/torrents'

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = value
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  const digits = size >= 10 || unitIndex === 0 ? 0 : 2
  return `${size.toFixed(digits)} ${units[unitIndex]}`
}

function toLocalFilePath(uri: string | null | undefined): string | null {
  if (!uri) return null
  if (uri.startsWith('file://')) {
    return decodeURIComponent(uri.replace('file://', ''))
  }
  if (uri.startsWith('/')) return uri
  return null
}

function App() {
  const isDarkMode = useColorScheme() === 'dark'
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  )
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets()
  const [downloadPath, setDownloadPath] = useState(FALLBACK_DOWNLOAD_PATH)
  const [magnetLink, setMagnetLink] = useState('')
  const [torrentFilePath, setTorrentFilePath] = useState('')
  const [torrentFileName, setTorrentFileName] = useState('')
  const [torrents, setTorrents] = useState<Torrent[]>([])
  const [selectedTorrentId, setSelectedTorrentId] = useState<string | null>(null)
  const [peers, setPeers] = useState<TorrentPeer[]>([])
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const selectedTorrent = useMemo(
    () => torrents.find((torrent) => torrent.id === selectedTorrentId) ?? null,
    [selectedTorrentId, torrents]
  )

  const refreshTorrents = useCallback(() => {
    try {
      const latest = HybridLibtorrent.getTorrents()
      setTorrents(latest)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(String(error))
    }
  }, [])

  const refreshPeers = useCallback((torrentId: string) => {
    try {
      const latestPeers = HybridLibtorrent.getTorrentPeers(torrentId)
      setPeers(latestPeers)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(String(error))
    }
  }, [])

  useEffect(() => {
    refreshTorrents()
    const interval = setInterval(refreshTorrents, 2000)
    return () => clearInterval(interval)
  }, [refreshTorrents])

  useEffect(() => {
    if (!selectedTorrentId) {
      setPeers([])
      return
    }

    refreshPeers(selectedTorrentId)
    const interval = setInterval(() => refreshPeers(selectedTorrentId), 3000)
    return () => clearInterval(interval)
  }, [selectedTorrentId, refreshPeers])

  const handleAddMagnet = useCallback(() => {
    if (!magnetLink.trim()) {
      setErrorMessage('Provide a magnet link before starting.')
      return
    }
    if (!downloadPath.trim()) {
      setErrorMessage('Provide a download path before starting.')
      return
    }

    try {
      const torrentId = HybridLibtorrent.addMagnetLink(
        magnetLink.trim(),
        downloadPath.trim()
      )
      setStatusMessage(`Started magnet torrent ${torrentId}`)
      setErrorMessage('')
      setMagnetLink('')
      refreshTorrents()
    } catch (error) {
      setErrorMessage(String(error))
    }
  }, [downloadPath, magnetLink, refreshTorrents])

  const handlePickTorrentFile = useCallback(async () => {
    try {
      const [picked] = await pick({
        type: [types.allFiles],
        mode: 'import',
      })

      const filename = picked.name ?? 'selected-file'
      if (!filename.toLowerCase().endsWith('.torrent')) {
        setErrorMessage('Please select a .torrent file.')
        return
      }

      const [copiedFile] = await keepLocalCopy({
        destination: 'cachesDirectory',
        files: [
          {
            uri: picked.uri,
            fileName: filename,
          },
        ],
      })

      if (copiedFile.status !== 'success') {
        setErrorMessage(`Failed to copy selected file: ${copiedFile.copyError}`)
        return
      }

      const localPath = toLocalFilePath(copiedFile.localUri)
      if (!localPath) {
        setErrorMessage('Could not resolve a local file path for the selected file.')
        return
      }

      setTorrentFilePath(localPath)
      setTorrentFileName(filename)
      setStatusMessage(`Selected ${filename}`)
      setErrorMessage('')
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return
      }
      setErrorMessage(String(error))
    }
  }, [])

  const handleAddTorrentFile = useCallback(() => {
    if (!torrentFilePath.trim()) {
      setErrorMessage('Select a .torrent file before starting.')
      return
    }
    if (!downloadPath.trim()) {
      setErrorMessage('Provide a download path before starting.')
      return
    }

    try {
      const torrentId = HybridLibtorrent.addTorrentFile(
        torrentFilePath.trim(),
        downloadPath.trim()
      )
      setStatusMessage(`Started torrent file ${torrentId}`)
      setErrorMessage('')
      refreshTorrents()
    } catch (error) {
      setErrorMessage(String(error))
    }
  }, [downloadPath, refreshTorrents, torrentFilePath])

  const runTorrentAction = useCallback(
    (torrentId: string, action: 'pause' | 'resume' | 'cancel' | 'delete') => {
      try {
        if (action === 'pause') HybridLibtorrent.pauseTorrent(torrentId)
        if (action === 'resume') HybridLibtorrent.resumeTorrent(torrentId)
        if (action === 'cancel') HybridLibtorrent.cancelTorrent(torrentId)
        if (action === 'delete') HybridLibtorrent.deleteTorrent(torrentId)
        setStatusMessage(`${action} executed for ${torrentId}`)
        setErrorMessage('')

        if (selectedTorrentId === torrentId && (action === 'cancel' || action === 'delete')) {
          setSelectedTorrentId(null)
          setPeers([])
        }
        refreshTorrents()
      } catch (error) {
        setErrorMessage(String(error))
      }
    },
    [refreshTorrents, selectedTorrentId]
  )

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: safeAreaInsets.bottom + 32 },
      ]}
    >
      <Text style={styles.heading}>Nitro Torrent (Android)</Text>
      <Text style={styles.subheading}>
        Start via magnet or .torrent path. Polls status + peers.
      </Text>

      <Text style={styles.label}>Download path</Text>
      <TextInput
        value={downloadPath}
        onChangeText={setDownloadPath}
        autoCapitalize="none"
        style={styles.input}
      />

      <Text style={styles.label}>Magnet link</Text>
      <TextInput
        value={magnetLink}
        onChangeText={setMagnetLink}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        placeholder="magnet:?xt=urn:btih:..."
      />
      <Button title="Start Magnet Download" onPress={handleAddMagnet} />

      <Text style={[styles.label, styles.spaceTop]}>.torrent file</Text>
      <Button title="Pick .torrent File" onPress={handlePickTorrentFile} />
      {torrentFilePath ? (
        <Text style={styles.selectedFileText}>
          Selected: {torrentFileName || torrentFilePath}
        </Text>
      ) : (
        <Text style={styles.emptyText}>No .torrent file selected yet.</Text>
      )}
      <Button title="Start .torrent Download" onPress={handleAddTorrentFile} />

      {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Text style={[styles.label, styles.spaceTop]}>Active torrents</Text>
      {torrents.length === 0 ? (
        <Text style={styles.emptyText}>No torrents in session yet.</Text>
      ) : null}

      {torrents.map((torrent) => (
        <View key={torrent.id} style={styles.card}>
          <Text style={styles.cardTitle}>{torrent.name || torrent.id}</Text>
          <Text style={styles.cardText}>ID: {torrent.id}</Text>
          <Text style={styles.cardText}>
            Status: {torrent.status} ({torrent.paused ? 'paused' : 'running'})
          </Text>
          <Text style={styles.cardText}>
            Progress: {(torrent.progress * 100).toFixed(2)}%
          </Text>
          <Text style={styles.cardText}>
            Downloaded: {formatBytes(torrent.downloadedBytes)} /{' '}
            {formatBytes(torrent.totalBytes)}
          </Text>
          <Text style={styles.cardText}>
            Speed: ↓ {formatBytes(torrent.downloadRate)}/s ↑{' '}
            {formatBytes(torrent.uploadRate)}/s
          </Text>
          <Text style={styles.cardText}>
            Peers: {torrent.peers} | Seeds: {torrent.seeds}
          </Text>

          <View style={styles.buttonRow}>
            <Button
              title="Pause"
              onPress={() => runTorrentAction(torrent.id, 'pause')}
            />
            <Button
              title="Resume"
              onPress={() => runTorrentAction(torrent.id, 'resume')}
            />
          </View>
          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              onPress={() => runTorrentAction(torrent.id, 'cancel')}
            />
            <Button
              title="Delete Files"
              onPress={() => runTorrentAction(torrent.id, 'delete')}
            />
          </View>

          <Button
            title={
              selectedTorrentId === torrent.id ? 'Hide Peers' : 'Show Peer Details'
            }
            onPress={() => {
              if (selectedTorrentId === torrent.id) {
                setSelectedTorrentId(null)
                setPeers([])
                return
              }
              setSelectedTorrentId(torrent.id)
              refreshPeers(torrent.id)
            }}
          />
        </View>
      ))}

      {selectedTorrent ? (
        <View style={styles.peersCard}>
          <Text style={styles.cardTitle}>
            Peers for {selectedTorrent.name || selectedTorrent.id}
          </Text>
          {peers.length === 0 ? (
            <Text style={styles.cardText}>No connected peers yet.</Text>
          ) : null}
          {peers.map((peer, index) => (
            <Text key={`${peer.endpoint}-${index}`} style={styles.peerText}>
              {peer.endpoint} | {peer.client || 'unknown-client'} |{' '}
              {(peer.progress * 100).toFixed(1)}% | ↓ {formatBytes(peer.downloadRate)}
              /s ↑ {formatBytes(peer.uploadRate)}/s | {peer.flags}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
  },
  subheading: {
    fontSize: 14,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  spaceTop: {
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  statusText: {
    color: '#1d7a2f',
    fontWeight: '500',
  },
  errorText: {
    color: '#a31515',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 13,
    color: '#666',
  },
  selectedFileText: {
    fontSize: 12,
    color: '#1f4f75',
  },
  card: {
    borderWidth: 1,
    borderColor: '#c4c4c4',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginTop: 8,
  },
  peersCard: {
    borderWidth: 1,
    borderColor: '#8ea9c0',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginTop: 12,
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  cardText: {
    fontSize: 12,
  },
  peerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
})

export default App
