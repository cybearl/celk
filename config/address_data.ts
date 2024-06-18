/**
 * The configuration for the address data cron job and its worker.
 */
const addressDataConfig = {
    initialDelay: 2000, // in milliseconds
    repeatEvery: 10000, // in milliseconds
    fetchEvery: 2, // in hours (per address)
}

export default addressDataConfig
