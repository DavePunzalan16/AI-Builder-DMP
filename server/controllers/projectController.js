import crypto from "crypto";
import { Project } from "../models/Project.js";
import { generateProject } from "../services/ai.js";

// ========================================
// HELPERS
// ========================================

function hashContent(content) {
    return crypto
        .createHash("md5")
        .update(content)
        .digest("hex")
        .slice(0, 12);
}

// ========================================
// POST /api/projects
// Create a new project from an AI prompt.
// ========================================

export async function createProject(req, res) {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({
                error: "prompt is required",
            });
        }

        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }

        // Create project immediately so frontend
        // can navigate to the project page while AI works.
        const project = await Project.create({
            name: "Planning project...",
            description: prompt,

            files: {},

            messages: [
                {
                    role: "user",
                    content: prompt,
                    timestamp: new Date(),
                },
                {
                    role: "assistant",
                    content: "Planning project structure...",
                    timestamp: new Date(),
                },
            ],

            version: 0,

            owner: req.user.userId,

            status: "pending",

            filesPlanned: [],
            filesGenerated: [],
            currentFile: null,
            error: null,

            published: false,
        });

        // Start AI generation in the background.
        // This intentionally does not block the HTTP response.
        runBackgroundGeneration(
            project._id.toString(),
            prompt
        ).catch((error) => {
            console.error(
                `[Background AI] Fatal Generation Error For Project ${project._id}:`,
                error
            );
        });

        return res.status(201).json({
            _id: project._id,
            name: project.name,
            description: project.description,
            files: {},
            messages: project.messages,
            version: project.version,
            status: project.status,
            filesPlanned: project.filesPlanned,
            filesGenerated: project.filesGenerated,
            currentFile: project.currentFile,
            error: project.error,
            createdAt: project.createdAt,
        });
    } catch (error) {
        console.error("[Create Project Error]", error);

        return res.status(500).json({
            error: error.message || "Failed to create project",
        });
    }
}

// ========================================
// Background AI Generation
// ========================================

async function runBackgroundGeneration(projectId, prompt) {
    try {
        console.log(
            `[Background AI] Starting generation for project ${projectId}`
        );

        // FIX:
        // generateProject, not generataeProject
        const result = await generateProject(prompt, {
            // --------------------------------
            // AI PLAN CALLBACK
            // --------------------------------
            onPlan: async (plan) => {
                console.log(
                    `[Background AI] Planned ${
                        plan.files.length
                    } files for project ${projectId}`
                );

                const fileList = plan.files
                    .map(
                        (file) =>
                            `- ${file.path}: ${file.description}`
                    )
                    .join("\n");

                await Project.findByIdAndUpdate(
                    projectId,
                    {
                        name:
                            plan.projectName ||
                            plan.projectDescription ||
                            "Generated Project",

                        status: "generating",

                        filesPlanned: plan.files,

                        $push: {
                            messages: {
                                role: "assistant",
                                content:
                                    `Planned website structure:\n${fileList}`,
                                timestamp: new Date(),
                            },
                        },
                    },
                    { new: true }
                );
            },

            // --------------------------------
            // FILE START CALLBACK
            // --------------------------------
            onFileStart: async (path) => {
                console.log(
                    `[Background AI] Starting file ${path} for project ${projectId}`
                );

                await Project.findByIdAndUpdate(
                    projectId,
                    {
                        status: "generating",
                        currentFile: path,
                    }
                );
            },

            // --------------------------------
            // FILE COMPLETE CALLBACK
            // --------------------------------
            onFileComplete: async (path, code) => {
                console.log(
                    `[Background AI] Finished file ${path} for project ${projectId}`
                );

                const project =
                    await Project.findById(projectId);

                if (!project) {
                    console.warn(
                        `[Background AI] Project ${projectId} no longer exists`
                    );
                    return;
                }

                // Make sure files object exists.
                project.files = project.files || {};

                // Save generated file.
                project.files[path] = {
                    content: code,
                    hash: hashContent(code),
                };

                // Avoid duplicate file paths in generated list.
                const previousGenerated =
                    project.filesGenerated || [];

                if (!previousGenerated.includes(path)) {
                    project.filesGenerated = [
                        ...previousGenerated,
                        path,
                    ];
                }

                project.messages.push({
                    role: "assistant",
                    content: `Created file "${path}"`,
                    timestamp: new Date(),
                });

                project.currentFile = null;

                // Required because `files` is Mixed in your schema.
                project.markModified("files");

                await project.save();
            },
        });

        console.log(
            `[Background AI] Successfully generated Project ${projectId}`
        );

        // --------------------------------
        // MARK PROJECT COMPLETE
        // --------------------------------

        const project =
            await Project.findById(projectId);

        if (!project) {
            console.warn(
                `[Background AI] Could not find project ${projectId} after generation`
            );
            return;
        }

        project.status = "completed";
        project.version = 1;
        project.currentFile = null;
        project.error = null;

        if (result?.description) {
            project.name = result.description;
        }

        project.messages.push({
            role: "assistant",
            content:
                "Website generation complete! You can view and edit the files.",
            timestamp: new Date(),
        });

        await project.save();

        console.log(
            `[Background AI] Project ${projectId} marked as completed`
        );
    } catch (error) {
        // IMPORTANT:
        // Use `error`, not `err`.
        console.error(
            `[Background AI] Fatal generation error for project ${projectId}:`,
            error
        );

        try {
            await Project.findByIdAndUpdate(
                projectId,
                {
                    status: "failed",
                    error:
                        error.message ||
                        "AI generation failed",

                    currentFile: null,

                    $push: {
                        messages: {
                            role: "assistant",
                            content:
                                `❌ Generation failed: ${
                                    error.message ||
                                    "Unknown error"
                                }`,
                            timestamp: new Date(),
                        },
                    },
                }
            );
        } catch (dbError) {
            console.error(
                `[Background AI] Failed to update failed project ${projectId}:`,
                dbError
            );
        }
    }
}

