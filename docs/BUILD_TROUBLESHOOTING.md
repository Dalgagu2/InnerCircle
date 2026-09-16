# Dev client build — what broke and what fixed it

This documents getting the EAS development-client build working for both
iOS and Android on Expo SDK 57, after a long chain of failures. Each
section is a distinct root cause; the fix commit is linked so you can see
the exact diff.

## Quick reference: current state

- **Android**: builds cleanly with `eas build --platform android --profile development`.
- **iOS**: builds cleanly with `eas build --platform ios --profile development`,
  but **only** because `eas.json`'s `development` profile pins
  `ios.image` to `macos-sequoia-15.6-xcode-26.2`. If you add a `preview`
  or `production` iOS profile later, copy that same `ios.image` override
  into it, or you'll hit the entire Swift/Xcode saga below again.
- Run `npm install` (not `npm ci`) after pulling if you touch
  `package.json` — see [Lockfile drift](#lockfile-drift) before assuming
  `npm ci` will just work.
- `patches/expo-modules-jsi+57.1.0.patch` (applied automatically via the
  `postinstall` script) is load-bearing for iOS. It's pinned to exactly
  `expo-modules-jsi@57.1.0`; if `npm install` ever bumps that package to a
  new version, `patch-package` will fail loudly at install time and the
  patch will need regenerating against the new version's source (the fix
  content will likely still apply near-verbatim — see below).

## Lockfile drift

**Symptom**: `npm ci` fails on EAS with `Missing: <package>@<version> from
lock file` for a long list of transitive dependencies, even though `npm
install` / `npm ci` both succeed locally with no complaints.

**Root cause**: an incremental `npm install` (e.g. `npm install --save-dev
foo`) doesn't always fully re-validate the whole dependency graph — it can
leave `package-lock.json` in a state a newer local npm considers complete,
but that EAS's npm (bundled with a different Node version) considers
inconsistent enough to refuse `npm ci` outright. This bit us three
separate times in this session, each time after an otherwise-unrelated
`npm install`.

**Fix**: whenever `package.json` changes, do a *full* wipe, not an
incremental install, before trusting the lockfile:

```bash
rm -rf node_modules package-lock.json
npm install
npm ci   # sanity check — this is what EAS actually runs
```

Commits: `73cccf3`, and the re-does folded into `8a9a1fd`, `904e019`,
`605acaa`, `9413d77`, `ec23361`.

## Dependency version drift (the Android Gradle crash)

**Symptom**: Android's Gradle build failed with `Cannot invoke method
getAbsolutePath() on null object` while evaluating `android/app/build.gradle`.

**Root cause**: an earlier SDK 54→57 upgrade (done before this
troubleshooting session started) only bumped the `expo` package itself,
not the ~20 other Expo-managed packages that need to move in lockstep
(`react-native`, every `expo-*` native module, `react-native-reanimated`,
`react-native-worklets`, etc.). `expo doctor` flagged this as duplicate
native module installs — specifically two different resolved versions of
`react-native-worklets` — which is exactly the kind of conflict that
crashes Android's native build configuration.

**Fix**: `npx expo install --fix`, which aligns every Expo-managed
package to what SDK 57 actually expects. `expo doctor` went from 3 failed
checks to 21/21 passing. This one command also forced two follow-on
fixes:

- `app.json` had `newArchEnabled` and `android.edgeToEdgeEnabled`, both
  no longer valid in SDK 57's config schema (new arch is always on now;
  edge-to-edge is mandatory on Android 16 and can't be toggled).
- `expo-calendar`'s default export dropped the old functional API
  (`Event`, `Attendee`, `getEventsAsync`, `getAttendeesForEventAsync`) in
  favor of a new class-based one. The old API we use still exists, just
  moved to the `expo-calendar/legacy` subpath.

Commit: `8a9a1fd`.

## iOS: expo-modules-jsi vs. Xcode 26 / Swift 6.2

This was the long one — four separate, distinct Swift compiler error
categories, each only visible after fixing the previous one. Verified
this is a genuine, currently-unpatched upstream Expo bug (checked
`expo-modules-jsi` versions 57.1.0, 58.0.0, 58.0.2, and the latest
canary — all have the identical unfixed source) and it matches a known
open issue, [expo/expo#47819](https://github.com/expo/expo/issues/47819).

All fixes live in `patches/expo-modules-jsi+57.1.0.patch`
(via [patch-package](https://www.npmjs.com/package/patch-package), applied
automatically by the `postinstall` script so it survives EAS's clean
`npm ci`).

### 1. `weak let` isn't valid Swift

expo-modules-jsi's Package.swift declares `// swift-tools-version: 6.2`,
which only Xcode 26+ can resolve — but Xcode 26's stricter Swift 6.2
compiler rejects 13 pre-existing `weak let someProperty: T?` declarations
across the package's `Runtime/` sources (`weak` references must always be
`var`, since ARC needs to be able to nil them out — this was seemingly
never valid Swift, just tolerated by older compilers). Also two
`SWIFT_RETURNS_RETAINED` annotations on `RuntimeScheduler`'s constructors
in a C++ header — that annotation is for factory functions returning a
`SWIFT_SHARED_REFERENCE` type, not for a shared-reference type's own
constructors, which Swift handles automatically.

