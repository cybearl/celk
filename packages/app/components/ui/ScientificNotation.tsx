type ScientificNotationProps = {
    value: [coefficient: string, exponent: number]
}

export default function ScientificNotation({ value: [coefficient, exponent] }: ScientificNotationProps) {
    if (exponent === 0) return <>{coefficient}</>

    return (
        <>
            {coefficient} x 10<sup className="font-medium"> {exponent}</sup>
        </>
    )
}
