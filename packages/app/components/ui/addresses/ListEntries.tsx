import { Button } from "@app/components/ui/Button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@app/components/ui/Select"
import type { AddressSelectModel } from "@app/db/schema/address"
import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"
import { getFormattedAddressNetwork, getFormattedAddressType } from "@app/lib/base/utils/addresses"
import { TrashIcon } from "lucide-react"
import { useCallback, useState } from "react"

type AddressListEntriesProps = {
    dynamicConfig: DynamicConfigSelectModel | null
    addresses: AddressSelectModel[] | null
    value: string[]
    onChange: (ids: string[]) => void
}

export default function AddressListEntries({ dynamicConfig, addresses, value, onChange }: AddressListEntriesProps) {
    const [pendingId, setPendingId] = useState<string>("")

    const availableAddresses = addresses?.filter(a => !value.includes(a.id)) ?? []
    const selectedAddresses = addresses?.filter(a => value.includes(a.id)) ?? []

    /**
     * Adds the currently selected pending address ID to the list of selected IDs.
     */
    const handleAdd = useCallback(() => {
        if (!pendingId) return

        onChange([...value, pendingId])
        setPendingId("")
    }, [pendingId, value, onChange])

    /**
     * Removes an address ID from the list of selected IDs.
     * @param id The ID of the address to remove.
     */
    const handleRemove = useCallback((id: string) => onChange(value.filter(v => v !== id)), [value, onChange])

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <Select value={pendingId} onValueChange={setPendingId}>
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select an address" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {availableAddresses.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    No more addresses available
                                </div>
                            ) : (
                                availableAddresses.map(address => (
                                    <SelectItem key={address.id} value={address.id}>
                                        {address.name} ({getFormattedAddressNetwork(address.network)})
                                    </SelectItem>
                                ))
                            )}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                <Button type="button" variant="outline" disabled={!pendingId} onClick={handleAdd}>
                    Add
                </Button>
            </div>

            {selectedAddresses.length === 0 ? (
                <p className="text-muted-foreground text-xs">No addresses added to this list yet.</p>
            ) : (
                <div className="flex flex-col gap-1">
                    {selectedAddresses.map(address => (
                        <div
                            key={address.id}
                            className="flex items-center justify-between border border-border px-3 py-2 text-sm"
                        >
                            <div className="flex flex-col gap-0.5">
                                <span className="font-medium">{address.name}</span>
                                <span className="text-xs text-muted-foreground italic">
                                    {getFormattedAddressNetwork(address.network)} -{" "}
                                    {getFormattedAddressType(address.type)}
                                </span>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleRemove(address.id)}
                            >
                                <TrashIcon />
                            </Button>
                        </div>
                    ))}

                    <p className="text-muted-foreground text-xs">
                        {dynamicConfig !== null && addresses !== null
                            ? `${selectedAddresses.length.toLocaleString("en-US")} ${
                                  dynamicConfig.maxAddressesPerList !== undefined
                                      ? ` / ${dynamicConfig.maxAddressesPerList.toLocaleString("en-US")}`
                                      : ""
                              } address${dynamicConfig.maxAddressesPerList !== undefined || selectedAddresses.length > 1 ? "es" : ""} allowed.`
                            : null}
                    </p>
                </div>
            )}
        </div>
    )
}
