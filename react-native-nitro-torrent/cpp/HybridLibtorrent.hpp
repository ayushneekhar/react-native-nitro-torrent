#pragma once

#include <libtorrent/session.hpp>
#include <thread>

#include "HybridLibtorrentSpec.hpp"
#include "libtorrent/sha1_hash.hpp"

namespace margelo::nitro::nitrotorrent {
class HybridLibtorrent : public HybridLibtorrentSpec {
   public:
    HybridLibtorrent() : HybridObject(TAG) {}
    virtual ~HybridLibtorrent();

   public:
    void addMagnetLink(const std::string& magnetLink) override;
    void pauseTorrent(const std::string& torrentId) override;
    void resumeTorrent(const std::string& torrentId) override;
    void cancelTorrent(const std::string& torrentId) override;
    void deleteTorrent(const std::string& torrentId) override;
    Torrent getTorrent(const std::string& torrentId) override;

   private:
    lt::sha1_hash getInfoHash(const std::string& torrentId);

    lt::session m_session;

    std::thread m_alertThread;
    std::atomic<bool> m_running{false};
    void alertThread();
};
}  // namespace margelo::nitro::nitrotorrent