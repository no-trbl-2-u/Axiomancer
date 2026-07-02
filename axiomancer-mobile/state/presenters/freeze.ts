/**
 * View-model deep-freeze helper.
 *
 * Per Spec 03 Q3: every presenter return value is deep-frozen in dev
 * so screens cannot accidentally mutate the VM. In production builds
 * we skip the recursion to keep the per-render cost at zero.
 *
 * `__DEV__` is provided globally by React Native's bundler (and by
 * `jest-expo` during tests). When it is unavailable (e.g. plain Node),
 * we default to *not* freezing so the helper never throws in
 * production-like contexts.
 */

declare const __DEV__: boolean | undefined;

function isFreezable(value: unknown): value is object {
    if (value === null) return false;
    const t = typeof value;
    return t === 'object' || t === 'function';
}

function deepFreeze<T>(value: T): T {
    if (!isFreezable(value)) return value;
    if (Object.isFrozen(value)) return value;
    Object.freeze(value);
    if (Array.isArray(value)) {
        for (const item of value) deepFreeze(item);
        return value;
    }
    for (const key of Object.keys(value as object)) {
        deepFreeze((value as Record<string, unknown>)[key]);
    }
    return value;
}

/**
 * Deep-freezes the view-model in dev so accidental mutations throw.
 * Identity in prod. The return type is the input type — callers see
 * no shape change.
 */
export function freezeViewModel<T>(vm: T): T {
    const isDev =
        typeof __DEV__ !== 'undefined'
            ? __DEV__
            : process.env.NODE_ENV !== 'production';
    return isDev ? deepFreeze(vm) : vm;
}
