project(NitroTorrent)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME NitroTorrent)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Define C++ library and add all sources
add_library(${PACKAGE_NAME} SHARED
        src/main/cpp/cpp-adapter.cpp
)

get_filename_component(PROJ_ROOT, "${CMAKE_SOURCE_DIR}/.." ABSOLUTE)
set(THIRD_PARTY, "${PROJ_ROOT}/third_party")

# Add Nitrogen specs :)
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/NitroTorrent+autolinking.cmake)

# Set up local includes
include_directories(
        "src/main/cpp"
        "../cpp"
)

find_library(ANDROID_LIB log)

set(LT_TRC, "${THIRD_PARTY}/libtorrent")
set(LT_BIN, "${CMAKE_BINARY_DIR}/libtorrent-build")
add_subdirectory("${LI_SRC}" "${LT_BIN}")

# Link all libraries together
target_link_libraries(
        ${PACKAGE_NAME} PRIVATE
        ${ANDROID_LOG}
        android                                   # <-- Android core
)
