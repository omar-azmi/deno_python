/** this submodule loads the python dynamic library.
 *
 * @module
*/

import { currentOs } from "./deps.ts"
import { promoteDynamicLib } from "./funcdefs.ts"
import { SYMBOLS } from "./symbols.ts"


const SUPPORTED_VERSIONS = [
	[3, 15],
	[3, 14],
	[3, 13],
	[3, 12],
	[3, 11],
	[3, 10],
	[3, 9],
	[3, 8],
]

const
	searchPath: string[] = [],
	DENO_PYTHON_PATH = Deno.env.get("DENO_PYTHON_PATH")

if (DENO_PYTHON_PATH) {
	searchPath.push(DENO_PYTHON_PATH)
} else {
	if (currentOs === "windows" || currentOs === "linux") {
		const is_linux = currentOs === "linux"
		searchPath.push(
			...SUPPORTED_VERSIONS.map(([major, minor]) => `${is_linux ? "lib" : ""}python${major}${is_linux ? "." : ""}${minor}.${is_linux ? "so" : "dll"}`),
		)
	} else if (currentOs === "darwin") {
		for (
			const framework of [
				"/Library/Frameworks/Python.framework/Versions",
				"/opt/homebrew/Frameworks/Python.framework/Versions",
				"/usr/local/Frameworks/Python.framework/Versions",
			]
		) {
			for (const [major, minor] of SUPPORTED_VERSIONS) {
				searchPath.push(`${framework}/${major}.${minor}/Python`)
			}
		}
	} else { throw new Error(`Unsupported OS: ${currentOs}`) }
}

let py!: Deno.DynamicLibrary<typeof SYMBOLS>["symbols"]

for (const path of searchPath) {
	try {
		py = Deno.dlopen(path, SYMBOLS).symbols
		promoteDynamicLib(path)
		break
	} catch (err) {
		if (err instanceof TypeError && !("Bun" in globalThis)) {
			throw new Error(
				"Cannot load dynamic library because --unstable-ffi flag was not set",
				{ cause: err },
			)
		}
		continue
	}
}

const LIBRARY_NOT_FOUND = new Error(`
Could not find Python library!

Tried searching for these versions:
${searchPath.map((e) => "  " + e).join("\n")}

Make sure you have a supported version of Python
installed on your system, which should be one of
these: ${SUPPORTED_VERSIONS.map((e) => `${e[0]}.${e[1]}`).join(", ")}

If the module still somehow fails to find it,
you can open an issue: https://github.com/denosaurs/deno_python/issues

However, if your Python distribution is not in search
path, you can set DENO_PYTHON_PATH env variable pointing
to dll/dylib/so file for Python library.
`)

if (typeof py !== "object") {
	throw LIBRARY_NOT_FOUND
}

export { py }