// ========================================
// GET /api/projects
// List all projects owned by user.
// ========================================

export async function listProjects(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }

        const projects = await Project.find(
            {
                owner: req.user.userId,
            },
            {
                name: 1,
                description: 1,
                version: 1,
                status: 1,
                error: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        ).sort({
            updatedAt: -1,
        });

        return res.json(projects);
    } catch (error) {
        console.error(
            "[List Projects Error]",
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                "Failed to load projects",
        });
    }
}

// ========================================
// GET /api/projects/:id
// Get full project details.
// ========================================

export async function getProject(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }

        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user.userId,
        });

        if (!project) {
            return res.status(404).json({
                error: "Project Not Found",
            });
        }

        const filesObj = {};

        for (const [path, entry] of Object.entries(
            project.files || {}
        )) {
            // Support both the expected file object
            // and accidental raw string values.
            filesObj[path] =
                typeof entry === "string"
                    ? entry
                    : entry?.content || "";
        }

        return res.json({
            _id: project._id,
            name: project.name,
            description: project.description,
            files: filesObj,
            messages: project.messages,
            version: project.version,
            status: project.status,
            filesPlanned: project.filesPlanned,
            filesGenerated: project.filesGenerated,
            currentFile: project.currentFile,
            error: project.error,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        });
    } catch (error) {
        console.error(
            "[Get Project Error]",
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                "Failed to load project",
        });
    }
}

// ========================================
// DELETE /api/projects/:id
// ========================================

export async function deleteProject(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }

        const result =
            await Project.findOneAndDelete({
                _id: req.params.id,
                owner: req.user.userId,
            });

        if (!result) {
            return res.status(404).json({
                error: "Project not found",
            });
        }

        return res.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "[Delete Project Error]",
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                "Failed to delete project",
        });
    }
}

// ========================================
// PUT /api/projects/:id/files
// Update project files.
// ========================================

export async function updateProjectFiles(req, res) {
    try {
        const { files } = req.body;

        if (
            !files ||
            typeof files !== "object" ||
            Array.isArray(files)
        ) {
            return res.status(400).json({
                error: "files object is required",
            });
        }

        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }

        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user.userId,
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found",
            });
        }

        const newFiles = {};

        for (const [path, content] of Object.entries(
            files
        )) {
            if (typeof content === "string") {
                newFiles[path] = {
                    content,
                    hash: hashContent(content),
                };
            }
        }

        project.files = newFiles;
        project.markModified("files");

        await project.save();

        const filesObj = {};

        for (const [path, entry] of Object.entries(
            project.files || {}
        )) {
            filesObj[path] =
                typeof entry === "string"
                    ? entry
                    : entry?.content || "";
        }

        return res.json({
            _id: project._id,
            name: project.name,
            description: project.description,
            files: filesObj,
            messages: project.messages,
            version: project.version,
            status: project.status,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        });
    } catch (error) {
        console.error(
            "[Update Project Files Error]",
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                "Failed to update project files",
        });
    }
}

// ========================================
// POST /api/projects/:id/publish
// ========================================

export async function publishProject(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }

        const project =
            await Project.findOneAndUpdate(
                {
                    _id: req.params.id,
                    owner: req.user.userId,
                },
                {
                    published: true,
                },
                {
                    new: true,
                }
            );

        if (!project) {
            return res.status(404).json({
                error: "Project not found",
            });
        }

        return res.json({
            success: true,
            published: project.published,
        });
    } catch (error) {
        console.error(
            "[Publish Project Error]",
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                "Failed to publish project",
        });
    }
}

// ========================================
// GET /api/projects/public/:id
// Get a publicly published project.
// ========================================

export async function getPublicProject(req, res) {
    try {
        const project =
            await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                error: "Project not found",
            });
        }

        if (!project.published) {
            return res.status(403).json({
                error: "Project is not Published yet",
            });
        }

        const filesObj = {};

        for (const [path, entry] of Object.entries(
            project.files || {}
        )) {
            filesObj[path] =
                typeof entry === "string"
                    ? entry
                    : entry?.content || "";
        }

        return res.json({
            _id: project._id,
            name: project.name,
            description: project.description,
            files: filesObj,
            version: project.version,
        });
    } catch (error) {
        console.error(
            "[Public Project Error]",
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                "Failed to load public project",
        });
    }
}