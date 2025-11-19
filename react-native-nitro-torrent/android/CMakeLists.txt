project(NitroTorrent)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME NitroTorrent)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Define C++ library and add all sources
add_library(${PACKAGE_NAME} SHARED
        src/main/cpp/cpp-adapter.cpp
        ../cpp/HybridLibtorrent.cpp
)

get_filename_component(PROJ_ROOT "${CMAKE_SOURCE_DIR}/.." ABSOLUTE)
set(THIRD_PARTY "${PROJ_ROOT}/third_party")
set(LT_SRC "${THIRD_PARTY}/libtorrent")
set(BOOST_ROOT "${THIRD_PARTY}/boost")

set(Boost_INCLUDE_DIR "${BOOST_ROOT}")
set(Boost_NO_SYSTEM_PATHS ON)

add_definitions(-DBOOST_SYSTEM_NO_DEPRECATED)
# Add Nitrogen specs :)
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/NitroTorrent+autolinking.cmake)

# Set up local includes
include_directories(
        "src/main/cpp"
        "../cpp"
        "${BOOST_ROOT}"
)


find_library(ANDROID_LIB log)

set(LT_BUILD_DIR "${CMAKE_BINARY_DIR}/libtorrent_build")

# Check if source exists to give a better error message
if(NOT EXISTS "${LT_SRC}/CMakeLists.txt")
    message(FATAL_ERROR "libtorrent not found at: ${LT_SRC}. Please run 'git submodule update --init --recursive'")
endif()

set(deprecated-functions OFF CACHE BOOL "" FORCE)
set(build_tests OFF CACHE BOOL "" FORCE)
set(build_examples OFF CACHE BOOL "" FORCE)
set(build_tools OFF CACHE BOOL "" FORCE)
set(python-bindings OFF CACHE BOOL "" FORCE)
set(encryption OFF CACHE BOOL "" FORCE)

add_subdirectory("${LT_SRC}" "${LT_BUILD_DIR}")

target_link_libraries(
        ${PACKAGE_NAME}
        ${ANDROID_LIB}
        android
        torrent-rasterbar
)
