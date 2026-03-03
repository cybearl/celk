import AddAddressDialog from "@app/components/dialogs/AddAddress"
import type { AddAddressFormData } from "@app/components/forms/AddAddress"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@app/components/ui/Table"
import type { SerializedAddressSelectModel } from "@app/db/schema/address"
import { useCallback } from "react"

type AddressesProps = {
    addresses: SerializedAddressSelectModel[]
}

export default function Addresses({ addresses }: AddressesProps) {
    // biome-ignore lint/suspicious/useAwait: Placeholder
    const onAddAddress = useCallback(async (_data: AddAddressFormData) => {
        return {}
    }, [])

    return (
        <div>
            <AddAddressDialog onAddAddress={onAddAddress} />

            <Table>
                <TableCaption>
                    {addresses.length === 0 ? "No addresses found." : `${addresses.length} address(es) registered.`}
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
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {addresses.map(address => (
                        <TableRow key={address.id}>
                            <TableCell className="font-medium">{address.name}</TableCell>
                            <TableCell>{address.type}</TableCell>
                            <TableCell>{address.network}</TableCell>
                            <TableCell className="font-mono text-xs">{address.value}</TableCell>
                            <TableCell className="font-mono text-xs">{address.preEncoding}</TableCell>
                            <TableCell className="text-right">{address.balance ?? "-"}</TableCell>
                            <TableCell className="text-right">{address.attempts}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
