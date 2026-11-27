/** central point for exporting dependencies. */

import { getSystemInfo, identifyCurrentRuntime } from "@oazmi/kitchensink/crossenv"


export { textDecoder, textEncoder } from "@oazmi/kitchensink/eightpack"

const
	current_runtime = identifyCurrentRuntime(),
	system_platform = getSystemInfo(current_runtime).platform

// the condition below handles the scenario then `"windows_nt"` is the platform's name.
export const currentOs = system_platform.startsWith("windows") ? "windows" : system_platform
