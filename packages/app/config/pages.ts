/**
 * The pages for the main layout.
 */
export enum MAIN_LAYOUT_PAGE {
    HOME = "home",
    ABOUT = "about",
    DASHBOARD = "dashboard",
    SETTINGS = "settings",
}

/**
 * Pages that can only be accessed when logged in.
 */
export const LOGGED_IN_ONLY_PAGES: MAIN_LAYOUT_PAGE[] = [MAIN_LAYOUT_PAGE.DASHBOARD, MAIN_LAYOUT_PAGE.SETTINGS]

/**
 * Pages that are forbidden for locked users.
 */
export const LOCKED_FORBIDDEN_PAGES: MAIN_LAYOUT_PAGE[] = [MAIN_LAYOUT_PAGE.SETTINGS]
