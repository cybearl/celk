cmake_minimum_required(VERSION 3.20)

project(celk-workers VERSION 0.0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Compiler flags
include(cmake/compiler_flags.cmake)

# Dependencies
find_package(fmt CONFIG REQUIRED)
find_package(nlohmann_json CONFIG REQUIRED)

# Executable
add_executable(worker src/main.cpp)

# Included headers
target_include_directories(worker PRIVATE include)

# Apply the compiler flags
apply_compiler_flags(worker)

# Dependencies (defined in deps CMake files)
target_link_libraries(worker PRIVATE
    fmt::fmt
    nlohmann_json::nlohmann_json
)

install(TARGETS worker DESTINATION bin)
