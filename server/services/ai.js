import "dotenv/config";

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import pMap from "p-map";

import {
    FileCodeSchema,
    FilePlanSchema,
    RevisionResultSchema,
} from "./aiSchemas.js";

import {
    buildFileCodeSystem,
    FILE_PLAN_SYSTEM,
    REVISE_SYSTEM,
} from "./prompts.js";

import { normalizeContent } from "./contentNormalizer.js";

import {
    validateAndFixCode,
    validateRevisionContent,
} from "./codeValidator.js";

// ============================================================
// OpenRouter Configuration
// ============================================================

const OPENROUTER_API_KEY =
    process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
    throw new Error(
        "OPENROUTER_API_KEY is missing. Add it to server/.env and restart the backend."
    );
}

const MODEL =
    process.env.OPENROUTER_MODEL ||
    "openrouter/free";

const MAX_CONCURRENCY = parseInt(
    process.env.AI_MAX_CONCURRENCY || "6",
    10
);

// ============================================================
// OpenRouter Client
// ============================================================

const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: OPENROUTER_API_KEY,
});

const model = openrouter(MODEL);

// ============================================================
// Generate a Single File
// ============================================================

async function generateSingleFile(
    file,
    allFiles,
    prompt,
    alreadyGeneratedFiles
) {
    const system = buildFileCodeSystem(
        allFiles,
        alreadyGeneratedFiles
    );

    const userMsg =
        `Project: ${prompt}\n\n` +
        `Write the complete code for: ${file.path}\n` +
        `Purpose: ${file.description}`;

    console.log(
        `[AI] Creating file: ${file.path}...`
    );

    const { object } = await generateObject({
        model,
        schema: FileCodeSchema,
        system,
        prompt: userMsg,
        maxRetries: 2,
    });

    let code = normalizeContent(
        object.code
    );

    if (!code || code.trim().length === 0) {
        throw new Error(
            `Generated code is empty for ${file.path}`
        );
    }

    // ========================================================
    // Validate and auto-fix generated code
    // ========================================================

    const validation = validateAndFixCode(
        code,
        file.path,
        {
            allPlannedFiles: allFiles,
        }
    );

    code = validation.code;

    if (
        validation.warnings &&
        validation.warnings.length > 0
    ) {
        console.log(
            `[Validator] Code adjustments for ${file.path}:\n` +
                validation.warnings
                    .map(
                        (warning) =>
                            `  - ${warning}`
                    )
                    .join("\n")
        );
    }

    console.log(
        `[AI] Created file: ${file.path} (${code.length} chars)`
    );

    return {
        path: file.path,
        code,
    };
}

// ============================================================
// Generate Project
// ============================================================

