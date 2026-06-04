"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComposeCommand = getComposeCommand;
const child_process_1 = require("child_process");
let cached;
function getComposeCommand() {
    if (cached)
        return cached;
    try {
        (0, child_process_1.execSync)("docker compose version", { stdio: "ignore" });
        cached = "docker compose";
    }
    catch {
        cached = "docker-compose";
    }
    return cached;
}
//# sourceMappingURL=compose.js.map