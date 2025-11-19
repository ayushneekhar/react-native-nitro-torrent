#pragma once

#include "HybridLibtorrentSpec.hpp"

namespace margelo::nitro::nitrotorrent {
    class HybridLibtorrent: public HybridLibtorrentSpec {
    public:
        double add(double a, double b) override;
    };
}