Fix: `weak let` → `weak var` (13 occurrences), removed the two invalid
annotations. Commit: `5507aa2`.

### 2. `weak var` conflicts with `Sendable`

Fixing #1 satisfied "weak must be var" but tripped a different Swift 6
rule: several of these classes conform to `Sendable` (one explicitly,
others via the `JavaScriptType` protocol), and `Sendable` types must have
*immutable* stored properties under strict concurrency checking — directly
contradicting a `weak var`.

Fix: `nonisolated(unsafe)` on all 13 properties — Swift's standard escape
hatch for a mutable property in a `Sendable` type that's safe by
construction (a weak ref can only ever become `nil`, never race on real
data). Commit: `904e019`.

### 3. Detour: Swift 5 language mode looked promising but wasn't

Tried switching `swiftLanguageModes: [.v6]` → `[.v5]` in Package.swift, on
the theory that dropping to Swift 5 language mode (opt-in concurrency
checking) while keeping the Swift 6.2 *tools version* would sidestep the
whole category of strict-concurrency errors in one shot, instead of
patching each new diagnostic as it surfaced. It didn't work cleanly: the
package relies on the `NonisolatedNonsendingByDefault` upcoming feature
(only active under `.v6`) for its actor-isolation inference, and Swift 5
mode combined with the package's C++ interop mode apparently mishandles a
regex literal elsewhere in the file. The result was two *new*, unrelated
errors (`'$' is not a valid digit in integer literal`; a global-actor
initializer called from a synchronous nonisolated context) instead of a
clean fix.

Reverted back to `.v6` — commits `605acaa` then `9413d77`. Left as a
documented dead end so nobody re-tries it expecting a quick win.

### 4. `sending 'x' risks causing data races`

Back on `.v6`, the next (and last) error: three raw pointers
(`resultPtr`, `thisPtr`, `argumentsPtr`) captured into a
`JavaScriptActor.assumeIsolated { ... }` closure via a plain
`nonisolated(unsafe) let` shadow. Swift 6.2's region-based "sending"
checker doesn't treat that shadow as sufficient proof the pointer is safe
to hand across the isolation boundary, even though the call is
synchronous and the closure never escapes — the package's own code
comments explicitly reasoned this was safe, so this looks like the
checker being more conservative than the authors expected, not an actual
oversight on their part.

Fix: found that `expo-modules-jsi` already has an established pattern for
exactly this — `NonisolatedUnsafeVar<T>`, a small `final class ...:
Sendable` wrapping a `nonisolated(unsafe) var`, used elsewhere in the same
file for the same class of problem. A genuine `Sendable` class reference
satisfies the "sending" checker in a way a raw pointer's local
`nonisolated(unsafe)` binding doesn't. Wrapped the three pointers at all
three call sites with it instead of guessing at another annotation.

Note: the package's own comments say they specifically avoided this
wrapper at these call sites to dodge a per-call heap allocation on the hot
host-call path. That tradeoff doesn't matter for this app's call volume,
but if this project ever does something JS-bridging-heavy and
performance-sensitive, this is a spot to look at first.

Commit: `ec23361`. This is the fix that got iOS building.

## New lint errors from the SDK bump

The dependency alignment (`npx expo install --fix`) also bumped
`eslint-config-expo`, which added stricter React Compiler lint rules.
Two false positives on existing, correct code, suppressed with scoped
`eslint-disable` comments rather than restructuring working code:

- `react-hooks/purity` on `Date.now()` calls inside press handlers
  (`AddContactModal.tsx`, `ImportContactsModal.tsx`) — these aren't
  render-phase code, the rule just can't tell from a handler closure.
- `react-hooks/set-state-in-effect` on resetting local state when an
  always-mounted modal's `visible` prop flips true
  (`CalendarSyncModal.tsx`, `ImportContactsModal.tsx`) — a legitimate,
  already-tested pattern; the "real" fix (remounting via a `key` prop)
  would need a larger restructure of how the parent renders these modals.

Commit: `8a9a1fd`.
