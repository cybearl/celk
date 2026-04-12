cmake_minimum_required(VERSION 3.21)

project(celk-workers VERSION 0.0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Compiler flags
include(cmake/compilerFlags.cmake)

# Dependencies
include(cmake/dependencies.cmake)

# Core library (all sources except main.cpp, shared by the worker executable and tests)
# Note: Uses "CONFIGURE_DEPENDS" to automatically re-run CMake when new files are added
file(GLOB_RECURSE LIB_SOURCES CONFIGURE_DEPENDS includes/**/*.cpp includes/*.cpp src/**/*.cpp src/*.cpp)
list(FILTER LIB_SOURCES EXCLUDE REGEX ".*/main\\.cpp$")

add_library(workerLib STATIC ${LIB_SOURCES})
apply_compiler_flags(workerLib)

target_include_directories(workerLib PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/includes
    ${PCG_INCLUDE_DIRS}
)

target_link_libraries(workerLib PUBLIC
    fmt::fmt
    nlohmann_json::nlohmann_json
    unofficial::secp256k1
    unofficial::secp256k1_precomputed
    OpenSSL::Crypto
uint256_t
)

# Executable
add_executable(worker src/main.cpp)
apply_compiler_flags(worker)
target_link_libraries(worker PRIVATE workerLib)

# On Windows, copy all required runtime DLLs next to the executable after each build
if(WIN32)
    add_custom_command(TARGET worker POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
            $<TARGET_RUNTIME_DLLS:worker>
            $<TARGET_FILE_DIR:worker>
        COMMAND_EXPAND_LISTS
    )

    # `TARGET_RUNTIME_DLLS` misses OpenSSL because `FindOpenSSL.cmake` (module mode) sets
    # `IMPORTED_LOCATION` to the .lib, not the .dll, so CMake can't discover the DLL automatically,
    # deriving the DLL directory from the import lib path `(lib/ -> ../bin/)` and copying them explicitly
    get_target_property(_crypto_implib OpenSSL::Crypto IMPORTED_LOCATION)
    get_filename_component(_openssl_root "${_crypto_implib}/../.." ABSOLUTE)
    file(GLOB _openssl_dlls "${_openssl_root}/bin/libcrypto*.dll" "${_openssl_root}/bin/libssl*.dll")

    if(_openssl_dlls)
        add_custom_command(TARGET worker POST_BUILD
            COMMAND ${CMAKE_COMMAND} -E copy_if_different
                ${_openssl_dlls}
                $<TARGET_FILE_DIR:worker>
        )
    endif()
endif()

# Install into bin directory
install(TARGETS worker DESTINATION bin)

# On Windows, install runtime DLLs alongside the executable
if(WIN32)
    install(FILES $<TARGET_RUNTIME_DLLS:worker> DESTINATION bin)

    if(_openssl_dlls)
        install(FILES ${_openssl_dlls} DESTINATION bin)
    endif()
endif()

# Tests
enable_testing()

file(GLOB_RECURSE TEST_SOURCES CONFIGURE_DEPENDS tests/*.cpp tests/**/*.cpp)
add_executable(workerTests ${TEST_SOURCES})
apply_compiler_flags(workerTests)
target_link_libraries(workerTests PRIVATE workerLib Catch2::Catch2WithMain)

catch_discover_tests(workerTests)

# On Windows, copy all required runtime DLLs next to the test executable after each build
if(WIN32)
    add_custom_command(TARGET workerTests POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
            $<TARGET_RUNTIME_DLLS:workerTests>
            $<TARGET_FILE_DIR:workerTests>
        COMMAND_EXPAND_LISTS
    )

    if(_openssl_dlls)
        add_custom_command(TARGET workerTests POST_BUILD
            COMMAND ${CMAKE_COMMAND} -E copy_if_different
                ${_openssl_dlls}
                $<TARGET_FILE_DIR:workerTests>
        )
    endif()
endif()
