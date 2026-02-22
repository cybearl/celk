/**
 * The pages for the main layout.
 */
export enum MainLayoutPage {
    HOME = "home",
    ABOUT = "about",
    DASHBOARD = "dashboard",
    SETTINGS = "settings",
}

/**
 * Pages that can only be accessed when logged in.
 */
export const LOGGED_IN_ONLY_PAGES: MainLayoutPage[] = [MainLayoutPage.DASHBOARD, MainLayoutPage.SETTINGS]
