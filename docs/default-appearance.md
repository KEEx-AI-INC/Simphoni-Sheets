# SimphoniSheets default appearance

## Violett Grid

The default SimphoniSheets appearance is derived from the supplied workbook
reference image, sampled from its flat interior regions rather than anti-aliased
text edges.

| Role | Value | Applied by |
| --- | --- | --- |
| Workbook cell field | `#1A151A` | New XLSX and ODS templates; editor canvas |
| Column and control header | `#19171B` | Collabora chrome; offline library surfaces |
| Workbook grid | `#3C383D` | New XLSX and ODS borders; editor chrome borders |
| Lavender labels | `#806E8E` | Column/control labels and muted product text |
| Raised control | `#211B24` | Controls, cards, and input surfaces |
| Hover/control emphasis | `#2A252E` | Interactive hover states |
| Higher-contrast text | `#B09AB8` | Readable body and control text |

The screenshot also contains anti-aliased intermediate shades around text and
grid edges. Those are rendering artifacts, not additional design tokens.

## Product boundary

`branding/online/branding.css` styles the reviewed Collabora artifact and
`offline-ui/sheets.css` styles the Nucleus-hosted library. The persistent
workbook appearance is created by the Service Bus template generator, which
uses the first three values above for XLSX and ODS output. Existing user
workbooks keep their saved formatting; the default applies only to newly
created workbooks and empty editor space.
