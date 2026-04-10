# Header-only dependencies
find_path(PCG_INCLUDE_DIRS "pcg_extras.hpp")

# Dependencies
find_package(fmt CONFIG REQUIRED)
find_package(nlohmann_json CONFIG REQUIRED)
find_package(unofficial-secp256k1 CONFIG REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(unofficial-keccak-tiny CONFIG REQUIRED)

# Fetch uint128_t (not on vcpkg, no CMakeLists.txt, defining target manually)
include(FetchContent)
FetchContent_Declare(
    uint128_t
    GIT_REPOSITORY https://github.com/calccrypto/uint128_t.git
    GIT_TAG        master
)
FetchContent_MakeAvailable(uint128_t)
add_library(uint128_t STATIC ${uint128_t_SOURCE_DIR}/uint128_t.cpp)
target_include_directories(uint128_t PUBLIC ${uint128_t_SOURCE_DIR})

# On Windows, _DLL is explicitly defined by the cmake/vcpkg toolchain for MSVC-ABI builds,
# which makes the calccrypto headers use __declspec(dllimport) even when linking statically,
# we're just bypassing their config guards and defining the decorators as empty to fix this
if(WIN32)
    target_compile_definitions(uint128_t PUBLIC
        _UINT128_T_CONFIG_
        "_UINT128_T_EXPORT="
        "_UINT128_T_IMPORT="
    )
endif()

# Fetch uint256_t (not on vcpkg, no CMakeLists.txt, defining target manually)
FetchContent_Declare(
    uint256_t
    GIT_REPOSITORY https://github.com/calccrypto/uint256_t.git
    GIT_TAG        master
)
FetchContent_MakeAvailable(uint256_t)
add_library(uint256_t STATIC ${uint256_t_SOURCE_DIR}/uint256_t.cpp)
target_include_directories(uint256_t PUBLIC ${uint256_t_SOURCE_DIR})
target_link_libraries(uint256_t PUBLIC uint128_t)

if(WIN32)
    target_compile_definitions(uint256_t PUBLIC
        _UINT256_T_CONFIG_
        "_UINT256_T_EXPORT="
        "_UINT256_T_IMPORT="
    )
endif()

# Testing framework — fetched from source so it compiles with the project's own compiler,
# avoiding MSVC/clang ABI mismatches that arise when linking against vcpkg-prebuilt binaries
FetchContent_Declare(
    Catch2
    GIT_REPOSITORY https://github.com/catchorg/Catch2.git
    GIT_TAG        v3.5.4
)
FetchContent_MakeAvailable(Catch2)
list(APPEND CMAKE_MODULE_PATH ${catch2_SOURCE_DIR}/extras)
include(Catch)
