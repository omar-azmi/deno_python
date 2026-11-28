/** this submodule loads the python dynamic library.
 *
 * @module
*/

import { currentOs, ensureFileUrlIsLocalPath, isNull } from "../deps.ts"
import { promoteDynamicLib } from "../funcdefs.ts"
import { PySymbols } from "./symbols.ts"


const supported_versions: Array<[major: number, minor: number]> = [
	[3, 15],
	[3, 14],
	[3, 13],
	[3, 12],
	[3, 11],
	[3, 10],
	[3, 9],
	[3, 8],
]

export interface LoadDynamicLibraryConfig<S extends Deno.ForeignLibraryInterface> {
	/** the python dynamic library (i.e. the `dll` or equivalent file) paths to attempt loading.
	 *
	 * leave it `undefined` for auto discovery based on your current OS.
	 * you can also run the auto discovery function yourself: {@link }.
	*/
	paths?: Array<string | URL>

	/** the python c-abi symbols to use for the ffi.
	 *
	 * @defaultValue {@link PySymbols}.
	*/
	symbols?: S
}

export const loadDynamicLibrary = <
	const S extends Deno.ForeignLibraryInterface = typeof PySymbols,
>(config?: LoadDynamicLibraryConfig<S>): Deno.DynamicLibrary<S> => {
	const { paths, symbols } = { ...defaultLoadDynamicLibraryConfig, ...config }
	let
		dl_path: string | URL,
		dl: Deno.DynamicLibrary<S> | undefined = undefined
	for (dl_path of paths) {
		try { dl = Deno.dlopen<S>(dl_path, symbols as S) }
		catch (error) {
			if (error instanceof Deno.errors.NotCapable) {
				throw new Error("[loadDynamicLibrary]: cannot load dynamic library because --allow-ffi flag was not set.", { cause: error })
			}
			// when the dynamic library is not found, a generic `Error` class instance is thrown, hence we move to the next search path.
			continue
		}
		break
	}

	if (!isNull(dl)) {
		promoteDynamicLib(ensureFileUrlIsLocalPath(dl_path!))
		return dl
	}

	throw new Error(
		`[loadDynamicLibrary]: could not find the dynamic library!`
		+ `the loader tried searching for these dynamic library names/paths on your system: [`
		+ paths.map((path) => `\n\t"${path}"`).join(",") + "\n]"
	)
}

export const searchPyDynamicLibrary = (): Array<string> => {
	switch (currentOs) {
		case "android":
		case "linux":
		case "freebsd":
		case "openbsd": {
			const so_names = supported_versions.map(([major, minor]) => {
				// TODO: I think openbsd uses the `libpython3.x.so.y.z` format for naming, which would either need to be specified directly,
				// or require the use of `RTLD_LAZY` flag before deno performs its `dlopen` (which we cannot do before finding out which version to load).
				// in other words, the current order of operations will likely fail for openbsd platforms, but who am I to care.
				return `libpython${major}.${minor}.so`
			})
			so_names.push("libpython3.so")
			return so_names
		}
		case "windows": {
			const dll_names = supported_versions.map(([major, minor]) => {
				return `python${major}${minor}.dll`
			})
			dll_names.push("python3.dll")
			return dll_names
		}
		case "darwin": {
			const search_dirs: Array<(major: number, minor: number) => string> = [
				(major, minor) => `/Library/Frameworks/Python.framework/Versions/${major}.${minor}/Python`,
				(major, minor) => `/Library/Frameworks/Python.framework/Versions/${major}.${minor}/lib/libpython${major}.${minor}.dylib`,
				(major, minor) => `/opt/homebrew/opt/python@${major}.${minor}/Frameworks/Python.framework/Versions/${major}.${minor}/Python`,
				(major, minor) => `/opt/homebrew/lib/libpython${major}.${minor}.dylib`,
				(major, minor) => `/usr/local/opt/python@${major}.${minor}/Frameworks/Python.framework/Versions/${major}.${minor}/Python`,
				(major, minor) => `/usr/local/lib/libpython${major}.${minor}.dylib`,
			]
			const dylib_paths = supported_versions.flatMap(([major, minor]) => {
				return search_dirs.map((search_path) => search_path(major, minor))
			})
			return dylib_paths
		}
		default: {
			throw new Error(`[searchPyDynamicLibrary]: detected an unsupported OS: "${currentOs}".`)
		}
	}
}

const defaultLoadDynamicLibraryConfig: Required<LoadDynamicLibraryConfig<typeof PySymbols>> = {
	paths: searchPyDynamicLibrary(),
	symbols: PySymbols,
}
