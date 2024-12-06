# axelar-test

- latest deployment extending InterchainTokenExecutable: https://explorer.xrplevm.org/address/0x7b1bf875977e4124dc781153bd6393c8e1c22739
- latest deployment extending AxelarExecutable: https://explorer.xrplevm.org/address/0x2bd071fce9eb7f51333b002ea4adcbe61d9322a9

Test sending a tx from XRPL to EVM, and then back from EVM to XRPL:

```bash
# before running, modify the variables in the script as needed

npx ts-node test.ts
```
