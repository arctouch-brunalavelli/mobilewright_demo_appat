/**
 * Throwaway inspector. NOT a real test.
 *
 * Dumps the live accessibility tree and a screenshot of whatever screen is
 * currently foregrounded on the device, so you can pick selectors for real
 * tests. Output lands in `test-results/inspect/`.
 *
 * Run it explicitly (the leading underscore + `testIgnore` in
 * mobilewright.config.ts keeps it out of default runs):
 *
 *     npx mobilewright test tests/_inspect.test.ts --reporter list
 */
import { test } from '@mobilewright/test';
import type { Screen } from 'mobilewright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type ViewNode = Awaited<ReturnType<Screen['viewTree']>>[number];

// Skip the default terminate + relaunch so we capture whatever screen the user
// has currently foregrounded, instead of snapping back to the launch screen.
test.use({ bundleId: undefined });

const OUTPUT_DIR = join('test-results', 'inspect');
const TREE_FILE = join(OUTPUT_DIR, 'tree.txt');
const SCREENSHOT_FILE = join(OUTPUT_DIR, 'screen.png');

function quote(value: string): string {
    return JSON.stringify(value);
}

function formatNode(node: ViewNode, depth: number): string {
    const indent = '  '.repeat(depth);
    const parts: string[] = [node.type];

    if (node.label) parts.push(`label=${quote(node.label)}`);
    if (node.text) parts.push(`text=${quote(node.text)}`);
    if (node.placeholder) parts.push(`placeholder=${quote(node.placeholder)}`);
    if (node.value) parts.push(`value=${quote(node.value)}`);
    if (node.identifier) parts.push(`identifier=${quote(node.identifier)}`);
    if (node.resourceId) parts.push(`resourceId=${quote(node.resourceId)}`);
    if (!node.isVisible) parts.push('[hidden]');
    if (!node.isEnabled) parts.push('[disabled]');

    return `${indent}${parts.join(' ')}`;
}

function dumpTree(nodes: ViewNode[], depth = 0): string[] {
    const out: string[] = [];
    for (const node of nodes) {
        out.push(formatNode(node, depth));
        if (node.children?.length) {
            out.push(...dumpTree(node.children, depth + 1));
        }
    }
    return out;
}

test('dump the live accessibility tree', async ({ screen }) => {
    const tree = await screen.viewTree();
    const dump = dumpTree(tree).join('\n');

    mkdirSync(OUTPUT_DIR, { recursive: true });
    writeFileSync(TREE_FILE, dump + '\n', 'utf8');
    await screen.screenshot({ path: SCREENSHOT_FILE });

    console.log('\n--- view tree ---');
    console.log(dump);
    console.log('--- end ---');
    console.log(`Saved tree    -> ${TREE_FILE}`);
    console.log(`Saved screen  -> ${SCREENSHOT_FILE}`);
});
