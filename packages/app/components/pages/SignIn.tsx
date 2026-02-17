import { useSessionContext } from "@app/components/contexts/Session"
import SignInForm from "@app/components/forms/SignIn"

export default function SignInPage() {
    const { session } = useSessionContext()

    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            {session ? <p>Welcome back, {session.user.name}!</p> : <SignInForm />}
        </div>
    )
}
