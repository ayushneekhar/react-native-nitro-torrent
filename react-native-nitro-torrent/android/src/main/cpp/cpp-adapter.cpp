#include <jni.h>
#include "NitroTorrentOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::nitrotorrent::initialize(vm);
}
