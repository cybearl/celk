import ForgotPasswordForm from "@app/components/forms/ForgotPassword"
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
import { useCallback, useMemo, useState } from "react"

type AuthMode =
    | "sign-in"
    | "sign-up"
    | "forgot-password"
    | "require-email-verification"
    | "reset-password"
    | "forgot-password-email-sent"

type AuthDialogProps = {}

export default function AuthDialog({}: AuthDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [mode, setMode] = useState<AuthMode>("sign-in")

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
                return "If you can't find the email, please check your spam folder."
            case "reset-password":
                return "You can now enter a new password."
        }
    }, [mode])

    const FormComponent = useCallback(() => {
        switch (mode) {
            case "sign-up":
                return (
                    <SignUpForm
                        onSuccess={() => setIsOpen(false)}
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
                                            Sign In
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
                    />
                )
            case "sign-in":
                return (
                    <SignInForm
                        onSuccess={() => setIsOpen(false)}
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
                    />
                )
            case "forgot-password":
                return null
            case "forgot-password-email-sent":
                return null
            case "reset-password":
                return null
        }
    }, [mode])

    return (
        <div className="w-full h-full flex flex-col items-center justify-center px-1">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
