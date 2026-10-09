# Dark glass UI

The midnight navy and blue palette lives in `app/globals.css`. Keep the existing Vazirmatn font and right-to-left reading order.

- **Type:** `text-display` for the landing headline, `text-page-title` for screen titles, `text-section-title` for sections, `text-copy` for long content, and `text-caption` for metadata. Body copy must remain readable at mobile widths.
- **Spacing:** control, group, panel, and section tokens define increasing separation. Use `page-shell` for page gutters and `section-space` for landing sections. Keep related labels, hints, and controls close together.
- **Surfaces:** `Card` supports default, form, inset, data, and task variants. Forms have clearer boundaries; data panels favor legibility; inset panels carry supporting information. Task status affects its leading border without replacing the status label.
- **Controls:** use `Button` variants, `Input`, and `form-control`. Controls have 44px minimum targets, visible keyboard focus, and consistent disabled/error states. Required indicators reflect existing native `required` attributes; validation rules are unchanged.
- **Effects:** reserve blue glow for primary actions, keyboard focus, active navigation, and progress. Informational icons, avatars, cards, and empty states use quiet borders and surfaces.
- **Content:** distinguish task history, empty task lists, social posts, and tables by their purpose. Avoid turning every metadata item into a pill or repeating oversized icon tiles.

Keep routes, copy, validation, actions, data contracts, and network calls independent of presentation changes. Review public pages and isolated private-page fixtures at mobile, tablet, and desktop widths without writing production data.
