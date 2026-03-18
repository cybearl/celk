# Wraps all compiler flags in a reusable function.
# Usage: apply_compiler_flags(<target>)
function(apply_compiler_flags target)
    if(MSVC)
        target_compile_options(${target} PRIVATE /W4 /WX)
        target_compile_options(${target} PRIVATE $<$<CONFIG:Release>:/O2>)
    else()
        target_compile_options(${target} PRIVATE
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
        target_compile_options(${target} PRIVATE $<$<CONFIG:Release>:-O3 -DNDEBUG>)
    endif()
endfunction()
