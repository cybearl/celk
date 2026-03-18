import ConfirmationDialog from "@app/components/dialogs/Confirmation"
import ConcatenatedAddress from "@app/components/ui/addresses/ConcatenatedAddress"
import { Button, LinkButton } from "@app/components/ui/Button"
import Flash from "@app/components/ui/Flash"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@app/components/ui/Table"
import toast from "@app/components/ui/Toast"
import type { AddressSelectModel } from "@app/db/schema/address"
import type { ConfigSelectModel } from "@app/db/schema/config"
import {
    getAddressExplorerUrl,
    getFormattedAddressNetwork,
    getFormattedAddressType,
} from "@app/lib/base/utils/addresses"
import { deleteAddressById } from "@app/queries/addresses"
import dedent from "dedent"
import { LinkIcon, TrashIcon } from "lucide-react"
import { useCallback, useMemo } from "react"

type AddressesTableProps = {
    config: ConfigSelectModel | null
    addresses?: AddressSelectModel[] | null
}

export default function AddressesTable({ config, addresses }: AddressesTableProps) {
    const addressExplorerUrlsMap = useMemo(() => {
        const map: Record<string, string | null> = {}

        addresses?.forEach(address => {
            const url = getAddressExplorerUrl(address.value, address.network)
            map[address.id] = url
        })

        return map
    }, [addresses])

    /**
     * Handles the deletion of an address by its ID.
     * @param id The ID of the address to delete.
     */
    const handleDeleteAddress = useCallback(async (id: string) => {
        try {
            await deleteAddressById(id)
            toast.success("Address deleted successfully.")
        } catch {
            toast.error("An error occurred while trying to delete the address, please try again.")
        }
    }, [])

    return (
        <Table className="border">
            <TableCaption className="pb-4">
                <p className="text-sm text-muted-foreground">
                    &gt;{" "}
                    {`Registered: ${addresses?.length ?? 0}${config?.maxAddressesPerUser ? ` / ${config.maxAddressesPerUser}` : ""}`}
                </p>
            </TableCaption>

            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Pre-encoding</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {addresses?.map(address => (
                    <TableRow key={address.id}>
                        <TableCell className="font-medium">{address.name}</TableCell>
                        <TableCell>{getFormattedAddressNetwork(address.network)}</TableCell>
                        <TableCell>{getFormattedAddressType(address.type)}</TableCell>
                        <TableCell>
                            {
                                <ConcatenatedAddress
                                    address={address.value}
                                    successCopyMessage="Address copied to clipboard!"
                                />
                            }
                        </TableCell>
                        <TableCell>
                            {address.preEncoding ? (
                                <ConcatenatedAddress
                                    address={address.preEncoding}
                                    successCopyMessage="Pre-encoding copied to clipboard!"
                                />
                            ) : (
                                "N/A"
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <Flash value={address.balance ? (address.balance ?? 0n).toLocaleString("en-US") : "N/A"} />
                        </TableCell>
                        <TableCell className="text-right">
                            <Flash value={address.attempts.toLocaleString("en-US")} />
                        </TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                            {addressExplorerUrlsMap[address.id] && (
                                <LinkButton
                                    variant="ghost"
                                    size="icon-sm"
                                    target="_blank"
                                    href={addressExplorerUrlsMap[address.id] ?? window.location.href}
                                >
                                    <LinkIcon />
                                </LinkButton>
                            )}

                            <ConfirmationDialog
                                title="Delete Address"
                                description={dedent`
                                    Are you sure you want to delete the address "${address.name}"?\n
                                    This action cannot be undone.
                                `}
                                cancelButtonText="Cancel"
                                confirmButtonText="Delete"
                                onConfirm={() => handleDeleteAddress(address.id)}
                            >
                                <Button variant="ghost" size="icon-sm">
                                    <TrashIcon />
                                </Button>
                            </ConfirmationDialog>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
