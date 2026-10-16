<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# OmniTrack

- Signed-in pages live under `src/routes/_authenticated/` (client-only gate) — session is in localStorage.
- Data reads/writes go through the browser Supabase client with RLS; tax_refund rows are restricted in RLS via `can_see_category`, never only in UI.
- Net profit = gross − expenses − commission − refunds, defined once in `src/lib/omni.ts` (and as a generated DB column); reuse it.
- Every record carries `source` (manual/import/api) and `is_demo` so demo, imported and synced data stay distinguishable.
- Roles live in `user_roles`; first signup becomes admin via trigger.
- Ad platform calls (Meta, TikTok) go only through server functions in src/lib/ads.functions.ts via the connector gateway; ad changes require admin/manager, checked server-side — keeps connection keys off the browser.
