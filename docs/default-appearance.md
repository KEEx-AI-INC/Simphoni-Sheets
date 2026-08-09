# SimphoniSheets default appearance

## Charcoal Green

The default SimphoniSheets appearance uses the shared dark product palette.

| Role | Value | Applied by |
| --- | --- | --- |
| Workbook cell field | `#181B1B` | New XLSX and ODS templates; editor canvas |
| Column and control header | `#151216` | Collabora chrome; offline library surfaces |
| Workbook grid | `#0D0D0D` | New XLSX and ODS borders; editor chrome borders |
| Control labels | `#F2E6FF` | Column/control labels and headings |
| Raised control | `#1F1A20` | Controls, cards, and input surfaces |
| Hover/control emphasis | `#2B252D` | Interactive hover states |
| Authored cell text | `#E9FFF8` | Readable workbook content |

## Product boundary

`branding/online/branding.css` styles the reviewed Collabora artifact and
`offline-ui/sheets.css` styles the Nucleus-hosted library. The persistent
workbook appearance is created by the Service Bus template generator, which
uses the first three values above for XLSX and ODS output. Existing user
workbooks keep their saved formatting; the default applies only to newly
created workbooks and empty editor space.
