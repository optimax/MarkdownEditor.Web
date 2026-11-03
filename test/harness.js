// A small test runner for the browser (the project has no build step and needs no Node): `test(name, fn)` registers a
// test, `run()` runs them all and writes what failed into the page, and `window.testResults` for whoever drives it.

const tests = [];

export function test(name, fn) {
    tests.push({ name, fn });
}

export function equal(actual, expected, message = '') {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    if (a !== e) throw new Error(`${message ? message + ': ' : ''}expected ${e}, got ${a}`);
}

export function ok(value, message = 'expected true') {
    if (!value) throw new Error(message);
}

export async function run(output) {
    const failures = [];
    let passed = 0;
    for (const { name, fn } of tests) {
        try {
            await fn();
            passed++;
        } catch (error) {
            failures.push({ name, message: error && error.message ? error.message : String(error), stack: error?.stack });
        }
    }
    const results = { passed, failed: failures.length, failures };
    window.testResults = results;
    if (output) {
        const summary = document.createElement('h2');
        summary.textContent = `${passed} passed, ${failures.length} failed`;
        summary.style.color = failures.length ? '#b00020' : '#137a10';
        output.append(summary);
        for (const failure of failures) {
            const item = document.createElement('pre');
            item.textContent = `${failure.name}\n  ${failure.message}`;
            output.append(item);
        }
    }
    return results;
}
