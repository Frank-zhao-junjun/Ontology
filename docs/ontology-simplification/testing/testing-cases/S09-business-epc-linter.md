# US-S09 + US-S15: Testing Cases
> US: [US-S09](../us/US-S09-business-epc-linter.md) + [US-S15](../us/US-S15-epc-wepc-ext.md)

## U01 W-EPC-01~05 (S09)
### TC-U01-01~05: 5 base rules
Status: yes File: business-epc-linter.spec.ts (lines 39-149)

## U01-ext W-EPC-06~17 (S15)
### TC-U01-06~17: 12 extended rules
Status: yes 42/42 pass File: business-epc-linter.spec.ts (lines 151-594)

## U02 store
### TC-U02-01: getBusinessEpcWarnings
Status: yes File: business-epc-linter-store.spec.ts

## U03 WarningCenter
### TC-U03-01: warning list / TC-U03-02: VX tab + severity sort
Status: yes / partial File: warning-center.spec.tsx / epc-validation-panel.spec.tsx

## U04 ignore/filter
### TC-U04-01: ignore persistence (localStorage)
Status: partial File: warning-center.spec.tsx
