require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NitroTorrent"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported, :visionos => 1.0 }
  s.source       = { :git => "https://github.com/mrousavy/nitro.git", :tag => "#{s.version}" }

  s.source_files = [
    # Implementation (Swift)
    "ios/**/*.{swift}",
    # Autolinking/Registration (Objective-C++)
    "ios/**/*.{m,mm}",
    # Implementation (C++ objects)
    "cpp/**/*.{hpp,cpp}",
    # Vendored libtorrent sources (built directly in the pod target on iOS)
    "third_party/libtorrent/include/**/*.{h,hpp}",
    "third_party/libtorrent/src/**/*.cpp",
    "third_party/libtorrent/deps/try_signal/**/*.{h,hpp,cpp}",
  ]
  s.exclude_files = [
    # Match Android's `encryption OFF` build and avoid OpenSSL on iOS for now.
    "third_party/libtorrent/src/pe_crypto.cpp",
  ]
  s.ios.frameworks = ["CoreFoundation", "SystemConfiguration"]

  current_pod_target_xcconfig = s.attributes_hash["pod_target_xcconfig"] || {}
  current_header_search_paths = current_pod_target_xcconfig["HEADER_SEARCH_PATHS"]
  current_other_cxx_flags = current_pod_target_xcconfig["OTHER_CPLUSPLUSFLAGS"]
  current_definitions = current_pod_target_xcconfig["GCC_PREPROCESSOR_DEFINITIONS"]
  s.pod_target_xcconfig = current_pod_target_xcconfig.merge({
    "HEADER_SEARCH_PATHS" => [
      current_header_search_paths,
      "$(PODS_TARGET_SRCROOT)/third_party/libtorrent/include",
      "$(PODS_TARGET_SRCROOT)/third_party/libtorrent/deps/try_signal",
      "$(PODS_TARGET_SRCROOT)/third_party/boost",
      "$(PODS_TARGET_SRCROOT)/nitrogen/generated/shared/c++",
      "$(PODS_TARGET_SRCROOT)/nitrogen/generated/ios",
      "$(PODS_TARGET_SRCROOT)/nitrogen/generated/ios/c++",
    ].compact.join(" "),
    "OTHER_CPLUSPLUSFLAGS" => [
      current_other_cxx_flags,
      "$(inherited)",
      "-fexceptions",
      "-frtti",
    ].compact.join(" "),
    "GCC_PREPROCESSOR_DEFINITIONS" => [
      current_definitions,
      "$(inherited)",
      "BOOST_ASIO_ENABLE_CANCELIO",
      "BOOST_ASIO_NO_DEPRECATED",
      "BOOST_ASIO_HAS_STD_CHRONO",
      "BOOST_EXCEPTION_DISABLE",
      "BOOST_SYSTEM_NO_DEPRECATED",
      "TORRENT_BUILDING_LIBRARY",
      "TORRENT_DISABLE_ENCRYPTION",
      "TORRENT_NO_DEPRECATE",
      "_FILE_OFFSET_BITS=64",
    ].compact.join(" "),
  })

  load 'nitrogen/generated/ios/NitroTorrent+autolinking.rb'
  add_nitrogen_files(s)

  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'
  install_modules_dependencies(s)
end