export async function generateProject(
    prompt,
    callbacks = {}
) {
    if (
        !prompt ||
        typeof prompt !== "string"
    ) {
        throw new Error(
            "A valid project prompt is required."
        );
    }

    // ========================================================
    // PHASE 1: PLAN
    // ========================================================

    console.log(
        `[AI] Phase 1: Planning file structure for: "${prompt.slice(
            0,
            80
        )}..."`
    );

    const { object: plan } =
        await generateObject({
            model,
            schema: FilePlanSchema,
            system: FILE_PLAN_SYSTEM,
            prompt:
                `Plan a React website for: ${prompt}`,
            maxRetries: 2,
        });

    if (
        !plan ||
        !Array.isArray(plan.files)
    ) {
        throw new Error(
            "AI returned an invalid project plan."
        );
    }

    // ========================================================
    // Ensure App.js
    // ========================================================

    if (
        !plan.files.find(
            (file) =>
                file.path === "/App.js"
        )
    ) {
        plan.files.unshift({
            path: "/App.js",
            description:
                "Main application entry point",
            exports: "default App",
            imports: ["./styles.css"],
        });
    }

    // ========================================================
    // Ensure styles.css
    // ========================================================

    if (
        !plan.files.find(
            (file) =>
                file.path === "/styles.css"
        )
    ) {
        plan.files.push({
            path: "/styles.css",
            description:
                "Global CSS: Google Font import, keyframe animations, utility classes",
            exports: "none",
            imports: [],
        });
    }

    // ========================================================
    // Notify backend about plan
    // ========================================================

    if (callbacks?.onPlan) {
        await callbacks.onPlan(plan);
    }

    console.log(
        `[AI] Phase 2: Generating ${plan.files.length} files ` +
            `(concurrency=${MAX_CONCURRENCY}): ` +
            `${plan.files
                .map((file) => file.path)
                .join(", ")}`
    );

    // ========================================================
    // PHASE 2: GENERATE FILES
    // ========================================================

    const files = {};

    let pendingFiles = plan.files.map(
        (file) => ({ ...file })
    );

    const maxRetryRounds = 2;

    for (
        let round = 0;
        round <= maxRetryRounds;
        round++
    ) {
        if (
            pendingFiles.length === 0
        ) {
            break;
        }

        if (round > 0) {
            console.log(
                `[AI] Retry round ${round}/${maxRetryRounds} ` +
                    `for ${pendingFiles.length} failed files: ` +
                    `${pendingFiles
                        .map(
                            (file) =>
                                file.path
                        )
                        .join(", ")}`
            );
        }

        const results = await pMap(
            pendingFiles,
            async (file) => {
                try {
                    if (
                        callbacks?.onFileStart
                    ) {
                        await callbacks.onFileStart(
                            file.path
                        );
                    }

                    const singleResult =
                        await generateSingleFile(
                            file,
                            plan.files,
                            prompt,
                            files
                        );

                    if (
                        callbacks?.onFileComplete
                    ) {
                        await callbacks.onFileComplete(
                            file.path,
                            singleResult.code
                        );
                    }

                    return {
                        success: true,
                        file,
                        result: singleResult,
                    };
                } catch (error) {
                    return {
                        success: false,
                        file,
                        error,
                    };
                }
            },
            {
                concurrency:
                    MAX_CONCURRENCY,
            }
        );

        const failedFiles = [];

        for (const entry of results) {
            if (entry.success) {
                const {
                    path,
                    code,
                } = entry.result;

                const normalizedPath =
                    path.startsWith("/")
                        ? path
                        : `/${path}`;

                files[normalizedPath] =
                    code;
            } else {
                console.warn(
                    `[AI] File ${entry.file.path} failed in round ${round}: ${
                        entry.error?.message ||
                        entry.error
                    }`
                );

                failedFiles.push(
                    entry.file
                );
            }
        }

        pendingFiles = failedFiles;
    }

    // ========================================================
    // FALLBACK FOR FAILED FILES
    // ========================================================

    if (pendingFiles.length > 0) {
        const failedPaths =
            pendingFiles
                .map(
                    (file) =>
                        file.path
                )
                .join(", ");

        console.error(
            `[AI] Failed to generate ${pendingFiles.length} files ` +
                `after all retry rounds: ${failedPaths}`
        );

        for (const failedFile of pendingFiles) {
            const normalizedPath =
                failedFile.path.startsWith(
                    "/"
                )
                    ? failedFile.path
                    : `/${failedFile.path}`;

            const extension =
                normalizedPath
                    .split(".")
                    .pop()
                    ?.toLowerCase();

            // CSS fallback
            if (
                extension === "css"
            ) {
                files[normalizedPath] =
                    `/* ${failedFile.description} — Generation failed, please retry */\n`;

                continue;
            }

            // JS / JSX / TS / TSX fallback
            files[normalizedPath] =
                "import React from 'react';\n\n" +
                "// ⚠️ This file could not be generated. Please retry.\n" +
                `// Purpose: ${failedFile.description}\n\n` +
                "export default function Placeholder() {\n" +
                "  return (\n" +
                "    <div className='p-8 text-center text-zinc-400'>\n" +
                "      <p>⚠️ Component failed to generate. Please try again.</p>\n" +
                "    </div>\n" +
                "  );\n" +
                "}\n";
        }
    }

    // ========================================================
    // Final validation
    // ========================================================

    if (!files["/App.js"]) {
        throw new Error(
            "AI did not generate /App.js entry point"
        );
    }

    console.log(
        `[AI] Project generation completed with ${
            Object.keys(files).length
        } files.`
    );

    return {
        files,
        description:
            plan.projectDescription ||
            "Generated Project",
    };
}

// ============================================================
// Revise Existing Project
// ============================================================

