cmake_minimum_required(VERSION 3.10.2)

add_subdirectory(${CMAKE_SOURCE_DIR}/../../third_party/libtorrent ${CMAKE_SOURCE_DIR}/libtorrent)

find_package(Boost REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(log REQUIRED)

add_library(
        torrent_module SHARED
        TorrentModule.cpp
)

target_link_libraries(
        torrent_module
        torrent-rasterbar
        ${Boost_LIBRARIES}
        OpenSSL::SSL
        OpenSSL::Crypto
        android
        log
)

target_include_directories(
        target_module PRIVATE
        ${CMAKE_SOURCE_DIR}/../../third_party/libtorrent/include
        ${Boost_INCLUDE_DIRS}
)