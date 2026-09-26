import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            error: "Access Denied. No Session Token Provided.",
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "fallback_secret"
        );

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            error: "Session Expired or Invalid. Please Sign In Again.",
        });
    }
}