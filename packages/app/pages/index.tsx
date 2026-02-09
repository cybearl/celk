import MainBackground from "@app/components/backgrounds/Main"
import AppTabs from "@app/components/tabs/App"
import { PUBLIC_ENV } from "@app/config/env"

export default function Homepage() {
    return (
        <div className="flex flex-col h-screen w-screen justify-center items-center">
            <MainBackground
                topLeftSection={<AppTabs />}
                topRightSection={<p className="text-foreground font-medium px-2">1,151,448,484</p>}
                bottomLeftSection={<p className="text-foreground font-medium pb-1.5 px-2">v{PUBLIC_ENV.version}</p>}
                bottomRightSection={<p className="text-foreground font-medium pb-1.5 px-2">nano-celk</p>}
            />

            {/*<h1>nano-celk</h1>
            <h3>A small application for trying to brute-force a set of Ethereum addresses.</h3>*/}
        </div>
    )
}
