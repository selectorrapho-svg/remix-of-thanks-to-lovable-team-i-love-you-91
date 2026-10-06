# Professional DJ engine upgrade

## Goal
Make playback feel materially closer to a dedicated DJ app: lower-latency scratching, stable video output, and a Sync control that matches both tempo and beat phase instead of performing a one-time rough seek.

## Build

### 1. Replace the split transport with one deck clock
- Make the audio worklet the authoritative playhead for normal playback and scratching, so playback does not switch between a browser buffer source and a separate scratch source.
- Keep the decoded track resident in the worklet, support signed playback rate, and use click-free ramps for touch-down, reversal, release, seek, cue, and loop jumps.
- Remove synthetic scratch noise from the signal path and add short equal-power handoffs to prevent clicks or level jumps.
- Preserve the existing EQ, filter, FX, stems, crossfader, cue, loop, and recording routing.

### 2. Build real BPM and beat-grid analysis
- Analyze transient/onset strength across useful frequency bands, score tempo candidates with half/double-tempo correction, and calculate a first-beat phase marker.
- Store BPM confidence and beat-grid offset on each loaded deck.
- Draw the waveform beat grid from that detected offset rather than assuming the file starts exactly on beat one.

### 3. Make Sync continuous and predictable
- Turn Sync into a true on/off deck state.
- On activation, match tempo and align the nearest beat to the master deck.
- While both decks play, apply small continuous phase corrections; use a bounded correction so it does not audibly hunt or jump.
- Re-lock correctly after cueing, looping, seeking, or releasing a scratch.
- Show inactive, locked, and unavailable Sync states in the existing controls.

### 4. Move video compositing to WebGL
- Add a WebGL2 compositor with one texture per deck, GPU crossfades/transitions, and GPU color effects.
- Upload only newly decoded video frames using `requestVideoFrameCallback`, with a safe animation-frame fallback.
- Keep the current canvas available for video recording and add a 2D fallback for devices without WebGL2.
- Reduce hidden-video throttling risk and release textures/object URLs when tracks change.

### 5. Lock video to the audio playhead
- During normal playback, treat audio as the master clock and use gentle playback-rate correction before any hard seek.
- During scratching, coalesce video seeks and present the newest decoded frame without blocking or slowing audio scratching.
- Resume from the exact audio playhead after scratch release.
- For video codecs the browser cannot decode into the audio engine, show that professional scratch/BPM sync is unavailable instead of silently using a second, unsynchronized audio clock.

### 6. Verify the customer-critical flows
- Verify song load, video load, play/pause, cue, loop, jog scratch, waveform scratch, BPM detection, Sync lock, crossfade, and video transitions.
- Test portrait and Android-landscape-sized viewports, including rapid direction changes and repeated scratch releases.
- Confirm clean build/runtime logs and document the remaining codec/device limitations honestly.

## Technical boundaries
- WebGL improves compositing and effects, but cannot make compressed video frame-accurately seekable; smooth video scratching still depends on codec, keyframe spacing, and device decoder speed.
- Professional key-lock/time-stretch comparable to Serato, VirtualDJ, or djay requires a dedicated licensed or custom DSP engine. This upgrade will improve the current Web Audio engine substantially without claiming identical proprietary processing.
- Browser file access remains permission-based. A truly native Android media library and unrestricted device integration require a separate Android wrapper/build phase.
