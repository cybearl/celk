import ConfirmationDialog from "@app/components/dialogs/Confirmation"
import { Button, LinkButton } from "@app/components/ui/Button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@app/components/ui/Table"
import toast from "@app/components/ui/Toast"
import type { AddressSelectModel } from "@app/db/schema/address"
import { getAddressExplorerUrl } from "@app/lib/client/utils/addresses"
import { getFormattedAddressNetwork, getFormattedAddressType } from "@app/lib/client/utils/formats"
import { deleteAddressById } from "@app/queries/addresses"
import dedent from "dedent"
import { Link, Trash } from "lucide-react"
import { useCallback, useMemo } from "react"

type AddressesTableProps = {
    addresses?: AddressSelectModel[] | null
}

export default function AddressesTable({ addresses }: AddressesTableProps) {
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
                {!addresses || addresses.length === 0
                    ? "No addresses found."
                    : `${addresses.length} address${addresses.length > 1 ? "es" : ""} registered.`}
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
                        <TableCell>{address.value}</TableCell>
                        <TableCell>{address.preEncoding ?? "N/A"}</TableCell>
                        <TableCell className="text-right">{address.balance?.toString() ?? "-"}</TableCell>
                        <TableCell className="text-right">{address.attempts.toString()}</TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                            {addressExplorerUrlsMap[address.id] && (
                                <LinkButton
                                    variant="ghost"
                                    size="icon-sm"
                                    target="_blank"
                                    href={addressExplorerUrlsMap[address.id] ?? window.location.href}
                                >
                                    <Link />
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
                                    <Trash />
                                </Button>
                            </ConfirmationDialog>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
