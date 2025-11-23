#pragma once

#include "HybridLibtorrentSpec.hpp"

namespace margelo::nitro::nitrotorrent {
class HybridLibtorrent : public HybridLibtorrentSpec {
   public:
    HybridLibtorrent() : HybridObject(TAG) {}

   public:
    void addMagnetLink(const std::string& magnetLink) override;
    void pauseTorrent(const std::string& torrentId) override;
    void resumeTorrent(const std::string& torrentId) override;
    void cancelTorrent(const std::string& torrentId) override;
    void deleteTorrent(const std::string& torrentId) override;
    Torrent getTorrent(const std::string& torrentId) override;
};
}  // namespace margelo::nitro::nitrotorrent