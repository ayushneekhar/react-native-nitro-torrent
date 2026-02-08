#pragma once

#include <libtorrent/info_hash.hpp>
#include <libtorrent/peer_info.hpp>
#include <libtorrent/session.hpp>
#include <libtorrent/torrent_handle.hpp>
#include <libtorrent/torrent_status.hpp>
#include <string>
#include <vector>

#include "HybridLibtorrentSpec.hpp"

namespace margelo::nitro::nitrotorrent {
class HybridLibtorrent : public HybridLibtorrentSpec {
   public:
    HybridLibtorrent();
    ~HybridLibtorrent() override;

   public:
    std::string addMagnetLink(const std::string& magnetLink,
                              const std::string& downloadPath) override;
    std::string addTorrentFile(const std::string& torrentFilePath,
                               const std::string& downloadPath) override;
    void pauseTorrent(const std::string& torrentId) override;
    void resumeTorrent(const std::string& torrentId) override;
    void cancelTorrent(const std::string& torrentId) override;
    void deleteTorrent(const std::string& torrentId) override;
    Torrent getTorrent(const std::string& torrentId) override;
    std::vector<Torrent> getTorrents() override;
    std::vector<TorrentPeer> getTorrentPeers(
        const std::string& torrentId) override;

   private:
    lt::torrent_handle findHandleByIdOrThrow(const std::string& torrentId) const;
    static std::string toTorrentId(const lt::info_hash_t& infoHashes);
    static std::string toStatusString(const lt::torrent_status& status);
    static std::string peerFlagsToString(const lt::peer_info& peer);
    static void ensureDownloadPath(const std::string& downloadPath);
    static Torrent toTorrentSnapshot(const lt::torrent_status& status);

    lt::session m_session;
};
}  // namespace margelo::nitro::nitrotorrent
