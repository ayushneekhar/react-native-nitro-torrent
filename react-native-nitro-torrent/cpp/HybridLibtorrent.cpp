#include "HybridLibtorrent.hpp"

namespace margelo::nitro::nitrotorrent {
void HybridLibtorrent::addMagnetLink(const std::string& magnetLink) { return; }
void HybridLibtorrent::pauseTorrent(const std::string& torrentId) { return; }
void HybridLibtorrent::resumeTorrent(const std::string& torrentId) { return; }
void HybridLibtorrent::cancelTorrent(const std::string& torrentId) { return; }
void HybridLibtorrent::deleteTorrent(const std::string& torrentId) { return; }
Torrent HybridLibtorrent::getTorrent(const std::string& torrentId) { return Torrent(); }
}  // namespace margelo::nitro::nitrotorrent