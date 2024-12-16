import { test } from "@japa/runner"
import AddressGenerator from "#kernel/generators/address_generator"

const enableDebugging = false
const fixedPrivateKey1 = "0000000000000000000000000000000000000000000000000000000000000001"

test.group("address_generator / private key injection for testing", (group) => {
    let addressGenerator: AddressGenerator

    group.each.setup(() => {
        addressGenerator = new AddressGenerator("MEMORY_SLOT::BTC33", {
            injectedHexPrivateKey: fixedPrivateKey1,
            enableDebugging: enableDebugging,
        })
    })

    test("It should return the properly injected private key via the 'PrivateKeyGenerator._injectedHexPrivateKey' option", ({
        expect,
    }) => {
        addressGenerator.executeInstruction(0)
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(fixedPrivateKey1)
    })
})

/**
 * Test values sourced from:
 * https://www.rfctools.com/bitcoin-address-test-tool/
 */
test.group("address_generator / memory slot generations", () => {
    test("MEMORY_SLOT::BTC33", ({ expect }) => {
        const privateKey = "0765E02476F4B84F2E44FE1882B2612A7FE0EAEE62C0C6B11DBCC336A6265852"
        const publicKey = "02B0AE5F7A9955F7CCF6851AF1EB59F5B1AA0C384E525F60A7521770443450160F"
        const sha256 = "6405A9FE83FC3895B698D294D5609F55E8072006FD3E144DB6ECB0DAD6E62D80"
        const ripemd160 = "C51632E43113797078001B20C5A4BC41B7389BFD"

        const addressGenerator = new AddressGenerator("MEMORY_SLOT::BTC33", {
            injectedHexPrivateKey: privateKey,
            enableDebugging: enableDebugging,
        })

        addressGenerator.executeInstructions()
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(privateKey)
        expect(addressGenerator.cache.readHexString(32, 33)).toBe(publicKey)
        expect(addressGenerator.cache.readHexString(65, 32)).toBe(sha256)
        expect(addressGenerator.cache.readHexString(97, 20)).toBe(ripemd160)
    })

    test("MEMORY_SLOT::BTC65", ({ expect }) => {
        const privateKey = "D17351FB80B81B4780BFB98BF8614179275C784D52B23FA945A6EBD6D8A07D6F"
        const publicKey =
            "04B21B7D3264081687AF835FAF57F04C81CF23170B08266DA36C98F93F156AC9336B74F8B560145E294EB913B21D6860CA5E16B03C34D66799555CD617665551E0"
        const sha256 = "CF34DF803A31B6F2EAB236AD8FEB503FE8CD1416E47303A7A8EC82D69CE7DE49"
        const ripemd160 = "D284DCCB02F91219D792736D92C3C177D9A4D580"

        const addressGenerator = new AddressGenerator("MEMORY_SLOT::BTC65", {
            injectedHexPrivateKey: privateKey,
            enableDebugging: enableDebugging,
        })

        addressGenerator.executeInstructions()
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(privateKey)
        expect(addressGenerator.cache.readHexString(32, 65)).toBe(publicKey)
        expect(addressGenerator.cache.readHexString(97, 32)).toBe(sha256)
        expect(addressGenerator.cache.readHexString(129, 20)).toBe(ripemd160)
    })

    test("MEMORY_SLOT::BTC33::P2SH", ({ expect }) => {
        const privateKey = "EBDE120A714C865F723B1BFE4749337BCD32006E53A210D7FFDC436A6567C63C"
        const publicKey = "03B7B3223A6774B9A1EF147E061EC159F4A63EE80DF53CF9048BC8BD34E2062720"
        const sha256 = "03C69BD5C1420B31D9B8E6CFBD7EE7FCA17E887679313A5E73945CC908728CDF"
        const p2shPrefix = "0014"
        const ripemd160 = "5351AB84FCF75B39611162E1CC2A655EE2D9A681"
        const sha256v2 = "082502F80591F73B5DD55154FFFC4FF54B656208AA37DA25C16E5042865A740F"
        const ripemd160v2 = "1A3D8D46905072DE931063A89B3A0845E1B27D03"

        const addressGenerator = new AddressGenerator("MEMORY_SLOT::BTC33::P2SH", {
            injectedHexPrivateKey: privateKey,
            enableDebugging: enableDebugging,
        })

        addressGenerator.executeInstructions()
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(privateKey)
        expect(addressGenerator.cache.readHexString(32, 33)).toBe(publicKey)
        expect(addressGenerator.cache.readHexString(65, 32)).toBe(sha256)
        expect(addressGenerator.cache.readHexString(97, 2)).toBe(p2shPrefix)
        expect(addressGenerator.cache.readHexString(99, 20)).toBe(ripemd160)
        expect(addressGenerator.cache.readHexString(119, 32)).toBe(sha256v2)
        expect(addressGenerator.cache.readHexString(151, 20)).toBe(ripemd160v2)
    })

    test("MEMORY_SLOT::BTC65::P2SH", ({ expect }) => {
        const privateKey = "EBDE120A714C865F723B1BFE4749337BCD32006E53A210D7FFDC436A6567C63C"
        const publicKey =
            "04B7B3223A6774B9A1EF147E061EC159F4A63EE80DF53CF9048BC8BD34E20627203D7A90D76B03EA44FECBC4A03F6A487262508787641A2569A4FA5B5B2A3ACF87"
        const sha256 = "7DBCB5B23E6E6E61E0B3DA3FEE00094F191440C7FB8586D28008488A886423EB"
        const p2shPrefix = "0014"
        const ripemd160 = "83BE9309F4BEA882C2216A3B7BED4A2CD1ED69B8"
        const sha256v2 = "C4BD4066871E39652D29DB35834722BA7D13EDB53D1106E123C88041BCD8DAA8"
        const ripemd160v2 = "57202D1293B07FD053F961A985BD3A424AA83A91"

        const addressGenerator = new AddressGenerator("MEMORY_SLOT::BTC65::P2SH", {
            injectedHexPrivateKey: privateKey,
            enableDebugging: enableDebugging,
        })

        addressGenerator.executeInstructions()
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(privateKey)
        expect(addressGenerator.cache.readHexString(32, 65)).toBe(publicKey)
        expect(addressGenerator.cache.readHexString(97, 32)).toBe(sha256)
        expect(addressGenerator.cache.readHexString(129, 2)).toBe(p2shPrefix)
        expect(addressGenerator.cache.readHexString(131, 20)).toBe(ripemd160)
        expect(addressGenerator.cache.readHexString(151, 32)).toBe(sha256v2)
        expect(addressGenerator.cache.readHexString(183, 20)).toBe(ripemd160v2)
    })

    test("MEMORY_SLOT::BTC33::P2WSH", ({ expect }) => {
        const privateKey = "E2BB8EF70D2F0D36B9051E449EF2312F6515303FE228B38717E092977874D731"
        const publicKey = "02FD41D2B03DE290140A2F576EA492D9F3A82F18AB9301190E4DCF4E6BEC341675"
        const sha256 = "26754241776257E61E4641CA948AD7E49896B8295FB73B43854E82094B740E75"

        const addressGenerator = new AddressGenerator("MEMORY_SLOT::BTC33::P2WSH", {
            injectedHexPrivateKey: privateKey,
            enableDebugging: enableDebugging,
        })

        addressGenerator.executeInstructions()
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(privateKey)
        expect(addressGenerator.cache.readHexString(32, 33)).toBe(publicKey)
        expect(addressGenerator.cache.readHexString(65, 32)).toBe(sha256)
    })

    test("MEMORY_SLOT::BTC65::P2WSH", ({ expect }) => {
        const privateKey = "986B70BA84DD99F3DBCE04C534AEC4B861E4C3417C94BEC7BFFE79B796C92BEF"
        const publicKey =
            "04EFE21160D36ACE3775F560C1F0AFDA47D75B95FA989305C1E03C956ADB0BA7436D7806539E5E1020EF438CA814062C7BBAAE0880F37040C4D8DFBAB35E8500F3"
        const sha256 = "9EE1B639CC6BE910C767196A91E292E7942F2FC2B2C64A3D6693E5085C6E013E"

        const addressGenerator = new AddressGenerator("MEMORY_SLOT::BTC65::P2WSH", {
            injectedHexPrivateKey: privateKey,
            enableDebugging: enableDebugging,
        })

        addressGenerator.executeInstructions()
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(privateKey)
        expect(addressGenerator.cache.readHexString(32, 65)).toBe(publicKey)
        expect(addressGenerator.cache.readHexString(97, 32)).toBe(sha256)
    })

    test("MEMORY_SLOT::EVM64", ({ expect }) => {
        const privateKey = "427D3D653001CF9999297890C19DD7A7D191F87E89A6E5B187C2723C14BEC281"
        const publicKey =
            "A4350884C406C5A639E4E79A58283F86C32B42955AFC7851FF26B3D94A4E936FF83DB39110A3FB6BD470D4EB1D2F4903B4B35360E2BC57C4DD8710E59FDEF32E"
        const keccak256 = "E41DF1704CFB51078E26C6E599B9B93254FCB5043CC43633DF49CFDB74109160"

        const addressGenerator = new AddressGenerator("MEMORY_SLOT::EVM64", {
            injectedHexPrivateKey: privateKey,
            enableDebugging: enableDebugging,
        })

        addressGenerator.executeInstructions()
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(privateKey)
        expect(addressGenerator.cache.readHexString(32, 64)).toBe(publicKey)
        expect(addressGenerator.cache.readHexString(96, 32)).toBe(keccak256)
    })

    test("BTC33::P2PKH", ({ expect }) => {
        const privateKey = "90999DFDB17F574B14DB04B9F4C32AA2BDC3EA4725F2C16AA3EDB9B0D9D016D5"
        const publicKey = "02C3A1610084E17BD588D040B153A9C9C9276268B21D5874A8F515346A8D71589B"
        const sha256 = "AFC228185D940746EF24C38B298110977333246411A5579828FE49E4E2153229"
        const networkByte = "00"
        const ripemd160 = "F0B002982A5D90A0A027A16201F4C42486BA94E5"
        const sha256v2 = "6E85B6E822591B7B9750A817B07D5AB13DB6B3DC112E21ED728F017FE9121B12" // Overwrites the previous sha256
        const address = "1Nwe2SPsFjNXHSex9NjEzDxjNqPBCzzupT"

        const addressGenerator = new AddressGenerator("BTC33::P2PKH", {
            injectedHexPrivateKey: privateKey,
            enableDebugging: true,
        })

        const result = addressGenerator.executeInstructions()
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(privateKey)
        expect(addressGenerator.cache.readHexString(32, 33)).toBe(publicKey)
        expect(addressGenerator.cache.readHexString(65, 32)).toBe(sha256)
        expect(addressGenerator.cache.readHexString(97, 1)).toBe(networkByte)
        expect(addressGenerator.cache.readHexString(98, 20)).toBe(ripemd160)
        expect(addressGenerator.cache.readHexString(118, 32)).toBe(sha256v2)
        expect(result).toBe(address)
    })

    test("BTC65::P2PKH", ({ expect }) => {
        const privateKey = "90999DFDB17F574B14DB04B9F4C32AA2BDC3EA4725F2C16AA3EDB9B0D9D016D5"
        const publicKey =
            "04C3A1610084E17BD588D040B153A9C9C9276268B21D5874A8F515346A8D71589B6F39EB507E59BFF2C9BB191F0FF25E9C3096BB2569AD2E4E57EFC39647E51460"
        const sha256 = "4B92E1B45A19D6964229350FBBDD43FF59724E968E38E8C075691B972A7D4F61"
        const networkByte = "00"
        const ripemd160 = "B3A01E0D0BACFF910A15AC77EB6A99C0918381AF"
        const sha256v2 = "AA48256BEAFB6B9A387244912659A51F15470F508D8336171617812F50F72B67" // Overwrites the previous sha256
        const address = "1HNmmVLzJAy1c2ib6QJvSLeDBi51jwhAwC"

        const addressGenerator = new AddressGenerator("BTC65::P2PKH", {
            injectedHexPrivateKey: privateKey,
            enableDebugging: true,
        })

        const result = addressGenerator.executeInstructions()
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(privateKey)
        expect(addressGenerator.cache.readHexString(32, 65)).toBe(publicKey)
        expect(addressGenerator.cache.readHexString(97, 32)).toBe(sha256)
        expect(addressGenerator.cache.readHexString(129, 1)).toBe(networkByte)
        expect(addressGenerator.cache.readHexString(130, 20)).toBe(ripemd160)
        expect(addressGenerator.cache.readHexString(150, 32)).toBe(sha256v2)
        expect(result).toBe(address)
    })

    test("BTC33::P2SH", ({ expect }) => {
        const privateKey = "2A07C810A66E8F97E350636D5F0713697D43636EC684ABD6E168D61C90B2FF94"
        const publicKey = "03EA657C393DBB191E2762F3225BAF73B072323D303A76CDAB8080DB7EE449007C"
        const sha256 = "6FF5A2A816273243A065F3A488D6531FF37CEFB781D079EE4E0EE455DA82F86C"
        const p2shPrefix = "0014"
        const ripemd160 = "36A60722E8EEEF1BFB92CFFC21752B2757FDD2F8"
        const sha256v2 = "AE7ABB19607F55EF4222BBCBE04D51D42AF080BA3686DFFB224CA19550603C7E"
        const networkByte = "05"
        const ripemd160v2 = "794F7A2505D448978040ECFD079F99242A4E2E38"
        const sha256v3 = "B9A60F45A118DFCCC893DE763FE9A24391B437FEF75E7D1AAEBE708B301479D9"
        const address = "3CkStvUkL6ccCf6GWFRdMCRGyDtnJpmkzY"

        const addressGenerator = new AddressGenerator("BTC33::P2SH", {
            injectedHexPrivateKey: privateKey,
            btcBase58NetworkByte: 0x05,
            enableDebugging: true,
        })

        const result = addressGenerator.executeInstructions()
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(privateKey)
        expect(addressGenerator.cache.readHexString(32, 33)).toBe(publicKey)
        expect(addressGenerator.cache.readHexString(65, 32)).toBe(sha256)
        expect(addressGenerator.cache.readHexString(97, 2)).toBe(p2shPrefix)
        expect(addressGenerator.cache.readHexString(99, 20)).toBe(ripemd160)
        expect(addressGenerator.cache.readHexString(119, 32)).toBe(sha256v2)
        expect(addressGenerator.cache.readHexString(151, 1)).toBe(networkByte)
        expect(addressGenerator.cache.readHexString(152, 20)).toBe(ripemd160v2)
        expect(addressGenerator.cache.readHexString(172, 32)).toBe(sha256v3)
        expect(result).toBe(address)
    })

    test("BTC65::P2SH", ({ expect }) => {
        const privateKey = "2A07C810A66E8F97E350636D5F0713697D43636EC684ABD6E168D61C90B2FF94"
        const publicKey =
            "04EA657C393DBB191E2762F3225BAF73B072323D303A76CDAB8080DB7EE449007C48E17FE4ACC8816D78099BABD857F1824608E6DB2CFE77B95F8B1A16FA6EDD17"
        const sha256 = "79F62E5B6C926F2C914BB6AC0DF4412BF18041A67790E94F8E48E01F8ED9C8C6"
        const p2shPrefix = "0014"
        const ripemd160 = "99DC49BE2CA9DD731DA2C1957C403EE64D0308D4"
        const sha256v2 = "EDC36CB3529877E71091C6C69ED1F2155182800DEB56D0DB8F19E8A2DD7666E7"
        const networkByte = "05"
        const ripemd160v2 = "23F23ECC7231E202DB968B615044840E8DD18C10"
        const sha256v3 = "62A2708D9A9AB9CC485DC437BD3ABA36B59ACB6F3E4C8F1E39A35876F8FC5778"
        const address = "34y5mkrEcnnV92YZ9MdrFL8BdAQVb1NwNk"

        const addressGenerator = new AddressGenerator("BTC65::P2SH", {
            injectedHexPrivateKey: privateKey,
            btcBase58NetworkByte: 0x05,
            enableDebugging: true,
        })

        const result = addressGenerator.executeInstructions()
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(privateKey)
        expect(addressGenerator.cache.readHexString(32, 65)).toBe(publicKey)
        expect(addressGenerator.cache.readHexString(97, 32)).toBe(sha256)
        expect(addressGenerator.cache.readHexString(129, 2)).toBe(p2shPrefix)
        expect(addressGenerator.cache.readHexString(131, 20)).toBe(ripemd160)
        expect(addressGenerator.cache.readHexString(151, 32)).toBe(sha256v2)
        expect(addressGenerator.cache.readHexString(183, 1)).toBe(networkByte)
        expect(addressGenerator.cache.readHexString(184, 20)).toBe(ripemd160v2)
        expect(addressGenerator.cache.readHexString(204, 32)).toBe(sha256v3)
        expect(result).toBe(address)
    })

    test("EVM", ({ expect }) => {
        const privateKey = "33014F9CEEAB30526272733C3113FBB0EEA5CF6E69CBDC3A2260333A40FB72E3"
        const publicKey =
            "5AA4E4EE459B74739511FCC0D3FAF1DA42E7A59F45839EBDA3AB45D94B7AF889A4DE8CEA50F52ECB88879C9CAD4FA5A6CA539B13BF0AD5850E21E5B98EA47BDE"
        const keccak256 = "C11C2095CCE9804305D22A9EFE8EA0DEF858277355EBB74E9EB9979EA8CB42A2"
        const address = "0xFE8EA0DEF858277355EBB74E9EB9979EA8CB42A2"

        const addressGenerator = new AddressGenerator("EVM", {
            injectedHexPrivateKey: privateKey,
            enableDebugging: true,
        })

        const result = addressGenerator.executeInstructions()
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(privateKey)
        expect(addressGenerator.cache.readHexString(32, 64)).toBe(publicKey)
        expect(addressGenerator.cache.readHexString(96, 32)).toBe(keccak256)
        expect(result).toBe(address)
    })
})
