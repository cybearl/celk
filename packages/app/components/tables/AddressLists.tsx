import ConfirmationDialog from "@app/components/dialogs/Confirmation"
import { Button } from "@app/components/ui/Button"
import { Checkbox } from "@app/components/ui/Checkbox"
import Flash from "@app/components/ui/Flash"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@app/components/ui/Table"
import TextPopover from "@app/components/ui/TextPopover"
import toast from "@app/components/ui/Toast"
import type { AddressListSelectModel } from "@app/db/schema/addressList"
import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"
import { numericStringToFormatted, numericStringToMetricFormatted } from "@app/lib/base/utils/numerics"
import {
    deleteAddressListById,
    disableAddressList,
    enableAddressList,
    updateAddressListStopOnFirstMatch,
} from "@app/queries/addressLists"
import dedent from "dedent"
import { TrashIcon } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

type AddressListsTableProps = {
    dynamicConfig: DynamicConfigSelectModel | null
    addressLists?: AddressListSelectModel[] | null
}

export default function AddressListsTable({ dynamicConfig, addressLists }: AddressListsTableProps) {
    // A local state for optimistic updates
    const [localAddressLists, setLocalAddressLists] = useState<AddressListSelectModel[]>(addressLists ?? [])

    /**
     * Contain the IDs of all enabled address lists.
     */
    const enabledAddressListIds = useMemo(
        () => new Set(localAddressLists.filter(list => list.isEnabled).map(list => list.id)),
        [localAddressLists],
    )

    /**
     * Contain the IDs of all address lists that stop on the first match.
     */
    const stopOnFirstMatchAddressListIds = useMemo(
        () => new Set(localAddressLists.filter(list => list.stopOnFirstMatch).map(list => list.id)),
        [localAddressLists],
    )

    /**
     * A helper to set a specific address list as enabled or disabled.
     * @param id The ID of the address list to update.
     * @param isEnabled The new enabled state of the address list.
     */
    const setAddressListEnabled = useCallback((id: string, isEnabled: boolean) => {
        setLocalAddressLists(prev => {
            const next = [...prev]

            const index = next.findIndex(list => list.id === id)
            if (index !== -1) next[index] = { ...next[index], isEnabled }

            return next
        })
    }, [])

    /**
     * A helper to set the `stopOnFirstMatch` setting of an address list.
     * @param id The ID of the address list to update.
     * @param stopOnFirstMatch The new `stopOnFirstMatch` setting of the address list.
     */
    const setAddressListStopOnFirstMatch = useCallback((id: string, stopOnFirstMatch: boolean) => {
        setLocalAddressLists(prev => {
            const next = [...prev]

            const index = next.findIndex(list => list.id === id)
            if (index !== -1) next[index] = { ...next[index], stopOnFirstMatch }

            return next
        })
    }, [])

    /**
     * Handle enabling or disabling an address list by its ID.
     * @param id The ID of the address list to update.
     * @param isEnabled The new enabled state of the address list.
     */
    const handleIsEnabledUpdate = useCallback(
        (id: string, isEnabled: boolean) => {
            if (isEnabled === true) {
                if (dynamicConfig?.maxRunningAddressListsPerUser === undefined) {
                    toast.error(
                        "Cannot enable address list: max running address lists per user is not configured, try again or check the settings.",
                    )

                    return
                }

                if (enabledAddressListIds.size >= dynamicConfig.maxRunningAddressListsPerUser) {
                    toast.error(
                        `You can only enable up to ${dynamicConfig.maxRunningAddressListsPerUser.toLocaleString("en-US")} address lists at a time.`,
                    )

                    return
                }

                setAddressListEnabled(id, true)

                enableAddressList(id).catch(() => {
                    toast.error("An error occurred while trying to enable the address list, please try again.")
                    setAddressListEnabled(id, false)
                })
            } else if (isEnabled === false) {
                setAddressListEnabled(id, false)

                disableAddressList(id).catch(() => {
                    toast.error("An error occurred while trying to disable the address list, please try again.")
                    setAddressListEnabled(id, true)
                })
            }
        },
        [dynamicConfig?.maxRunningAddressListsPerUser, enabledAddressListIds, setAddressListEnabled],
    )

    /**
     * Handle toggling the `stopOnFirstMatch` setting of an address list by its ID.
     * @param id The ID of the address list to update.
     * @param stopOnFirstMatch The new `stopOnFirstMatch` setting of the address list.
     */
    const handleStopOnFirstMatchUpdate = useCallback(
        async (id: string, stopOnFirstMatch: boolean) => {
            setAddressListStopOnFirstMatch(id, stopOnFirstMatch)

            try {
                await updateAddressListStopOnFirstMatch(id, stopOnFirstMatch)
            } catch {
                toast.error("An error occurred while trying to update the address list, please try again.")
                setAddressListStopOnFirstMatch(id, !stopOnFirstMatch)
            }
        },
        [setAddressListStopOnFirstMatch],
    )

    /**
     * Handle the deletion of an address list by its ID.
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
                    {`Registered: ${(addressLists?.length ?? 0).toLocaleString("en-US")}${dynamicConfig?.maxAddressListsPerUser ? ` / ${dynamicConfig.maxAddressListsPerUser.toLocaleString("en-US")}` : ""}`}
                </p>
                <p className="text-sm text-muted-foreground">
                    &gt;{" "}
                    {`Running: ${enabledAddressListIds.size.toLocaleString("en-US")}${dynamicConfig?.maxRunningAddressListsPerUser ? ` / ${dynamicConfig.maxRunningAddressListsPerUser.toLocaleString("en-US")}` : ""}`}
                </p>
            </TableCaption>

            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                    <TableHead className="text-right">Enabled</TableHead>
                    <TableHead className="text-right">Stop on First Match</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {addressLists?.map(addressList => (
                    <TableRow key={addressList.id}>
                        <TableCell className="font-medium">{addressList.name}</TableCell>
                        <TableCell>
                            <TextPopover>{addressList.description}</TextPopover>
                        </TableCell>
                        <TableCell className="text-right">
                            <TextPopover
                                customContent={
                                    <Flash value={`${numericStringToFormatted(addressList.attempts)} attempts`} />
                                }
                            >
                                <Flash value={numericStringToMetricFormatted(addressList.attempts)} />
                            </TextPopover>
                        </TableCell>
                        <TableCell className="text-right">
                            <Checkbox
                                className="mt-px ml-auto mr-3"
                                size="sm"
                                checked={enabledAddressListIds.has(addressList.id)}
                                disabled={
                                    !enabledAddressListIds.has(addressList.id) &&
                                    dynamicConfig?.maxRunningAddressListsPerUser !== undefined &&
                                    enabledAddressListIds.size >= dynamicConfig.maxRunningAddressListsPerUser
                                }
                                onCheckedChange={isChecked => handleIsEnabledUpdate(addressList.id, Boolean(isChecked))}
                            />
                        </TableCell>
                        <TableCell className="text-right">
                            <Checkbox
                                className="mt-px ml-auto mr-3"
                                size="sm"
                                checked={stopOnFirstMatchAddressListIds.has(addressList.id)}
                                onCheckedChange={isChecked =>
                                    handleStopOnFirstMatchUpdate(addressList.id, Boolean(isChecked))
                                }
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
