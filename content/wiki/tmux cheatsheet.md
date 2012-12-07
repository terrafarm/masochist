---
tags: tmux
---

Not a comprehensive cheatsheet, but stuff that I keep forgetting and want to remember:

# Mappings

-   `[prefix] C-o`: rotate windows within the current pane
-   `[prefix] "`: vertical split (I have this remapped to `[prefix] |` and `[prefix] \` for convenience)
-   `[prefix] %`: horizontal split (I have this mapped to `[prefix] -` for convenience)

# Commands

-   `:clear-history`: clear scrollback buffer of currently selected pane
-   `:break-pane`: break current pane into a new window
-   `:join-pane -t [window]`: inverse of `:break-pane`

# Recipes

## Move current window to the left/right =

-   `:move-window -t +1`: move to the right
-   `:move-window -t -1`: move to the left

## Swap the current window with another

-   `:move-window -t N`: swaps current window with window at N
-   `:move-window -s N -t M`: swaps window at M with window at N

## Jump to previous/next window =

-   `:previous-window` or `[prefix]-p`
-   `:next-window` or `[prefix]-n`

I wanted to be super clever here and make use of, say `[prefix]-[` and `[prefix]-]` to echo the familiar shortcuts for jumping between tabs, but that would class with the standard bindings for entering copy mode and pasting.

I considered instead binding to `[prefix]-CTRL-[` and `[prefix]-CTRL-]`, but is too subtle and close to the copy mode bindings, making it easy to do the wrong thing. Oh well.