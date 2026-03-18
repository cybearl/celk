cmake_minimum_required(VERSION 3.20)

project(celk-workers VERSION 0.0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Compiler flags
include(cmake/compilerFlags.cmake)

# Header-only dependencies
find_path(PCG_INCLUDE_DIRS "pcg_extras.hpp")

# Dependencies
find_package(fmt CONFIG REQUIRED)
find_package(nlohmann_json CONFIG REQUIRED)
find_package(unofficial-secp256k1 CONFIG REQUIRED)
find_package(OpenSSL CONFIG REQUIRED)
find_package(unofficial-keccak-tiny CONFIG REQUIRED)

# Root directory for source files
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src)

# Executable
# Note: Uses "CONFIGURE_DEPENDS" to automatically re-run CMake when new source files are added
file(GLOB_RECURSE SOURCES CONFIGURE_DEPENDS src/**/*.cpp src/*.cpp)
add_executable(worker ${SOURCES})

# Included headers
#target_include_directories(worker PRIVATE include)

# Apply the compiler flags
apply_compiler_flags(worker)

# Link header-only dependencies
target_include_directories(worker PRIVATE
    ${PCG_INCLUDE_DIRS}
)

# Link libraries
target_link_libraries(worker PRIVATE
    fmt::fmt
    nlohmann_json::nlohmann_json
    unofficial::secp256k1
    OpenSSL::Crypto
    unofficial::keccak-tiny::keccak-tiny
)

# Install into bin directory
install(TARGETS worker DESTINATION bin)
