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

- Keep the uploaded DJ mixer in `src/components/dj` with its audio engine in `src/lib/dj`, because the interface and playback logic are shared across desktop and portrait layouts.
- Render the full-size deck waveforms in the orientation chosen in Settings (default vertical) in both center-column and portrait layouts, because the mixer should show upright scrolling tracks.
- Keep one per-deck performance-tools entry point in the landscape strip, because separate cues, FX, and sampler triggers crowd narrow phones.
- Keep Settings grouped into mobile-friendly sections, because portrait phones and tablets are the primary controls and long multi-column forms bury playback options.
- Keep scratch audio sourced from the track without synthetic vinyl hiss, because stopped or slow platters should not add background noise.
- Read embedded album artwork when media enters the library and pass it through the deck model, because the same real cover must appear in the library, headers, and loaded jogwheels.
