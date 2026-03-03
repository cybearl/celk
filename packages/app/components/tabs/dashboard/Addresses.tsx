import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@app/components/ui/Table"
import type { SerializedAddressSelectModel } from "@app/db/schema/address"

type AddressesProps = {
    addresses: SerializedAddressSelectModel[]
}

export default function Addresses({ addresses }: AddressesProps) {
    return (
        <div>
            <Table>
                <TableCaption>
                    {addresses.length === 0 ? "No addresses found." : `${addresses.length} address(es) registered.`}
                </TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Network</TableHead>
                        <TableHead>Value</TableHead>
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
                            <TableCell className="text-right">{address.balance ?? "-"}</TableCell>
                            <TableCell className="text-right">{address.attempts}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
