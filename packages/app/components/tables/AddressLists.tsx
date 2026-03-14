import ConfirmationDialog from "@app/components/dialogs/Confirmation"
import { Button } from "@app/components/ui/Button"
import { Checkbox } from "@app/components/ui/Checkbox"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@app/components/ui/Table"
import toast from "@app/components/ui/Toast"
import type { AddressListSelectModel } from "@app/db/schema/addressList"
import type { ConfigSelectModel } from "@app/db/schema/config"
import { deleteAddressListById, disableAddressList, enableAddressList } from "@app/queries/addressLists"
import dedent from "dedent"
import { TrashIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

type AddressListsTableProps = {
    config: ConfigSelectModel | null
    addressLists?: AddressListSelectModel[] | null
}

export default function AddressListsTable({ config, addressLists }: AddressListsTableProps) {
    const [enabledAddressListIds, setEnabledAddressListIds] = useState<string[]>([])

    // Keeps in sync the local list of enabled address list IDs
    useEffect(() => {
        setEnabledAddressListIds(addressLists?.filter(list => list.isEnabled).map(list => list.id) || [])
    }, [addressLists])

    /**
     * Handles enabling or disabling an address list by its ID.
     * @param id The ID of the address list to update.
     * @param isEnabled The new enabled state of the address list.
     */
    const handleToggleAddressList = useCallback(
        (id: string, isEnabled: boolean | "indeterminate") => {
            if (isEnabled === true) {
                if (config?.maxRunningAddressListsPerUser === undefined) {
                    toast.error(
                        "Cannot enable address list: max running address lists per user is not configured, try again or check the settings.",
                    )
                    return
                }

                if (enabledAddressListIds.length >= config.maxRunningAddressListsPerUser) {
                    toast.error(
                        `You can only enable up to ${config.maxRunningAddressListsPerUser} address lists at a time.`,
                    )
                    return
                }

                setEnabledAddressListIds(prev => [...prev, id])
                enableAddressList(id).catch(() => {
                    toast.error("An error occurred while trying to enable the address list, please try again.")
                    setEnabledAddressListIds(prev => prev.filter(listId => listId !== id))
                })
            } else if (isEnabled === false) {
                setEnabledAddressListIds(prev => prev.filter(listId => listId !== id))
                disableAddressList(id).catch(() => {
                    toast.error("An error occurred while trying to disable the address list, please try again.")
                    setEnabledAddressListIds(prev => [...prev, id])
                })
            }
        },
        [config?.maxRunningAddressListsPerUser, enabledAddressListIds],
    )

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
            <TableCaption className="pb-4 space-y-1 italic">
                <p className="text-sm text-muted-foreground">
                    &gt;{" "}
                    {`Registered: ${addressLists?.length ?? 0}${config?.maxAddressListsPerUser ? ` / ${config.maxAddressListsPerUser}` : ""}`}
                </p>
                <p className="text-sm text-muted-foreground">
                    &gt;{" "}
                    {`Running: ${enabledAddressListIds.length}${config?.maxRunningAddressListsPerUser ? ` / ${config.maxRunningAddressListsPerUser}` : ""}`}
                </p>
            </TableCaption>

            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                    <TableHead className="text-right">Enabled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {addressLists?.map(addressList => (
                    <TableRow key={addressList.id}>
                        <TableCell className="font-medium">{addressList.name}</TableCell>
                        <TableCell>{addressList.description ?? "N/A"}</TableCell>
                        <TableCell className="text-right">{addressList.attempts.toString()}</TableCell>
                        <TableCell className="text-right">
                            <Checkbox
                                className="mt-px ml-auto mr-3"
                                size="sm"
                                checked={enabledAddressListIds.includes(addressList.id)}
                                disabled={
                                    !enabledAddressListIds.includes(addressList.id) &&
                                    config?.maxRunningAddressListsPerUser !== undefined &&
                                    enabledAddressListIds.length >= config.maxRunningAddressListsPerUser
                                }
                                onCheckedChange={isChecked => handleToggleAddressList(addressList.id, isChecked)}
                            />
                        </TableCell>
                        <TableCell className="text-right">
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
