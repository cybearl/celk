import ConfirmationDialog from "@app/components/dialogs/Confirmation"
import { Button } from "@app/components/ui/Button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@app/components/ui/Table"
import toast from "@app/components/ui/Toast"
import type { AddressListSelectModel } from "@app/db/schema/addressList"
import type { ConfigSelectModel } from "@app/db/schema/config"
import { deleteAddressListById } from "@app/queries/addressLists"
import dedent from "dedent"
import { Trash } from "lucide-react"
import { useCallback } from "react"

type AddressListsTableProps = {
    config: ConfigSelectModel | null
    addressLists?: AddressListSelectModel[] | null
}

export default function AddressListsTable({ config, addressLists }: AddressListsTableProps) {
    /**
     * Handles the deletion of an address list by its ID.
     * @param id The ID of the address list to delete.
     */
    const handleDeleteAddressList = useCallback(async (id: string) => {
        try {
            await deleteAddressListById(id)
            toast.success("Address list deleted successfully.")
        } catch {
            toast.error("An error occurred while trying to delete the address list, please try again.")
        }
    }, [])

    return (
        <Table className="border">
            <TableCaption className="pb-4">
                {!addressLists || addressLists.length === 0
                    ? "No address lists found."
                    : dedent`${addressLists.length}${config?.maxAddressListsPerUser ? ` / ${config.maxAddressListsPerUser}` : ""}
                            address list${config?.maxAddressListsPerUser !== undefined || addressLists.length > 1 ? "s" : ""}
                            registered.`}
            </TableCaption>

            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {addressLists?.map(addressList => (
                    <TableRow key={addressList.id}>
                        <TableCell className="font-medium">{addressList.name}</TableCell>
                        <TableCell>{addressList.description ?? "N/A"}</TableCell>
                        <TableCell className="text-right">{addressList.attempts.toString()}</TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                            <ConfirmationDialog
                                title="Delete Address List"
                                description={dedent`
                                    Are you sure you want to delete the list "${addressList.name}"?\n
                                    This action cannot be undone.
                                `}
                                cancelButtonText="Cancel"
                                confirmButtonText="Delete"
                                onConfirm={() => handleDeleteAddressList(addressList.id)}
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
