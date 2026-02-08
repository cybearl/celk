cmake_minimum_required(VERSION 3.20)

project(CppBase VERSION 0.0.1 LANGUAGES CXX)

# Standard
set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Executable
add_executable(CppBase src/main.cpp)

# Include Directories
target_include_directories(CppBase PRIVATE include)

# Flags
if(MSVC)
    target_compile_options(CppBase PRIVATE /W4 /WX)
else()
    target_compile_options(CppBase PRIVATE
        -Wall
        -Wextra
        -Wpedantic
        -Wshadow
        -Wnon-virtual-dtor
        -Wcast-align
        -Wunused
        -Woverloaded-virtual
        -Wnull-dereference
        -Wformat=2
    )
endif()