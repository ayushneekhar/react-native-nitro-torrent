#include "HybridLibtorrent.hpp"

#include <libtorrent/error_code.hpp>
#include <libtorrent/magnet_uri.hpp>
#include <libtorrent/session_handle.hpp>
#include <libtorrent/torrent_flags.hpp>
#include <libtorrent/torrent_info.hpp>

#include <algorithm>
#include <cstddef>
#include <filesystem>
#include <sstream>
#include <stdexcept>
#include <utility>
#include <vector>

namespace margelo::nitro::nitrotorrent {
namespace {
constexpr auto kStatusFlags = lt::torrent_handle::query_name |
                              lt::torrent_handle::query_save_path |
                              lt::torrent_handle::query_accurate_download_counters;

std::string toHexString(const char* data, std::size_t size) {
    static constexpr char kHexAlphabet[] = "0123456789abcdef";
    std::string hex;
    hex.resize(size * 2);

    for (std::size_t i = 0; i < size; ++i) {
        const auto byte = static_cast<unsigned char>(data[i]);
        hex[(i * 2)] = kHexAlphabet[byte >> 4];
        hex[(i * 2) + 1] = kHexAlphabet[byte & 0x0F];
    }

    return hex;
}
}  // namespace

HybridLibtorrent::HybridLibtorrent() : HybridObject(TAG), m_session() {}

HybridLibtorrent::~HybridLibtorrent() = default;

std::string HybridLibtorrent::addMagnetLink(const std::string& magnetLink,
                                            const std::string& downloadPath) {
    ensureDownloadPath(downloadPath);

    lt::error_code ec;
    lt::add_torrent_params params = lt::parse_magnet_uri(magnetLink, ec);
    if (ec) {
        throw std::runtime_error("Failed to parse magnet link: " + ec.message());
    }

    params.save_path = downloadPath;
    params.flags &= ~lt::torrent_flags::auto_managed;
    params.flags &= ~lt::torrent_flags::paused;

    lt::torrent_handle handle = m_session.add_torrent(std::move(params), ec);
    if (ec) {
        throw std::runtime_error("Failed to add magnet link: " + ec.message());
    }

    return toTorrentId(handle.info_hashes());
}

std::string HybridLibtorrent::addTorrentFile(
    const std::string& torrentFilePath, const std::string& downloadPath) {
    ensureDownloadPath(downloadPath);

    lt::error_code ec;
    auto torrentInfo = std::make_shared<lt::torrent_info>(torrentFilePath, ec);
    if (ec) {
        throw std::runtime_error("Failed to read torrent file: " + ec.message());
    }

    lt::add_torrent_params params;
    params.ti = torrentInfo;
    params.save_path = downloadPath;
    params.flags &= ~lt::torrent_flags::auto_managed;
    params.flags &= ~lt::torrent_flags::paused;

    lt::torrent_handle handle = m_session.add_torrent(std::move(params), ec);
    if (ec) {
        throw std::runtime_error("Failed to add torrent file: " + ec.message());
    }

    return toTorrentId(handle.info_hashes());
}

void HybridLibtorrent::pauseTorrent(const std::string& torrentId) {
    findHandleByIdOrThrow(torrentId).pause(lt::torrent_handle::graceful_pause);
}

void HybridLibtorrent::resumeTorrent(const std::string& torrentId) {
    findHandleByIdOrThrow(torrentId).resume();
}

void HybridLibtorrent::cancelTorrent(const std::string& torrentId) {
    m_session.remove_torrent(findHandleByIdOrThrow(torrentId));
}

void HybridLibtorrent::deleteTorrent(const std::string& torrentId) {
    m_session.remove_torrent(findHandleByIdOrThrow(torrentId),
                             lt::session_handle::delete_files);
}

Torrent HybridLibtorrent::getTorrent(const std::string& torrentId) {
    const lt::torrent_status status = findHandleByIdOrThrow(torrentId).status(kStatusFlags);
    return toTorrentSnapshot(status);
}

std::vector<Torrent> HybridLibtorrent::getTorrents() {
    std::vector<Torrent> torrents;
    const std::vector<lt::torrent_handle> handles = m_session.get_torrents();
    torrents.reserve(handles.size());

    for (const auto& handle : handles) {
        if (!handle.is_valid()) continue;
        torrents.emplace_back(toTorrentSnapshot(handle.status(kStatusFlags)));
    }

    std::sort(torrents.begin(), torrents.end(),
              [](const Torrent& lhs, const Torrent& rhs) { return lhs.name < rhs.name; });
    return torrents;
}

std::vector<TorrentPeer> HybridLibtorrent::getTorrentPeers(
    const std::string& torrentId) {
    lt::torrent_handle handle = findHandleByIdOrThrow(torrentId);

    std::vector<lt::peer_info> peerInfos;
    handle.get_peer_info(peerInfos);

    std::vector<TorrentPeer> peers;
    peers.reserve(peerInfos.size());

    for (const auto& peerInfo : peerInfos) {
        TorrentPeer peer{};
        if (!peerInfo.ip.address().is_unspecified()) {
            peer.endpoint = peerInfo.ip.address().to_string() + ":" +
                            std::to_string(peerInfo.ip.port());
        } else {
            peer.endpoint = "unknown";
        }

        peer.client = peerInfo.client;
        peer.progress = static_cast<double>(peerInfo.progress);
        peer.downloadRate = static_cast<double>(peerInfo.down_speed);
        peer.uploadRate = static_cast<double>(peerInfo.up_speed);
        peer.flags = peerFlagsToString(peerInfo);
        peers.emplace_back(std::move(peer));
    }

    return peers;
}

lt::torrent_handle HybridLibtorrent::findHandleByIdOrThrow(
    const std::string& torrentId) const {
    const std::vector<lt::torrent_handle> handles = m_session.get_torrents();
    for (const auto& handle : handles) {
        if (!handle.is_valid()) continue;
        if (toTorrentId(handle.info_hashes()) == torrentId) return handle;
    }
    throw std::runtime_error("Torrent not found: " + torrentId);
}

std::string HybridLibtorrent::toTorrentId(const lt::info_hash_t& infoHashes) {
    if (infoHashes.has_v1()) {
        return toHexString(infoHashes.v1.data(), infoHashes.v1.size());
    }
    if (infoHashes.has_v2()) {
        return toHexString(infoHashes.v2.data(), infoHashes.v2.size());
    }
    return {};
}

std::string HybridLibtorrent::toStatusString(const lt::torrent_status& status) {
    if (static_cast<bool>(status.flags & lt::torrent_flags::paused)) return "paused";

    switch (status.state) {
        case lt::torrent_status::checking_files:
            return "checking_files";
        case lt::torrent_status::downloading_metadata:
            return "downloading_metadata";
        case lt::torrent_status::downloading:
            return "downloading";
        case lt::torrent_status::finished:
            return "finished";
        case lt::torrent_status::seeding:
            return "seeding";
        case lt::torrent_status::checking_resume_data:
            return "checking_resume_data";
        default:
            return "unknown";
    }
}

std::string HybridLibtorrent::peerFlagsToString(const lt::peer_info& peer) {
    std::vector<std::string> flags;
    if (static_cast<bool>(peer.flags & lt::peer_info::seed)) flags.emplace_back("seed");
    if (static_cast<bool>(peer.flags & lt::peer_info::interesting)) {
        flags.emplace_back("interesting");
    }
    if (static_cast<bool>(peer.flags & lt::peer_info::remote_interested)) {
        flags.emplace_back("remote_interested");
    }
    if (static_cast<bool>(peer.flags & lt::peer_info::choked)) flags.emplace_back("choked");
    if (static_cast<bool>(peer.flags & lt::peer_info::remote_choked)) {
        flags.emplace_back("remote_choked");
    }
    if (static_cast<bool>(peer.flags & lt::peer_info::connecting)) {
        flags.emplace_back("connecting");
    }

    if (flags.empty()) return "none";

    std::ostringstream stream;
    for (std::size_t i = 0; i < flags.size(); ++i) {
        if (i > 0) stream << ",";
        stream << flags[i];
    }
    return stream.str();
}

void HybridLibtorrent::ensureDownloadPath(const std::string& downloadPath) {
    if (downloadPath.empty()) {
        throw std::runtime_error("downloadPath cannot be empty.");
    }

    std::error_code ec;
    std::filesystem::create_directories(downloadPath, ec);
    if (ec && !std::filesystem::exists(downloadPath)) {
        throw std::runtime_error("Failed to create download directory: " +
                                 ec.message());
    }
}

Torrent HybridLibtorrent::toTorrentSnapshot(const lt::torrent_status& status) {
    Torrent torrent{};
    torrent.id = toTorrentId(status.info_hashes);
    torrent.name = status.name.empty() ? torrent.id : status.name;
    torrent.progress = static_cast<double>(status.progress);
    torrent.status = toStatusString(status);
    torrent.savePath = status.save_path;
    torrent.downloadRate = static_cast<double>(status.download_rate);
    torrent.uploadRate = static_cast<double>(status.upload_rate);
    torrent.downloadedBytes = static_cast<double>(status.total_done);
    torrent.totalBytes = static_cast<double>(
        status.total_wanted > 0 ? status.total_wanted : status.total);
    torrent.peers = static_cast<double>(status.num_peers);
    torrent.seeds = static_cast<double>(status.num_seeds);
    torrent.paused = static_cast<bool>(status.flags & lt::torrent_flags::paused);
    return torrent;
}
}  // namespace margelo::nitro::nitrotorrent
