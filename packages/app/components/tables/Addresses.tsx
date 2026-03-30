import ConfirmationDialog from "@app/components/dialogs/Confirmation"
import ConcatenatedAddress from "@app/components/ui/addresses/ConcatenatedAddress"
import { Button, LinkButton } from "@app/components/ui/Button"
import { Checkbox } from "@app/components/ui/Checkbox"
import Flash from "@app/components/ui/Flash"
import ScientificNotation from "@app/components/ui/ScientificNotation"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@app/components/ui/Table"
import toast from "@app/components/ui/Toast"
import TruncatedDescription from "@app/components/ui/TruncatedDescription"
import type { AddressSelectModel } from "@app/db/schema/address"
import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"
import {
    getAddressExplorerUrl,
    getFormattedAddressNetwork,
    getFormattedAddressType,
    getPrivateKeyGeneratorLabel,
} from "@app/lib/base/utils/addresses"
import { formatDate } from "@app/lib/base/utils/miscellaneous"
import {
    numericStringToFormatted,
    numericStringToMetricFormatted,
    numericStringToScientific,
} from "@app/lib/base/utils/numerics"
import { formatAddressBalance, formatRawAddressBalance } from "@app/lib/base/utils/web3"
import { deleteAddressById, updateAddressIsDisabled } from "@app/queries/addresses"
import dedent from "dedent"
import { LinkIcon, TrashIcon } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

type AddressesTableProps = {
    dynamicConfig: DynamicConfigSelectModel | null
    addresses?: AddressSelectModel[] | null
}

export default function AddressesTable({ dynamicConfig, addresses }: AddressesTableProps) {
    // A local state for optimistic updates
    const [localAddresses, setLocalAddresses] = useState<AddressSelectModel[]>(addresses ?? [])

    /**
     * A mapping of each address ID to its corresponding explorer URL.
     */
    const addressExplorerUrlsMap = useMemo(() => {
        const map: Record<string, string | null> = {}

        addresses?.forEach(address => {
            const url = getAddressExplorerUrl(address.value, address.network)
            map[address.id] = url
        })

        return map
    }, [addresses])

    /**
     * Contains the IDs of all disabled addresses.
     */
    const disabledAddressIds = useMemo(
        () => new Set(localAddresses.filter(address => address.isDisabled).map(address => address.id)),
        [localAddresses],
    )

    /**
     * A helper to set a specific address as enabled or disabled.
     * @param id The ID of the address to update.
     * @param isDisabled Whether the address should be disabled or not
     */
    const setAddressDisabled = useCallback((id: string, isDisabled: boolean) => {
        setLocalAddresses(prev => {
            const next = [...prev]

            const index = next.findIndex(address => address.id === id)
            if (index !== -1) next[index] = { ...next[index], isDisabled }

            return next
        })
    }, [])

    /**
     * Handles enabling or disabling an address by its ID.
     * @param id The ID of the address to update.
     * @param isDisabled The new disabled state of the address.
     */
    const handleIsDisabledUpdate = useCallback(
        async (id: string, isDisabled: boolean) => {
            setAddressDisabled(id, isDisabled)

            try {
                await updateAddressIsDisabled(id, isDisabled)
            } catch {
                toast.error("An error occurred while trying to update the address, please try again.")
                setAddressDisabled(id, !isDisabled)
            }
        },
        [setAddressDisabled],
    )

    /**
     * Handle the deletion of an address by its ID.
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
                    {`Registered: ${(addresses?.length ?? 0).toLocaleString("en-US")}${dynamicConfig?.maxAddressesPerUser ? ` / ${dynamicConfig.maxAddressesPerUser.toLocaleString("en-US")}` : ""}`}
                </p>
            </TableCaption>

            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Generator</TableHead>
                    <TableHead>Range</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                    <TableHead className="text-right">Enabled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {addresses?.map(address => (
                    <TableRow key={address.id}>
                        <TableCell className="font-medium">{address.name}</TableCell>
                        <TableCell>
                            <TruncatedDescription>{address.description ?? undefined}</TruncatedDescription>
                        </TableCell>
                        <TableCell>{getPrivateKeyGeneratorLabel(address.privateKeyGenerator)}</TableCell>
                        <TableCell>
                            {address.privateKeyRangeStart || address.privateKeyRangeEnd ? (
                                <span className="text-sm whitespace-nowrap">
                                    {address.privateKeyRangeStart ? (
                                        <ScientificNotation
                                            value={numericStringToScientific(address.privateKeyRangeStart)}
                                        />
                                    ) : (
                                        "..."
                                    )}
                                    {" <-> "}
                                    {address.privateKeyRangeEnd ? (
                                        <ScientificNotation
                                            value={numericStringToScientific(address.privateKeyRangeEnd)}
                                        />
                                    ) : (
                                        "..."
                                    )}
                                </span>
                            ) : (
                                <span className="text-muted-foreground">N/A</span>
                            )}
                        </TableCell>
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
                        <TableCell className="text-right">
                            {address.balance ? (
                                <TruncatedDescription
                                    customContent={
                                        <ul className="list-disc pl-5">
                                            <li>
                                                Last checked at{" "}
                                                <Flash
                                                    value={
                                                        address.balanceCheckedAt
                                                            ? formatDate(address.balanceCheckedAt)
                                                            : "N/A"
                                                    }
                                                />
                                            </li>
                                            <li>
                                                Raw balance: <Flash value={formatRawAddressBalance(address)} />
                                            </li>
                                        </ul>
                                    }
                                >
                                    <Flash value={formatAddressBalance(address)} />
                                </TruncatedDescription>
                            ) : (
                                <span className="text-muted-foreground">N/A</span>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <TruncatedDescription
                                customContent={
                                    <Flash value={`${numericStringToFormatted(address.attempts)} attempts`} />
                                }
                            >
                                <Flash value={numericStringToMetricFormatted(address.attempts)} />
                            </TruncatedDescription>
                        </TableCell>
                        <TableCell className="text-right">
                            <Checkbox
                                className="mt-px ml-auto mr-3"
                                size="sm"
                                checked={!disabledAddressIds.has(address.id)}
                                onCheckedChange={isChecked => handleIsDisabledUpdate(address.id, !isChecked)}
                            />
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
