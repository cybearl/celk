import ForgotPasswordEmailSentConfirmation from "@app/components/confirmations/ForgotPasswordEmailSent"
import VerifyEmailConfirmation from "@app/components/confirmations/VerifyEmail"
import ForgotPasswordForm from "@app/components/forms/ForgotPassword"
import ResetPasswordForm from "@app/components/forms/ResetPassword"
import SignInForm from "@app/components/forms/SignIn"
import SignUpForm from "@app/components/forms/SignUp"
import { Button, LinkButton } from "@app/components/ui/Button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@app/components/ui/Dialog"
import { DialogTrigger } from "@radix-ui/react-dialog"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/router"
import { useCallback, useEffect, useMemo, useState } from "react"

type AuthMode =
    | "sign-in"
    | "sign-up"
    | "forgot-password"
    | "require-email-verification"
    | "reset-password"
    | "forgot-password-email-sent"

export default function AuthDialog() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [isOpen, setIsOpen] = useState(false)
    const [mode, setMode] = useState<AuthMode>("sign-in")
    const [resetToken, setResetToken] = useState<string | null>(null)

    const [signUpEmail, setSignUpEmail] = useState("")

    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
    const [forgotPasswordRedirectTo, setForgotPasswordRedirectTo] = useState("")

    // On mount, check if the URL contains a password-reset redirect and open the dialog automatically
    // biome-ignore lint/correctness/useExhaustiveDependencies: Needs to only run once on mount
    useEffect(() => {
        if (searchParams.get("reset-password") !== "true") return

        setResetToken(searchParams.get("token"))
        setMode("reset-password")
        setIsOpen(true)

        const params = new URLSearchParams(searchParams.toString())
        params.delete("reset-password")
        params.delete("token")

        const search = params.toString()
        router.replace(search ? `/?${search}` : "/", undefined, { shallow: true })
    }, [])

    const dialogTitle = useMemo(() => {
        switch (mode) {
            case "sign-up":
                return "Sign Up"
            case "require-email-verification":
                return "Email Verification Required"
            case "sign-in":
                return "Sign In"
            case "forgot-password":
                return "Forgot Password"
            case "forgot-password-email-sent":
                return "Email Sent"
            case "reset-password":
                return "Reset Password"
        }
    }, [mode])

    const dialogDescription = useMemo(() => {
        switch (mode) {
            case "sign-up":
                return "Create a new account."
            case "require-email-verification":
                return "Please verify your email address."
            case "sign-in":
                return "Enter your credentials to sign in."
            case "forgot-password":
                return "Enter your email to reset your password."
            case "forgot-password-email-sent":
                return ""
            case "reset-password":
                return "You can now enter a new password."
        }
    }, [mode])

    /**
     * Handles dialog open state changes, deferring the mode/state reset until after
     * the close animation finishes (200ms) to avoid a sign-in flash during close.
     */
    const handleOpenChange = useCallback((open: boolean) => {
        setIsOpen(open)

        if (!open) {
            setTimeout(() => {
                setMode("sign-in")
                setResetToken(null)
                setSignUpEmail("")
                setForgotPasswordEmail("")
                setForgotPasswordRedirectTo("")
            }, 200)
        }
    }, [])

    /**
     * Redirects the user to the forgot password email sent confirmation screen,
     * while also saving the email address so the user can resend the email.
     * @param email The email address to send the password reset link to.
     * @param redirectTo The URL to redirect the user to after they click the link in their email.
     */
    const onForgotPasswordEmailSent = useCallback((email: string, redirectTo: string) => {
        setForgotPasswordEmail(email)
        setForgotPasswordRedirectTo(redirectTo)
        setMode("forgot-password-email-sent")
    }, [])

    const FormComponent = useCallback(() => {
        switch (mode) {
            case "sign-up":
                return (
                    <SignUpForm
                        trigger={isSubmitting => (
                            <DialogFooter>
                                <div className="w-full flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="text-muted-foreground text-sm">
                                                Already have an account?
                                            </span>
                                            <Button variant="link" size="sm" onClick={() => setMode("sign-in")}>
                                                Sign In
                                            </Button>
                                        </div>

                                        <Button type="submit" isLoading={isSubmitting}>
                                            Sign Up
                                        </Button>
                                    </div>

                                    <div className="text-center">
                                        <span className="text-muted-foreground text-sm">
                                            By creating an account, you agree to our{" "}
                                        </span>
                                        <LinkButton
                                            variant="link"
                                            size="sm"
                                            href="/terms-of-service"
                                            target="_blank"
                                            className="inline"
                                        >
                                            Terms of Service
                                        </LinkButton>
                                        <span className="text-muted-foreground text-sm"> and </span>
                                        <LinkButton
                                            variant="link"
                                            size="sm"
                                            href="/privacy-policy"
                                            target="_blank"
                                            className="inline"
                                        >
                                            Privacy Policy
                                        </LinkButton>
                                        .
                                    </div>
                                </div>
                            </DialogFooter>
                        )}
                        onSuccess={email => {
                            setSignUpEmail(email)
                            setMode("require-email-verification")
                        }}
                    />
                )
            case "require-email-verification":
                return (
                    <VerifyEmailConfirmation
                        email={signUpEmail}
                        onClose={() => handleOpenChange(false)}
                    />
                )
            case "sign-in":
                return (
                    <SignInForm
                        trigger={isSubmitting => (
                            <DialogFooter>
                                <div className="w-full flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <Button size="sm" variant="link" onClick={() => setMode("forgot-password")}>
                                            Forgot Password?
                                        </Button>

                                        <Button type="submit" isLoading={isSubmitting}>
                                            Sign In
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-center gap-1.5">
                                        <span className="text-muted-foreground text-sm">Don't have an account?</span>
                                        <Button variant="link" size="sm" onClick={() => setMode("sign-up")}>
                                            Sign Up
                                        </Button>
                                    </div>
                                </div>
                            </DialogFooter>
                        )}
                        onSuccess={() => handleOpenChange(false)}
                        onEmailNotVerified={email => {
                            setSignUpEmail(email)
                            setMode("require-email-verification")
                        }}
                    />
                )
            case "forgot-password":
                return (
                    <ForgotPasswordForm
                        trigger={isSubmitting => (
                            <DialogFooter>
                                <div className="w-full flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="text-muted-foreground text-sm">
                                                Remember your password?
                                            </span>
                                            <Button variant="link" size="sm" onClick={() => setMode("sign-in")}>
                                                Sign In
                                            </Button>
                                        </div>

                                        <Button type="submit" isLoading={isSubmitting}>
                                            Send Email
                                        </Button>
                                    </div>
                                </div>
                            </DialogFooter>
                        )}
                        redirectTo={`${window.location.origin}/?reset-password=true`}
                        onSuccess={email =>
                            onForgotPasswordEmailSent(email, `${window.location.origin}/?reset-password=true`)
                        }
                    />
                )
            case "forgot-password-email-sent":
                return (
                    <ForgotPasswordEmailSentConfirmation
                        email={forgotPasswordEmail}
                        redirectTo={forgotPasswordRedirectTo}
                        onClose={() => handleOpenChange(false)}
                    />
                )
            case "reset-password":
                return (
                    <ResetPasswordForm
                        trigger={isSubmitting => (
                            <DialogFooter>
                                <div className="w-full flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="text-muted-foreground text-sm">
                                                Remember your password?
                                            </span>
                                            <Button variant="link" size="sm" onClick={() => setMode("sign-in")}>
                                                Sign In
                                            </Button>
                                        </div>

                                        <Button type="submit" isLoading={isSubmitting}>
                                            Reset Password
                                        </Button>
                                    </div>
                                </div>
                            </DialogFooter>
                        )}
                        token={resetToken}
                        onSuccess={() => setMode("sign-in")}
                    />
                )
        }
    }, [mode, resetToken, signUpEmail, forgotPasswordEmail, forgotPasswordRedirectTo, handleOpenChange, onForgotPasswordEmailSent])

    return (
        <div className="w-full h-full flex flex-col items-center justify-center px-1">
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{dialogTitle}</DialogTitle>
                        <DialogDescription>{dialogDescription}</DialogDescription>
                    </DialogHeader>

                    <FormComponent />
                </DialogContent>

                <DialogTrigger asChild>
                    <Button variant="ghost">Sign Up / In</Button>
                </DialogTrigger>
            </Dialog>
        </div>
    )
}
