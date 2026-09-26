import { Project } from "../models/Project.js";
import { reviseProject } from "../services/ai.js";
import { applyOperations } from "../services/diff.js";

// ============================================================
// Build compact file manifest
// ============================================================

export function buildManifest(files) {
    const manifest = [];

    for (const [path, entry] of Object.entries(files || {})) {
        manifest.push({
            path,
            hash: entry.hash,
            size: entry.content.length,
        });
    }

    return manifest;
}

// ============================================================
// POST /api/projects/:id/chat
// Send a revision prompt and update the project
// ============================================================

export async function chat(req, res) {
    const { prompt } = req.body;

    // --------------------------------------------------------
    // Validate prompt
    // --------------------------------------------------------

    if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({
            error: "prompt is required",
        });
    }

    // --------------------------------------------------------
    // Validate authentication
    // --------------------------------------------------------

    if (!req.user) {
        return res.status(401).json({
            error: "Unauthorized",
        });
    }

    // --------------------------------------------------------
    // Find project owned by current user
    // --------------------------------------------------------

    const project = await Project.findOne({
        _id: req.params.id,
        owner: req.user.userId,
    });

    if (!project) {
        return res.status(404).json({
            error: "Project not found",
        });
    }

    // --------------------------------------------------------
    // Set revision state and save user message immediately
    // --------------------------------------------------------

    project.status = "revising";

    project.messages.push({
        role: "user",
        content: prompt,
        timestamp: new Date(),
    });

    await project.save();

    try {
        // ====================================================
        // Build compact manifest
        // ====================================================

        const manifest = buildManifest(
            project.files || {}
        );

        // ====================================================
        // Include current file contents
        // This allows the AI to make accurate revisions.
        // ====================================================

        const relevantFiles = {};

        for (
            const [path, entry] of Object.entries(
                project.files || {}
            )
        ) {
            relevantFiles[path] =
                typeof entry === "string"
                    ? entry
                    : entry?.content || "";
        }

        // ====================================================
        // Recent conversation
        // ====================================================

        const recentMessages =
            project.messages
                .slice(-4)
                .map((message) => ({
                    role: message.role,
                    content: message.content,
                }));

        console.log(
            `[AI] Revising Project ${project._id}: ` +
                `"${prompt.slice(0, 80)}..." ` +
                `(${manifest.length} files, ` +
                `manifest ~${JSON.stringify(manifest).length} chars)`
        );

        // ====================================================
        // Ask AI for revision operations
        // ====================================================

        const result = await reviseProject(
            prompt,
            manifest,
            relevantFiles,
            recentMessages
        );

        if (!result) {
            throw new Error(
                "AI returned no revision result."
            );
        }

        if (!Array.isArray(result.operations)) {
            throw new Error(
                "AI returned an invalid revision operation list."
            );
        }

        console.log(
            `[AI] Got ${result.operations.length} operations: ` +
                `${result.description || "No description"}`
        );

        // ====================================================
        // Apply AI operations to project files
        // ====================================================

        const {
            files: updatedFiles,
            applied,
            errors,
        } = applyOperations(
            project.files,
            result.operations
        );

        if (errors.length > 0) {
            console.warn(
                "[Diff] Errors applying operations:",
                errors
            );
        }

        // ====================================================
        // Update project
        // ====================================================

        project.files = updatedFiles;
        project.markModified("files");

        project.version += 1;

        project.status = "completed";

        project.error = null;

        project.messages.push({
            role: "assistant",
            content:
                (result.description ||
                    "Project updated successfully.") +
                (
                    errors.length > 0
                        ? `\n\nSome operations failed: ${errors.join(
                              ", "
                          )}`
                        : ""
                ),
            timestamp: new Date(),
        });

        await project.save();

        // ====================================================
        // Convert file objects to plain content map
        // ====================================================

        const filesObj = {};

        for (
            const [path, entry] of Object.entries(
                project.files || {}
            )
        ) {
            filesObj[path] =
                typeof entry === "string"
                    ? entry
                    : entry?.content || "";
        }

        // ====================================================
        // Return updated project
        // ====================================================

        return res.json({
            _id: project._id,
            name: project.name,
            description: project.description,
            files: filesObj,
            messages: project.messages,
            version: project.version,
            status: project.status,
            applied,
            errors,
            aiDescription:
                result.description ||
                "Project updated successfully.",
        });
    } catch (error) {
        // ====================================================
        // Revision failed
        // ====================================================

        console.error(
            `[AI Revision Error] ${
                error?.message || error
            }`
        );

        console.error(error);

        // Keep the existing project usable.
        project.status = "completed";

        project.error =
            error?.message ||
            "Failed to process revision request";

        project.messages.push({
            role: "assistant",
            content:
                `❌ Revision failed: ${
                    error?.message ||
                    "Unknown error"
                }`,
            timestamp: new Date(),
        });

        await project.save();

        return res.status(500).json({
            error:
                error?.message ||
                "Failed to process revision request",
        });
    }
}