export async function reviseProject(
    prompt,
    manifest,
    relevantFiles,
    recentMessages
) {
    const contextParts = [];

    // ========================================================
    // Manifest
    // ========================================================

    contextParts.push(
        "## Current Project Files (manifest)"
    );

    contextParts.push("```");

    for (
        const file of manifest || []
    ) {
        contextParts.push(
            `${file.path} (${file.hash}, ${file.size}B)`
        );
    }

    contextParts.push("```");

    // ========================================================
    // Relevant Files
    // ========================================================

    if (
        relevantFiles &&
        Object.keys(relevantFiles)
            .length > 0
    ) {
        contextParts.push(
            "\n## File Contents (for reference)"
        );

        for (
            const [path, content] of Object.entries(
                relevantFiles
            )
        ) {
            contextParts.push(
                `\n### ${path}\n\`\`\`\n${content}\n\`\`\``
            );
        }
    }

    // ========================================================
    // Recent Messages
    // ========================================================

    if (
        Array.isArray(
            recentMessages
        ) &&
        recentMessages.length > 0
    ) {
        contextParts.push(
            "\n## Recent Conversation"
        );

        for (
            const message of recentMessages.slice(
                -3
            )
        ) {
            contextParts.push(
                `${message.role}: ${message.content}`
            );
        }
    }

    // ========================================================
    // Revision Request
    // ========================================================

    contextParts.push(
        `\n## Revision Request\n${prompt}`
    );

    console.log(
        "[AI] Revising project..."
    );

    const { object: rawParsed } =
        await generateObject({
            model,
            schema:
                RevisionResultSchema,
            system: REVISE_SYSTEM,
            prompt:
                contextParts.join("\n"),
            maxRetries: 2,
        });

    // ========================================================
    // Normalize Operations
    // ========================================================

    if (
        rawParsed &&
        Array.isArray(
            rawParsed.operations
        )
    ) {
        rawParsed.operations =
            rawParsed.operations.map(
                (operation) => {
                    if (
                        !operation ||
                        typeof operation !==
                            "object"
                    ) {
                        return operation;
                    }

                    const opStr =
                        String(
                            operation.op ||
                                ""
                        )
                            .trim()
                            .toLowerCase();

                    if (
                        [
                            "create",
                            "add",
                            "new",
                        ].includes(opStr)
                    ) {
                        operation.op =
                            "create";
                    } else if (
                        [
                            "update",
                            "edit",
                            "modify",
                            "patch",
                        ].includes(opStr)
                    ) {
                        operation.op =
                            "update";
                    } else if (
                        [
                            "delete",
                            "remove",
                            "del",
                            "rm",
                        ].includes(opStr)
                    ) {
                        operation.op =
                            "delete";
                    }

                    // Normalize path
                    if (
                        operation.path &&
                        typeof operation.path ===
                            "string" &&
                        !operation.path.startsWith(
                            "/"
                        )
                    ) {
                        operation.path =
                            "/" +
                            operation.path;
                    }

                    // Normalize content
                    if (
                        typeof operation.content ===
                        "string"
                    ) {
                        operation.content =
                            normalizeContent(
                                operation.content
                            );
                    }

                    if (
                        typeof operation.search ===
                        "string"
                    ) {
                        operation.search =
                            normalizeContent(
                                operation.search
                            );
                    }

                    if (
                        typeof operation.replace ===
                        "string"
                    ) {
                        operation.replace =
                            normalizeContent(
                                operation.replace
                            );
                    }

                    // Validate CREATE
                    if (
                        operation.op ===
                            "create" &&
                        operation.content
                    ) {
                        const validation =
                            validateRevisionContent(
                                operation.content,
                                operation.path,
                                "create"
                            );

                        operation.content =
                            validation.content;

                        if (
                            validation.warnings
                                ?.length
                        ) {
                            console.log(
                                `[Validator] Revision Create adjustments for ${operation.path}:\n` +
                                    validation.warnings
                                        .map(
                                            (
                                                warning
                                            ) =>
                                                `  - ${warning}`
                                        )
                                        .join(
                                            "\n"
                                        )
                            );
                        }
                    }

                    // Validate UPDATE
                    else if (
                        operation.op ===
                            "update" &&
                        operation.replace
                    ) {
                        const validation =
                            validateRevisionContent(
                                operation.replace,
                                operation.path,
                                "update"
                            );

                        operation.replace =
                            validation.content;

                        if (
                            validation.warnings
                                ?.length
                        ) {
                            console.log(
                                `[Validator] Revision Update adjustments for ${operation.path}:\n` +
                                    validation.warnings
                                        .map(
                                            (
                                                warning
                                            ) =>
                                                `  - ${warning}`
                                        )
                                        .join(
                                            "\n"
                                        )
                            );
                        }
                    }

                    return operation;
                }
            );
    }

    return rawParsed;
}